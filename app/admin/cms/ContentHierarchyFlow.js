"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import {
  Button,
  Modal,
  Input,
  message,
  Spin,
  Empty,
  Select,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  CopyOutlined,
  SnippetsOutlined,
} from "@ant-design/icons";

const { confirm } = Modal;
const { Search } = Input;
const { Option } = Select;
const nodeWidth = 172;
const nodeHeight = 36;

// Auto‐layout with Dagre and styled nodes/edges
const getLayoutedElements = (nodes, edges, direction = "TB") => {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    graph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  return {
    nodes: nodes.map((node) => {
      const { x, y } = graph.node(node.id);
      return {
        ...node,
        position: { x: x - nodeWidth / 2, y: y - nodeHeight / 2 },
        style: {
          background: "#fff",
          border: "2px solid #1890ff",
          borderRadius: 8,
          padding: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          fontSize: 14,
          color: "#333",
        },
      };
    }),
    edges: edges.map((edge) => ({
      ...edge,
      animated: true,
      style: { stroke: "#1890ff", strokeWidth: 2 },
    })),
  };
};

export default function ContentHierarchyFlow() {
  // raw nodes/edges from API:
  const [rawNodes, setRawNodes] = useState([]);
  const [rawEdges, setRawEdges] = useState([]);

  // React Flow state:
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Selected node info:
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Cascade dropdown state:
  const [cascadeSelection, setCascadeSelection] = useState([]);

  // Add/rename modals:
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newNodeName, setNewNodeName] = useState("");
  const [parentId, setParentId] = useState(null);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // UI‐loading state:
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // React Flow instance & wrapper:
  const [rfInstance, setRfInstance] = useState(null);
  const reactFlowWrapper = useRef(null);

  // “Clipboard” for copied subtree:
  const [clipboardNodes, setClipboardNodes] = useState([]);
  const [copiedRootId, setCopiedRootId] = useState(null);

  // 1) Fetch hierarchy (rawNodes/rawEdges) once on mount:
  const fetchHierarchy = useCallback(() => {
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/contentHierarchy", {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
          },
        });
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();

        // Build rawNodes/ rawEdges from API response:
        setRawNodes(
          data.map((n) => ({
            id: String(n.id),
            data: { label: n.name },
            parent_id: n.parent_id,
          }))
        );
        setRawEdges(
          data
            .filter((n) => n.parent_id)
            .map((n) => ({
              id: `e${n.parent_id}-${n.id}`,
              source: String(n.parent_id),
              target: String(n.id),
            }))
        );
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  // 2) Compute Dagre‐layout whenever rawNodes/rawEdges change:
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(rawNodes, rawEdges),
    [rawNodes, rawEdges]
  );
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges]);

  // 3) Highlight the selected node (yellow background) whenever selection changes:
  useEffect(() => {
    setNodes(
      layoutedNodes.map((node) => {
        const baseStyle = node.style;
        return {
          ...node,
          style:
            node.id === selectedNodeId
              ? {
                  ...baseStyle,
                  background: "#fffb8f",
                  border: "2px solid #ffd21d",
                }
              : baseStyle,
        };
      })
    );
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, selectedNodeId]);

  // 4) Build a parent→children map from rawNodes (to traverse descendants):
  const childrenMap = useMemo(
    () =>
      rawNodes.reduce((map, n) => {
        const key = n.parent_id ? String(n.parent_id) : "root";
        (map[key] = map[key] || []).push(n);
        return map;
      }, {}),
    [rawNodes]
  );

  // Helper: collect **all descendants** of a given nodeId (excluding the root itself)
  const collectDescendants = useCallback(
    (rootId) => {
      const result = [];
      const queue = [...(childrenMap[String(rootId)] || [])];

      while (queue.length) {
        const node = queue.shift();
        result.push({
          id: node.id,
          parent: node.parent_id,
          name: node.data.label,
        });
        const kids = childrenMap[String(node.id)] || [];
        queue.push(...kids);
      }
      return result;
    },
    [childrenMap]
  );

  // 5) Center & zoom to a given node on click/search:
  const focusNode = useCallback(
    (id) => {
      const node = layoutedNodes.find((n) => n.id === id);
      if (node && rfInstance && reactFlowWrapper.current) {
        const zoom = 1.5;
        const { width } = reactFlowWrapper.current.getBoundingClientRect();
        const x = width / 2 - node.position.x * zoom;
        const y = 50 - node.position.y * zoom;
        rfInstance.setViewport({ x, y, zoom });
        setSelectedNodeId(id);
        setSelectedNode(node);
      }
    },
    [layoutedNodes, rfInstance]
  );

  // 6) When a dropdown level is changed, update cascade selection & focus:
  const handleLevelSelect = useCallback(
    (level, id) => {
      setCascadeSelection((prev) => {
        const arr = prev.slice(0, level);
        arr[level] = id;
        return arr;
      });
      id && focusNode(id);
    },
    [focusNode]
  );

  // 7) Add a new node under parentId:
  const onAddNode = useCallback(async () => {
    if (!newNodeName.trim()) return message.error("Enter node name");
    setModalLoading(true);
    try {
      const res = await fetch("/api/contentHierarchy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
        },
        body: JSON.stringify({ parent_id: parentId, name: newNodeName }),
      });
      if (!res.ok) throw new Error("Add failed");
      message.success("Node added");
      setIsAddModalVisible(false);
      setNewNodeName("");
      fetchHierarchy();
    } catch (e) {
      message.error(e.message);
    } finally {
      setModalLoading(false);
    }
  }, [newNodeName, parentId, fetchHierarchy]);

  // 8) Delete a single selected node:
  const deleteNode = useCallback(async () => {
    if (!selectedNodeId) return message.error("Select a node first");
    setModalLoading(true);
    try {
      const res = await fetch("/api/contentHierarchy", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
        },
        body: JSON.stringify({ id: Number(selectedNodeId) }),
      });
      if (!res.ok) throw new Error("Delete failed");
      message.success("Node deleted");
      setSelectedNodeId(null);
      setSelectedNode(null);
      fetchHierarchy();
    } catch (e) {
      message.error(e.message);
    } finally {
      setModalLoading(false);
    }
  }, [selectedNodeId, fetchHierarchy]);

  // 9) Rename a node:
  const renameNode = useCallback(async () => {
    if (!renameValue.trim()) return message.error("Enter new name");
    setModalLoading(true);
    try {
      const res = await fetch("/api/contentHierarchy", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
        },
        body: JSON.stringify({ id: Number(selectedNodeId), name: renameValue }),
      });
      if (!res.ok) throw new Error("Rename failed");
      message.success("Node renamed");
      setIsRenameModalVisible(false);
      fetchHierarchy();
    } catch (e) {
      message.error(e.message);
    } finally {
      setModalLoading(false);
    }
  }, [renameValue, selectedNodeId, fetchHierarchy]);

  // 10) Copy subtree descendants into “clipboard”
  const handleCopy = () => {
    if (!selectedNodeId) {
      message.error("Select a node first to copy its subtree.");
      return;
    }
    const descendants = collectDescendants(selectedNodeId);
    if (!descendants.length) {
      message.info("Selected node has no children to copy.");
      return;
    }
    setClipboardNodes(descendants);
    setCopiedRootId(selectedNodeId);
    message.success(`Copied ${descendants.length} descendant nodes.`);
  };

  // 11) Paste those copied descendants under the newly selected node
  const handlePaste = useCallback(async () => {
    if (!selectedNodeId) {
      message.error("Select a node to paste into.");
      return;
    }
    if (!clipboardNodes.length) {
      message.error("Nothing copied. Copy a subtree first.");
      return;
    }

    // We'll track oldId → newId mapping so children attach correctly
    const newIdMap = {};
    try {
      for (const item of clipboardNodes) {
        let newParentId;
        if (String(item.parent) === String(copiedRootId)) {
          // If its old parent was the copied root, attach it under the new target
          newParentId = Number(selectedNodeId);
        } else {
          // Otherwise look up the newly created ID of its old parent
          newParentId = newIdMap[item.parent];
        }

        const res = await fetch("/api/contentHierarchy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
          },
          body: JSON.stringify({
            parent_id: newParentId,
            name:      item.name,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to insert node");
        }
        const created = await res.json();
        newIdMap[item.id] = created.id;
      }

      message.success("Subtree pasted successfully.");
      setClipboardNodes([]);
      setCopiedRootId(null);
      fetchHierarchy();
    } catch (err) {
      console.error(err);
      message.error("Paste failed: " + err.message);
    }
  }, [clipboardNodes, copiedRootId, selectedNodeId, fetchHierarchy]);

  // 12) **New**: Recursively delete all descendants of the selected node (but not the node itself):
  const handleDeleteDescendants = useCallback(() => {
    if (!selectedNodeId) {
      message.error("Select a node first to delete its descendants.");
      return;
    }
    confirm({
      title: "Delete all descendants?",
      icon: <ExclamationCircleOutlined />,
      content:
        "This will remove all child nodes (and their children) under the selected node. This cannot be undone.",
      onOk: async () => {
        try {
          // Recursive function: delete from leaves up
          const deleteSubtree = async (nodeId) => {
            const kids = childrenMap[String(nodeId)] || [];
            // First delete all children recursively
            for (const kid of kids) {
              await deleteSubtree(kid.id);
            }
            // Then delete this node itself
            await fetch("/api/contentHierarchy", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
              },
              body: JSON.stringify({ id: Number(nodeId) }),
            });
          };

          // Gather direct children of selectedNodeId, then delete each subtree
          const directKids = childrenMap[String(selectedNodeId)] || [];
          for (const child of directKids) {
            await deleteSubtree(child.id);
          }

          message.success("All descendants deleted.");
          setSelectedNodeId(null);
          setSelectedNode(null);
          fetchHierarchy();
        } catch (e) {
          console.error(e);
          message.error("Failed to delete descendants: " + e.message);
        }
      },
    });
  }, [selectedNodeId, childrenMap, fetchHierarchy]);

  // 13) Search handler:
  const onSearchNode = useCallback(
    (val) => {
      const found = rawNodes.find((n) =>
        n.data.label.toLowerCase().includes(val.toLowerCase())
      );
      found ? focusNode(found.id) : message.error("Not found");
    },
    [rawNodes, focusNode]
  );

  // 14) Show loading spinner / error if needed:
  if (loading)
    return <Spin tip="Loading..." style={{ width: "100%", marginTop: 20 }} />;
  if (error) return <Empty description={error} style={{ marginTop: 20 }} />;

  // 15) Build cascade dropdowns at the top:
  const dropdowns = [];
  let parent = "root";
  for (let lvl = 0; ; lvl++) {
    const list = childrenMap[parent] || [];
    if (lvl > 0 && (!cascadeSelection[lvl - 1] || !list.length)) break;
    dropdowns.push(
      <Select
        key={lvl}
        placeholder={`Level ${lvl}`}
        style={{ minWidth: 140, marginRight: 8, marginBottom: 8 }}
        value={cascadeSelection[lvl] || null}
        onChange={(v) => handleLevelSelect(lvl, v)}
        allowClear
      >
        {list.map((n) => (
          <Option key={n.id} value={n.id}>
            {n.data.label}
          </Option>
        ))}
      </Select>
    );
    parent = cascadeSelection[lvl] || "root";
    if (!cascadeSelection[lvl]) break;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "80vh",
        border: "1px solid #ccc",
        borderRadius: 6,
        background: "#f9f9f9",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          padding: 12,
          background: "#fff",
          borderBottom: "1px solid #e8e8e8",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap" }}>{dropdowns}</div>
        <Search
          placeholder="Search Node"
          onSearch={onSearchNode}
          style={{ width: 240, marginBottom: 8 }}
          allowClear
        />
        <Button
          icon={<PlusOutlined />}
          type="primary"
          style={{ marginRight: 8 }}
          onClick={() => {
            setParentId(selectedNode ? selectedNode.id : null);
            setIsAddModalVisible(true);
          }}
        >
          Add Node
        </Button>
        {selectedNode && (
          <>
            <Button
              danger
              icon={<DeleteOutlined />}
              style={{ marginRight: 8 }}
              onClick={() =>
                confirm({
                  title: "Confirm delete?",
                  icon: <ExclamationCircleOutlined />,
                  onOk: deleteNode,
                })
              }
            >
              Delete Node
            </Button>
            <Button
              icon={<EditOutlined />}
              style={{ marginRight: 8 }}
              onClick={() => {
                setRenameValue(selectedNode.data.label);
                setIsRenameModalVisible(true);
              }}
            >
              Rename Node
            </Button>
          </>
        )}
        <Button
          icon={<CopyOutlined />}
          style={{ marginLeft: 8 }}
          onClick={handleCopy}
          disabled={!selectedNodeId}
        >
          Copy Subtree
        </Button>
        <Button
          icon={<SnippetsOutlined />}
          style={{ marginLeft: 8 }}
          onClick={handlePaste}
          disabled={!clipboardNodes.length || !selectedNodeId}
        >
          Paste Subtree
        </Button>
        {/* ↓ New “Delete Descendants” button ↓ */}
        <Button
          danger
          icon={<DeleteOutlined />}
          style={{ marginLeft: 8 }}
          onClick={handleDeleteDescendants}
          disabled={!selectedNodeId}
        >
          Delete Descendants
        </Button>
        <div style={{ marginTop: 8 }}>
          {selectedNode ? (
            <>
              <strong>Selected Node:</strong>{" "}
              <span>
                {selectedNode.data.label} (ID: {selectedNode.id})
              </span>
            </>
          ) : (
            "No selection"
          )}
        </div>
      </div>

      {/* React Flow canvas */}
      <div ref={reactFlowWrapper} style={{ flex: 1, minHeight: 0 }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onInit={(instance) => {
              setRfInstance(instance);
              instance.fitView({ padding: 0.1 });
            }}
            onNodeClick={(e, n) => focusNode(n.id)}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodesDraggable={false}
            style={{ width: "100%", height: "100%", background: "#f0f2f5" }}
          >
            <Background color="#888" gap={16} size={1} />
            {/* <Controls showInteractive={false} style={{ right: 12, top: 12 }} /> */}
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {/* Add Node Modal */}
      <Modal
        title="Add Node"
        open={isAddModalVisible}
        onOk={onAddNode}
        confirmLoading={modalLoading}
        onCancel={() => setIsAddModalVisible(false)}
      >
        <Input
          value={newNodeName}
          onChange={(e) => setNewNodeName(e.target.value)}
          placeholder="Node name"
        />
      </Modal>

      {/* Rename Node Modal */}
      <Modal
        title="Rename Node"
        open={isRenameModalVisible}
        onOk={renameNode}
        confirmLoading={modalLoading}
        onCancel={() => setIsRenameModalVisible(false)}
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder="New name"
        />
      </Modal>
    </div>
  );
}


