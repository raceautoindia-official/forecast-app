"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Table,
  Tag,
  Space,
  Tooltip,
  Button,
  message,
  Popconfirm,
  Empty,
  Spin,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";

export default function GraphList() {
  const [graphs, setGraphs] = useState([]);
  const [contentHierarchy, setContentHierarchy] = useState([]);
  const [volumeDataMap, setVolumeDataMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch all three endpoints in parallel
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [graphsRes, hierarchyRes, volRowsRes] = await Promise.all([
        fetch("/api/graphs", {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
          },
        }).then((r) => (r.ok ? r.json() : Promise.reject())),
        fetch("/api/contentHierarchy", {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
          },
        }).then((r) => (r.ok ? r.json() : Promise.reject())),
        fetch("/api/volumeData", {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
          },
        }).then((r) => (r.ok ? r.json() : Promise.reject())),
      ]);

      setGraphs(graphsRes);
      setContentHierarchy(hierarchyRes);

      // Build a map of volumeData by ID
      const volMap = {};
      volRowsRes.forEach((e) => {
        volMap[e.id] = e;
      });
      setVolumeDataMap(volMap);
    } catch (err) {
      console.error(err);
      message.error("Failed to load graphs or related data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Delete a graph and remove it from local state (no full reload)
  const handleDelete = useCallback(async (id) => {
    try {
      const res = await fetch("/api/graphs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json" ,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      message.success("Deleted successfully");
      setGraphs((prev) => prev.filter((g) => g.id !== id));
    } catch {
      message.error("Delete failed");
    }
  }, []);

  // Build a simple id→name map for contentHierarchy lookups
  const idToName = useMemo(() => {
    return Object.fromEntries(contentHierarchy.map((n) => [n.id, n.name]));
  }, [contentHierarchy]);

  // Column definitions (memoized so they don’t recreate unnecessarily)
  const columns = useMemo(
    () => [
      { title: "ID", dataIndex: "id", width: 60 },
      { title: "Name", dataIndex: "name", ellipsis: true },

      {
        title: "Dataset",
        dataIndex: "dataset_ids",
        render: (rawIds) => {
          // Normalize to an array if it’s a single value
          const arr = Array.isArray(rawIds) ? rawIds : [rawIds];
          return (
            <Space size="small">
              {arr.map((rawId) => {
                if (rawId == null) {
                  return (
                    <Tooltip key="none" title="No dataset">
                      <Tag>—</Tag>
                    </Tooltip>
                  );
                }
                const id = Number(rawId);
                const entry = volumeDataMap[id];
                const streamPath = entry?.stream
                  ?.split(",")
                  .map((strId) => idToName[Number(strId)])
                  .filter(Boolean)
                  .join(" > ");
                return (
                  <Tooltip key={id} title={streamPath || `#${id}`}>
                    <Tag>#{id}</Tag>
                  </Tooltip>
                );
              })}
            </Space>
          );
        },
      },

      {
        title: "Forecast Methods",
        dataIndex: "forecast_types",
        render: (ft) => {
          const methods = Array.isArray(ft) ? ft : [];
          if (methods.length === 0) {
            return <em>N/A</em>;
          }
          return methods.map((m) => (
            <Tag key={m}>
              {m === "linear" ? "Linear Regression" : "Score-Based"}
            </Tag>
          ));
        },
      },

      {
        title: "Chart",
        dataIndex: "chart_type",
        render: (t) =>
          typeof t === "string" ? t.charAt(0).toUpperCase() + t.slice(1) : "—",
      },

      {
        title: "Created",
        dataIndex: "created_at",
        render: (dt) => (dt ? new Date(dt).toLocaleString() : "—"),
      },

      {
        title: "Actions",
        key: "actions",
        render: (_, record) => (
          <Popconfirm
            title="Delete this graph?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        ),
      },
    ],
    [volumeDataMap, idToName, handleDelete]
  );

  if (loading) {
    return (
      <Spin
        tip="Loading graphs..."
        style={{ display: "block", marginTop: 50 }}
      />
    );
  }

  if (!graphs.length) {
    return (
      <Empty description="No graphs available" style={{ marginTop: 50 }} />
    );
  }

  return (
    <Table
      rowKey="id"
      dataSource={graphs}
      columns={columns}
      pagination={{ pageSize: 10 }}
    />
  );
}
