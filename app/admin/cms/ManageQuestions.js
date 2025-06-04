// File: app/components/ManageQuestions.js
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Popconfirm,
  message,
  Row,
  Col,
  Typography
} from 'antd';

const { Text } = Typography;

export default function ManageQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // filter state: 'all' | 'positive' | 'negative'
  const [filterType, setFilterType] = useState('all');

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/questions', {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`, 
            },
          });
      const data = await res.json();
      setQuestions(data);
    } catch {
      message.error('Could not load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const onFinish = async (values) => {
    try {
      await fetch('/api/questions', {
        method: 'POST',
         headers: {
          "Content-Type": "application/json" ,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`
        },
        body: JSON.stringify(values)
      });
      message.success('Question added');
      form.resetFields();
      fetchQuestions();
    } catch {
      message.error('Add failed');
    }
  };

  const deleteQuestion = async (id) => {
    try {
      await fetch('/api/questions', {
        method: 'DELETE',
         headers: {
          "Content-Type": "application/json" ,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`
        },
        body: JSON.stringify({ id })
      });
      message.success('Deleted');
      fetchQuestions();
    } catch {
      message.error('Delete failed');
    }
  };

  // coerce weight to Number so reduce stays numeric
  const totalPositive = questions
    .filter(q => q.type === 'positive')
    .reduce((sum, q) => sum + Number(q.weight || 0), 0);

  const totalNegative = questions
    .filter(q => q.type === 'negative')
    .reduce((sum, q) => sum + Number(q.weight || 0), 0);

  // filter what's shown
  const displayed = questions.filter(q => {
    if (filterType === 'all') return true;
    return q.type === filterType;
  });

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Question', dataIndex: 'text', ellipsis: true },
    { title: 'Weight', dataIndex: 'weight' },
    {
      title: 'Type',
      dataIndex: 'type',
      render: t => t.charAt(0).toUpperCase() + t.slice(1)
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      render: dt => new Date(dt).toLocaleString()
    },
    {
      title: 'Action',
      render: (_, record) => (
        <Popconfirm
          title="Delete this question?"
          onConfirm={() => deleteQuestion(record.id)}
        >
          <a>Delete</a>
        </Popconfirm>
      )
    }
  ];

  return (
    <>
      <Form
        form={form}
        layout="inline"
        onFinish={onFinish}
        style={{ marginBottom: 16 }}
      >
        <Form.Item
          name="text"
          rules={[{ required: true, message: 'Question text required' }]}
        >
          <Input placeholder="Question" style={{ width: 300 }} />
        </Form.Item>
        <Form.Item
          name="weight"
          rules={[{ required: true, message: 'Weight required' }]}
        >
          <InputNumber placeholder="Weight" min={0} max={1} step={0.01} />
        </Form.Item>
        <Form.Item
          name="type"
          rules={[{ required: true, message: 'Select type' }]}
        >
          <Select placeholder="Type" style={{ width: 140 }}>
            <Select.Option value="positive">Positive</Select.Option>
            <Select.Option value="negative">Negative</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Add Question
          </Button>
        </Form.Item>
      </Form>

      <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Text strong>Show:</Text>{' '}
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 140 }}
          >
            <Select.Option value="all">All</Select.Option>
            <Select.Option value="positive">Positive</Select.Option>
            <Select.Option value="negative">Negative</Select.Option>
          </Select>
        </Col>
        <Col>
          <Text>
            Total Positive Weight:{' '}
            <Text strong>{totalPositive.toFixed(2)}</Text>
          </Text>
        </Col>
        <Col>
          <Text>
            Total Negative Weight:{' '}
            <Text strong>{totalNegative.toFixed(2)}</Text>
          </Text>
        </Col>
      </Row>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={displayed}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
    </>
  );
}