// "use client";
// import React, {
//   useState,
//   useEffect,
//   useMemo,
//   useCallback,
//   useRef,
// } from "react";
// import ReactFlow, {
//   Background,
//   Controls,
//   ReactFlowProvider,
//   useNodesState,
//   useEdgesState,
// } from "reactflow";

// import dagre from "dagre";
// import "reactflow/dist/style.css";
// import {
//   Button,
//   Modal,
//   Input,
//   message,
//   Spin,
//   Empty,
//   Select,
// } from "antd";
// import {
//   DeleteOutlined,
//   PlusOutlined,
//   EditOutlined,
//   ExclamationCircleOutlined,
// } from "@ant-design/icons";
// import { SnippetsOutlined } from "@ant-design/icons";

// import { CopyOutlined} from "@ant-design/icons";



// const { confirm } = Modal;
// const { Search } = Input;
// const { Option } = Select;
// const nodeWidth = 172;
// const nodeHeight = 36;

// // Auto-layout with Dagre and styled nodes/edges
// const getLayoutedElements = (nodes, edges, direction = "TB") => {
//   const graph = new dagre.graphlib.Graph();
//   graph.setDefaultEdgeLabel(() => ({}));
//   graph.setGraph({ rankdir: direction });

//   nodes.forEach((node) => {
//     graph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
//   });
//   edges.forEach((edge) => {
//     graph.setEdge(edge.source, edge.target);
//   });

