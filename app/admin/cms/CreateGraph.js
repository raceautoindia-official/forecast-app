"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Form, Input, Select, Button, message, Space, Spin } from "antd";

export default function CreateGraph() {
  const [form] = Form.useForm();
  const [datasets, setDatasets] = useState([]);
  const [hierarchyMap, setHierarchyMap] = useState({});
  const [loading, setLoading] = useState(true);

  const forecastTypes = [
    { label: "Linear Regression", value: "linear" },
    { label: "Score-Based", value: "score" },
  ];
  const chartTypes = [
    { label: "Line Chart", value: "line" },
    { label: "Bar Chart", value: "bar" },
    { label: "Pie Chart", value: "pie" },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [volRows, hierarchy] = await Promise.all([
          fetch("/api/volumeData", {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`, 
            },
          }).then((r) => r.json()),
          fetch("/api/contentHierarchy", {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`, 
            },
          }).then((r) => r.json()),
        ]);
        const map = Object.fromEntries(
          hierarchy.map((n) => [n.id.toString(), n.name])
        );
        setHierarchyMap(map);
        const opts = volRows.map((d) => {
          const streamNames = d.stream
            .split(",")
            .map((id) => map[id] || id)
            .join(" > ");
          const date = new Date(d.createdAt).toLocaleDateString();
          return { label: `#${d.id} — ${streamNames} (${date})`, value: d.id };
        });
        setDatasets(opts);
      } catch (e) {
        console.error(e);
        message.error("Failed to load datasets or hierarchy");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const onFinish = useCallback(
    async (values) => {
      try {
        console.log("values ", values);
        const payload = {
          name: values.name,
          datasetIds: values.datasetId,
          chartType: values.chartType,
        };
        console.log("payload ", payload);
        if (values.chartType === "line" && values.forecastTypes) {
          payload.forecastTypes = values.forecastTypes;
        }
        const res = await fetch("/api/graphs", {
          method: "POST",
          headers: {
          "Content-Type": "application/json" ,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`
        },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Save failed");
        }
        const created = await res.json();
        message.success(`Graph "${created.name}" (#${created.id}) created!`);
        form.resetFields();
      } catch (e) {
        message.error(e.message || "Creation failed");
      }
    },
    [form]
  );

  if (loading) {
    return (
      <Spin
        tip="Loading datasets..."
        style={{ display: "block", marginTop: 50 }}
      />
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 16 }}>
      <h2>Create Graph</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ chartType: "line" }}
      >
        <Form.Item
          name="name"
          label="Graph Name"
          rules={[{ required: true, message: "Please enter a graph name" }]}
        >
          <Input placeholder="e.g. Sales Trend 2020–2025" />
        </Form.Item>

        <Form.Item
          name="datasetId"
          label="Historical Dataset"
          rules={[{ required: true, message: "Select a dataset" }]}
        >
          <Select
            placeholder="Choose a dataset"
            options={datasets}
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="chartType"
          label="Chart Type"
          rules={[{ required: true, message: "Select a chart type" }]}
        >
          <Select
            placeholder="Select chart visualization"
            options={chartTypes}
          />
        </Form.Item>

        {/* Conditionally render Forecast Methods for Line Chart */}
        <Form.Item noStyle dependencies={["chartType"]}>
          {({ getFieldValue }) =>
            getFieldValue("chartType") === "line" ? (
              <Form.Item name="forecastTypes">
                <Select
                  mode="multiple"
                  placeholder="Select forecasting methods"
                  options={forecastTypes}
                  allowClear
                />
              </Form.Item>
            ) : null
          }
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Create Graph
            </Button>
            <Button onClick={() => form.resetFields()}>Reset</Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
