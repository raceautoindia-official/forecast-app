// File: app/components/CreateGraph.js
'use client';

import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Button, message, Space } from 'antd';

export default function CreateGraph() {
  const [form] = Form.useForm();
  const [datasets, setDatasets] = useState([]);
  const [hierarchyMap, setHierarchyMap] = useState({});

  const forecastTypes = [
    { label: 'Linear Regression', value: 'linear' },
    { label: 'Score-Based',       value: 'score'  },
  ];
  const chartTypes = [
    { label: 'Line Chart', value: 'line' },
    { label: 'Bar Chart',  value: 'bar'  },
    { label: 'Pie Chart',  value: 'pie'  },
  ];

  useEffect(() => {
    // Fetch both volumeData and contentHierarchy in parallel
    Promise.all([
      fetch('/api/volumeData').then(r => r.json()),
      fetch('/api/contentHierarchy').then(r => r.json())
    ]).then(([volRows, hierarchy]) => {
      // build a lookup: id -> name
      const map = Object.fromEntries(hierarchy.map(n => [n.id.toString(), n.name]));
      setHierarchyMap(map);

      // now map each volume_data row into a Select option
      const opts = volRows.map(d => {
        const streamNames = d.stream
          .split(',')
          .map(id => map[id] || id)
          .join(' > ');
        const date = new Date(d.createdAt).toLocaleDateString();
        return {
          label: `#${d.id} — ${streamNames} (${date})`,
          value: d.id
        };
      });
      setDatasets(opts);
    })
    .catch(err => {
      console.error(err);
      message.error('Failed to load datasets or hierarchy');
    });
  }, []);

  const onFinish = async (values) => {
    try {
      const res = await fetch('/api/graphs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           values.name,
          datasetIds:     values.datasetIds,
          forecastTypes:  values.forecastTypes,
          chartType:      values.chartType,
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      const created = await res.json();
      message.success(`Graph "${created.name}" (#${created.id}) created!`);
      form.resetFields();
    } catch (e) {
      message.error(e.message);
    }
  };
  

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <h2>Create Graph</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          chartType:    'line',
          forecastTypes: ['linear'],
        }}
      >
        <Form.Item
          name="name"
          label="Graph Name"
          rules={[{ required: true, message: 'Please enter a graph name' }]}
        >
          <Input placeholder="e.g. Sales Trend 2020–2025" />
        </Form.Item>

        <Form.Item
          name="datasetIds"
          label="Historical Datasets"
          rules={[
            { required: true, type: 'array', min: 1, message: 'Select at least one dataset' }
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Choose one or more datasets"
            options={datasets}
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="forecastTypes"
          label="Forecast Methods"
          rules={[
            { required: true, type: 'array', min: 1, message: 'Select at least one method' }
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Select forecasting methods"
            options={forecastTypes}
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="chartType"
          label="Chart Type"
          rules={[{ required: true, message: 'Select a chart type' }]}
        >
          <Select
            placeholder="Select chart visualization"
            options={chartTypes}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Create Graph
            </Button>
            <Button onClick={() => form.resetFields()}>
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}