//   dagre.layout(graph);

//   return {
//     nodes: nodes.map((node) => {
//       const { x, y } = graph.node(node.id);
//       return {
//         ...node,
//         position: { x: x - nodeWidth / 2, y: y - nodeHeight / 2 },
//         style: {
//           background: "#fff",
//           border: "2px solid #1890ff",
//           borderRadius: 8,
//           padding: 8,
//           boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
//           fontSize: 14,
//           color: "#333",
//         },
//       };
//     }),
//     edges: edges.map((edge) => ({
//       ...edge,
//       animated: true,
//       style: { stroke: "#1890ff", strokeWidth: 2 },
//     })),
//   };
// };

// export default function ContentHierarchyFlow() {
//   // raw nodes/edges
//   const [rawNodes, setRawNodes] = useState([]);
//   const [rawEdges, setRawEdges] = useState([]);

//   // React Flow state
//   const [nodes, setNodes, onNodesChange] = useNodesState([]);
//   const [edges, setEdges, onEdgesChange] = useEdgesState([]);

//   // selected node
//   const [selectedNodeId, setSelectedNodeId] = useState(null);
//   const [selectedNode, setSelectedNode] = useState(null);

//   // cascade dropdown state
//   const [cascadeSelection, setCascadeSelection] = useState([]);

