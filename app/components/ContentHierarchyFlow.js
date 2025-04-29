'use client';
import React, { useState, useEffect } from 'react';
import ReactFlow, { Background, Controls, ReactFlowProvider, useNodesState, useEdgesState } from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { Button, Modal, Input, message } from 'antd';
import { DeleteOutlined, PlusOutlined, EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { confirm } = Modal;
const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map(node => ({
      ...node,
      position: {
        x: dagreGraph.node(node.id).x - nodeWidth / 2,
        y: dagreGraph.node(node.id).y - nodeHeight / 2
      }
    })),
    edges
  };
};

export default function ContentHierarchyFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [parentId, setParentId] = useState(null);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const fetchHierarchy = async () => {
    try {
      const res = await fetch('/api/contentHierarchy');
      const data = await res.json();
      const rfNodes = data.map(node => ({
        id: node.id.toString(),
        data: { label: node.name },
        position: { x: 0, y: 0 },
        parent_id: node.parent_id
      }));
      const rfEdges = data.filter(node => node.parent_id).map(node => ({
        id: `e${node.parent_id}-${node.id}`,
        source: node.parent_id.toString(),
        target: node.id.toString(),
        animated: true
      }));
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rfNodes, rfEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      if (selectedNodeId) {
        setSelectedNode(layoutedNodes.find(n => n.id === selectedNodeId.toString()) || null);
      }
    } catch (error) {
      console.error('Error fetching content hierarchy:', error);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const onNodeClick = (event, node) => {
    setSelectedNodeId(node.id);
    setSelectedNode(node);
  };

  const onAddNodeClick = () => {
    setParentId(selectedNode ? parseInt(selectedNode.id) : null);
    setIsModalVisible(true);
  };

  const onAddNode = async () => {
    if (!newNodeName) {
      message.error('Enter a node name');
      return;
    }
    try {
      const res = await fetch('/api/contentHierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: parentId, name: newNodeName })
      });
      if (res.ok) {
        message.success('Node added successfully');
        setIsModalVisible(false);
        setNewNodeName('');
        fetchHierarchy();
        window.dispatchEvent(new Event('content-hierarchy-updated'));
      } else {
        const err = await res.json();
        message.error(err.error);
      }
    } catch (error) {
      console.error('Add node error:', error);
      message.error('Error adding node');
    }
  };

  const showDeleteConfirm = () => {
    confirm({
      title: 'Are you sure you want to delete this node?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        deleteNode();
      }
    });
  };

  const deleteNode = async () => {
    if (!selectedNodeId) {
      message.error('No node selected');
      return;
    }
    try {
      const res = await fetch('/api/contentHierarchy', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(selectedNodeId) })
      });
      if (res.ok) {
        message.success('Node deleted successfully');
        setSelectedNodeId(null);
        setSelectedNode(null);
        fetchHierarchy();
        window.dispatchEvent(new Event('content-hierarchy-updated'));
      } else {
        message.error('Error deleting node');
      }
    } catch (error) {
      console.error('Delete node error:', error);
      message.error('Error deleting node');
    }
  };

  const showRenameModal = () => {
    if (selectedNode) {
      setRenameValue(selectedNode.data.label);
      setIsRenameModalVisible(true);
    }
  };

  const renameNode = async () => {
    if (!renameValue.trim()) {
      message.error('Enter a new name');
      return;
    }
    try {
      const res = await fetch('/api/contentHierarchy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(selectedNode.id), name: renameValue })
      });
      if (res.ok) {
        message.success('Node renamed successfully');
        setIsRenameModalVisible(false);
        fetchHierarchy();
        window.dispatchEvent(new Event('content-hierarchy-updated'));
      } else {
        const err = await res.json();
        message.error(err.error);
      }
    } catch (err) {
      console.error('Rename error:', err);
      message.error('Error renaming node');
    }
  };

  return (
    <div style={{ height: '80vh', border: '1px solid #ddd', borderRadius: '4px', position: 'relative' }}>
      <div style={{ padding: '0.5rem' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAddNodeClick}>
          Add Node
        </Button>
        {selectedNode && (
          <>
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={showDeleteConfirm}
              style={{ marginLeft: '0.5rem' }}
            >
              Delete Selected Node
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={showRenameModal}
              style={{ marginLeft: '0.5rem' }}
            >
              Rename Selected Node
            </Button>
          </>
        )}
        <div style={{ marginTop: '0.5rem' }}>
          <strong>Selected Node:</strong>{' '}
          {selectedNode ? `${selectedNode.data.label} (ID: ${selectedNode.id})` : 'None'}
        </div>
      </div>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>

      {/* Add Node Modal */}
      <Modal
        title="Add New Node"
        open={isModalVisible}
        onOk={onAddNode}
        onCancel={() => setIsModalVisible(false)}
      >
        <Input
          placeholder="Enter node name"
          value={newNodeName}
          onChange={(e) => setNewNodeName(e.target.value)}
        />
        {parentId && <p>Parent Node ID: {parentId}</p>}
      </Modal>

      {/* Rename Modal */}
      <Modal
        title="Rename Node"
        open={isRenameModalVisible}
        onOk={renameNode}
        onCancel={() => setIsRenameModalVisible(false)}
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder="New node name"
        />
      </Modal>
    </div>
  );
}




