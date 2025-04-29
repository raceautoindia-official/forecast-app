'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Tooltip, Button, message, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

export default function GraphList() {
  const [graphs, setGraphs] = useState([]);
  const [contentHierarchy, setContentHierarchy] = useState([]);
  const [volumeDataMap, setVolumeDataMap] = useState({});

  // Fetch everything
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = () => {
    // 1) graphs
    fetch('/api/graphs')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setGraphs)
      .catch(() => message.error('Could not load graph list'));

    // 2) content hierarchy
    fetch('/api/contentHierarchy')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setContentHierarchy)
      .catch(() => message.error('Could not load content hierarchy'));

    // 3) volumeData
    fetch('/api/volumeData')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const m = {};
        data.forEach(e => m[e.id] = e);
        setVolumeDataMap(m);
      })
      .catch(() => message.error('Could not load volume data'));
  };

  const handleDelete = async (id) => {
    try {
      await fetch('/api/graphs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      message.success('Deleted successfully');
      loadAll();
    } catch {
      message.error('Delete failed');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Name', dataIndex: 'name', ellipsis: true },
    {
      title: 'Datasets',
      dataIndex: 'dataset_ids',
      render: ids => (
        <Space size="small">
          {ids.map(rawId => {
            const id = Number(rawId);
            const entry = volumeDataMap[id];
            const streamPath = entry?.stream
              ?.split(',')
              .map(strId => contentHierarchy.find(n => n.id === Number(strId))?.name)
              .filter(Boolean)
              .join(' > ');
            return (
              <Tooltip key={id} title={streamPath || `#${id}`}>
                <Tag>#{id}</Tag>
              </Tooltip>
            );
          })}
        </Space>
      )
    },
    {
      title: 'Forecast Methods',
      dataIndex: 'forecast_types',
      render: f => f.map(m => (
        <Tag key={m}>
          {m === 'linear' ? 'Linear Regression' : 'Score-Based'}
        </Tag>
      ))
    },
    {
      title: 'Chart',
      dataIndex: 'chart_type',
      render: t => t.charAt(0).toUpperCase() + t.slice(1)
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      render: dt => new Date(dt).toLocaleString()
    },
    // ← NEW Actions column
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="Delete this graph?"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <Table
      rowKey="id"
      dataSource={graphs}
      columns={columns}
      pagination={{ pageSize: 10 }}
    />
  );
}