//   // modal/form state
//   const [isAddModalVisible, setIsAddModalVisible] = useState(false);
//   const [newNodeName, setNewNodeName] = useState("");
//   const [parentId, setParentId] = useState(null);
//   const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
//   const [renameValue, setRenameValue] = useState("");

//   // UI state
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [modalLoading, setModalLoading] = useState(false);

//   // React Flow instance & wrapper
//   const [rfInstance, setRfInstance] = useState(null);
//   const reactFlowWrapper = useRef(null);

//   // “Clipboard” for copied subtree
//   const [clipboardNodes, setClipboardNodes] = useState([]);
//   const [copiedRootId, setCopiedRootId] = useState(null);

//   // fetch hierarchy once
//   const fetchHierarchy = useCallback(() => {
//     const controller = new AbortController();
//     (async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const res = await fetch("/api/contentHierarchy", {
//           signal: controller.signal,
//           headers: {
//             Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
//           },
//         });
//         if (!res.ok) throw new Error("Fetch failed");
//         const data = await res.json();
//         setRawNodes(
//           data.map((n) => ({
//             id: String(n.id),
//             data: { label: n.name },
//             parent_id: n.parent_id,
//           }))
//         );
//         setRawEdges(
//           data
//             .filter((n) => n.parent_id)
//             .map((n) => ({
//               id: `e${n.parent_id}-${n.id}`,
//               source: String(n.parent_id),
//               target: String(n.id),
//             }))
//         );
//       } catch (e) {
//         if (e.name !== "AbortError") setError(e.message);
//       } finally {
//         setLoading(false);
//       }
//     })();
//     return () => controller.abort();
//   }, []);

//   useEffect(() => {
//     fetchHierarchy();
//   }, [fetchHierarchy]);

//   // layout computation
//   const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
//     () => getLayoutedElements(rawNodes, rawEdges),
//     [rawNodes, rawEdges]
//   );
//   useEffect(() => {
//     setNodes(layoutedNodes);
//     setEdges(layoutedEdges);
//   }, [layoutedNodes, layoutedEdges]);

//   // highlight the selected node
//   useEffect(() => {
//     setNodes(
//       layoutedNodes.map((node) => {
//         const baseStyle = node.style;
//         return {
//           ...node,
//           style:
//             node.id === selectedNodeId
//               ? {
//                   ...baseStyle,
//                   background: "#fffb8f",
//                   border: "2px solid #ffd21d",
//                 }
//               : baseStyle,
//         };
//       })
//     );
//     setEdges(layoutedEdges);
//   }, [layoutedNodes, layoutedEdges, selectedNodeId]);

//   // build parent->children map
//   const childrenMap = useMemo(
//     () =>
//       rawNodes.reduce((map, n) => {
//         const key = n.parent_id ? String(n.parent_id) : "root";
//         (map[key] = map[key] || []).push(n);
//         return map;
//       }, {}),
//     [rawNodes]
//   );

//   // Helper: collect all descendants of a given rootId (excluding root itself)
//   const collectDescendants = useCallback(
//     (rootId) => {
//       const result = [];
//       const queue = [...(childrenMap[String(rootId)] || [])];

//       while (queue.length) {
//         const node = queue.shift();
//         result.push({
//           oldId: node.id,
//           name: node.data.label,
//           parent: node.parent_id,
//         });
//         // enqueue this node’s children
//         const kids = childrenMap[String(node.id)] || [];
//         queue.push(...kids);
//       }
//       return result;
//     },
//     [childrenMap]
//   );

//   // focus on node (top-center)
//   const focusNode = useCallback(
//     (id) => {
//       const node = layoutedNodes.find((n) => n.id === id);
//       if (node && rfInstance && reactFlowWrapper.current) {
//         const zoom = 1.5;
//         const { width } = reactFlowWrapper.current.getBoundingClientRect();
//         const x = width / 2 - node.position.x * zoom;
//         const y = 50 - node.position.y * zoom;
//         rfInstance.setViewport({ x, y, zoom });
//         setSelectedNodeId(id);
//         setSelectedNode(node);
//       }
//     },
//     [layoutedNodes, rfInstance]
//   );

//   // cascade dropdown handler
//   const handleLevelSelect = useCallback(
//     (level, id) => {
//       setCascadeSelection((prev) => {
//         const arr = prev.slice(0, level);
//         arr[level] = id;
//         return arr;
//       });
//       id && focusNode(id);
//     },
//     [focusNode]
//   );

//   // node operations
//   const onAddNode = useCallback(async () => {
//     if (!newNodeName.trim()) return message.error("Enter node name");
//     setModalLoading(true);
//     try {
//       const res = await fetch("/api/contentHierarchy", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
//         },
//         body: JSON.stringify({ parent_id: parentId, name: newNodeName }),
//       });
//       if (!res.ok) throw new Error("Add failed");
//       message.success("Node added");
//       setIsAddModalVisible(false);
//       setNewNodeName("");
//       fetchHierarchy();
//     } catch (e) {
//       message.error(e.message);
//     } finally {
//       setModalLoading(false);
//     }
//   }, [newNodeName, parentId, fetchHierarchy]);

//   const deleteNode = useCallback(async () => {
//     if (!selectedNodeId) return message.error("Select a node first");
//     setModalLoading(true);
//     try {
//       const res = await fetch("/api/contentHierarchy", {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
//         },
//         body: JSON.stringify({ id: Number(selectedNodeId) }),
//       });
//       if (!res.ok) throw new Error("Delete failed");
//       message.success("Node deleted");
//       setSelectedNodeId(null);
//       setSelectedNode(null);
//       fetchHierarchy();
//     } catch (e) {
//       message.error(e.message);
//     } finally {
//       setModalLoading(false);
//     }
//   }, [selectedNodeId, fetchHierarchy]);

//   const renameNode = useCallback(async () => {
//     if (!renameValue.trim()) return message.error("Enter new name");
//     setModalLoading(true);
//     try {
//       const res = await fetch("/api/contentHierarchy", {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
//         },
//         body: JSON.stringify({ id: Number(selectedNodeId), name: renameValue }),
//       });
//       if (!res.ok) throw new Error("Rename failed");
//       message.success("Node renamed");
//       setIsRenameModalVisible(false);
//       fetchHierarchy();
//     } catch (e) {
//       message.error(e.message);
//     } finally {
//       setModalLoading(false);
//     }
//   }, [renameValue, selectedNodeId, fetchHierarchy]);

//   // Copy handler: store selectedNodeId’s descendants in clipboard
//   const handleCopy = () => {
//     if (!selectedNodeId) {
//       message.error("Select a node first to copy its subtree.");
//       return;
//     }
//     const descendants = collectDescendants(selectedNodeId);
//     if (!descendants.length) {
//       message.info("Selected node has no children to copy.");
//       return;
//     }
//     setClipboardNodes(descendants);
//     setCopiedRootId(selectedNodeId);
//     message.success(`Copied ${descendants.length} descendant nodes.`);
//   };

//   // Paste handler: re-create clipboardNodes under selectedNodeId
//   const handlePaste = useCallback(async () => {
//     if (!selectedNodeId) {
//       message.error("Select a node to paste into.");
//       return;
//     }
//     if (!clipboardNodes.length) {
//       message.error("Nothing copied. Copy a subtree first.");
//       return;
//     }

//     const newIdMap = {};
//     try {
//       for (const item of clipboardNodes) {
//         let newParentId;
//         // If item’s old parent was the copied root, attach under the new target
//         if (String(item.parent) === String(copiedRootId)) {
//           newParentId = Number(selectedNodeId);
//         } else {
//           // Otherwise, find the newly created ID of its old parent
//           newParentId = newIdMap[item.parent];
//         }

//         const res = await fetch("/api/contentHierarchy", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
//           },
//           body: JSON.stringify({
//             parent_id: newParentId,
//             name: item.name,
//           }),
//         });
//         if (!res.ok) {
//           const err = await res.json();
//           throw new Error(err.error || "Failed to insert node");
//         }
//         const created = await res.json();
//         newIdMap[item.oldId] = created.id;
//       }

//       message.success("Subtree pasted successfully.");
//       setClipboardNodes([]);
//       setCopiedRootId(null);
//       fetchHierarchy();
//     } catch (err) {
//       console.error(err);
//       message.error("Paste failed: " + err.message);
//     }
//   }, [clipboardNodes, copiedRootId, selectedNodeId, fetchHierarchy]);

//   // search handler
//   const onSearchNode = useCallback(
//     (val) => {
//       const found = rawNodes.find((n) =>
//         n.data.label.toLowerCase().includes(val.toLowerCase())
//       );
//       found ? focusNode(found.id) : message.error("Not found");
//     },
//     [rawNodes, focusNode]
//   );

//   // loading / error
//   if (loading)
//     return <Spin tip="Loading..." style={{ width: "100%", marginTop: 20 }} />;
//   if (error) return <Empty description={error} style={{ marginTop: 20 }} />;

//   // build cascade dropdowns
//   const dropdowns = [];
//   let parent = "root";
//   for (let lvl = 0; ; lvl++) {
//     const list = childrenMap[parent] || [];
//     if (lvl > 0 && (!cascadeSelection[lvl - 1] || !list.length)) break;
//     dropdowns.push(
//       <Select
//         key={lvl}
//         placeholder={`Level ${lvl}`}
//         style={{ minWidth: 140, marginRight: 8, marginBottom: 8 }}
//         value={cascadeSelection[lvl] || null}
//         onChange={(v) => handleLevelSelect(lvl, v)}
//         allowClear
//       >
//         {list.map((n) => (
//           <Option key={n.id} value={n.id}>
//             {n.data.label}
//           </Option>
//         ))}
//       </Select>
//     );
//     parent = cascadeSelection[lvl] || "root";
//     if (!cascadeSelection[lvl]) break;
//   }

//   return (
//     <div
//       style={{
//         display: "flex",
//         flexDirection: "column",
//         height: "80vh",
//         border: "1px solid #ccc",
//         borderRadius: 6,
//         background: "#f9f9f9",
//       }}
//     >
//       <div
//         style={{
//           padding: 12,
//           background: "#fff",
//           borderBottom: "1px solid #e8e8e8",
//         }}
//       >
//         <div style={{ display: "flex", flexWrap: "wrap" }}>{dropdowns}</div>
//         <Search
//           placeholder="Search Node"
//           onSearch={onSearchNode}
//           style={{ width: 240, marginBottom: 8 }}
//           allowClear
//         />
//         <Button
//           icon={<PlusOutlined />}
//           type="primary"
//           style={{ marginRight: 8 }}
//           onClick={() => {
//             setParentId(selectedNode ? selectedNode.id : null);
//             setIsAddModalVisible(true);
//           }}
//         >
//           Add Node
//         </Button>
//         {selectedNode && (
//           <>
//             <Button
//               danger
//               icon={<DeleteOutlined />}
//               style={{ marginRight: 8 }}
//               onClick={() =>
//                 confirm({
//                   title: "Confirm delete?",
//                   icon: <ExclamationCircleOutlined />,
//                   onOk: deleteNode,
//                 })
//               }
//             >
//               Delete
//             </Button>
//             <Button
//               icon={<EditOutlined />}
//               style={{ marginRight: 8 }}
//               onClick={() => {
//                 setRenameValue(selectedNode.data.label);
//                 setIsRenameModalVisible(true);
//               }}
//             >
//               Rename
//             </Button>
//           </>
//         )}
//         <Button
//           icon={<CopyOutlined />}
//           style={{ marginLeft: 8 }}
//           onClick={handleCopy}
//           disabled={!selectedNodeId}
//         >
//           Copy Subtree
//         </Button>
//         <Button
//           icon={<SnippetsOutlined />}
//           style={{ marginLeft: 8 }}
//           onClick={handlePaste}
//           disabled={!clipboardNodes.length || !selectedNodeId}
//         >
//           Paste Subtree
//         </Button>
//         <div style={{ marginTop: 8 }}>
//           {selectedNode ? (
//             <>
//               <strong>Selected Node:</strong>{" "}
//               <span>
//                 {selectedNode.data.label} (ID: {selectedNode.id})
//               </span>
//             </>
//           ) : (
//             "No selection"
//           )}
//         </div>
//       </div>
//       <div ref={reactFlowWrapper} style={{ flex: 1, minHeight: 0 }}>
//         <ReactFlowProvider>
//           <ReactFlow
//             nodes={nodes}
//             edges={edges}
//             onInit={(instance) => {
//               setRfInstance(instance);
//               instance.fitView({ padding: 0.1 });
//             }}
//             onNodeClick={(e, n) => focusNode(n.id)}
//             onNodesChange={onNodesChange}
//             onEdgesChange={onEdgesChange}
//             nodesDraggable={false}
//             style={{ width: "100%", height: "100%", background: "#f0f2f5" }}
//           >
//             <Background color="#888" gap={16} size={1} />
//             {/* <Controls showInteractive={false} style={{ right: 12, top: 12 }} /> */}
//           </ReactFlow>
//         </ReactFlowProvider>
//       </div>
//       <Modal
//         title="Add Node"
//         open={isAddModalVisible}
//         onOk={onAddNode}
//         confirmLoading={modalLoading}
//         onCancel={() => setIsAddModalVisible(false)}
//       >
//         <Input
//           value={newNodeName}
//           onChange={(e) => setNewNodeName(e.target.value)}
//           placeholder="Node name"
//         />
//       </Modal>
//       <Modal
//         title="Rename Node"
//         open={isRenameModalVisible}
//         onOk={renameNode}
//         confirmLoading={modalLoading}
//         onCancel={() => setIsRenameModalVisible(false)}
//       >
//         <Input
//           value={renameValue}
//           onChange={(e) => setRenameValue(e.target.value)}
//           placeholder="New name"
//         />
//       </Modal>
//     </div>
//   );
// }
