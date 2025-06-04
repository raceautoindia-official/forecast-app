"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Spin,
  Alert,
  Select,
  Button,
  Popconfirm,
  message,
  Row,
  Col,
} from "antd";

export default function SubmittedScores() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterId, setFilterId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // fetch all submissions
  const fetchData = () => {
    setLoading(true);
    fetch("/api/saveScores", {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((json) => {
        setSubmissions(json.submissions);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, []);

  // delete one submission by id
  const handleDelete = async () => {
    if (!filterId) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/saveScores", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json" ,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`
        },
        body: JSON.stringify({ id: filterId }),
      });
      if (!res.ok) throw new Error(await res.text());
      message.success(`Submission ${filterId} deleted`);
      setFilterId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      message.error("Delete failed: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Spin tip="Loading submissions…" />;
  if (error)
    return <Alert message="Error" description={error} type="error" showIcon />;

  // build the list of distinct submission IDs for the filter dropdown
  const submissionIds = Array.from(new Set(submissions.map((s) => s.id)));

  // flatten each (possibly filtered) submission into rows
  const rows = [];
  submissions
    .filter((s) => !filterId || s.id === filterId)
    .forEach((sub) => {
      sub.scores.forEach((scoreEntry) => {
        rows.push({
          key: `${sub.id}-${scoreEntry.questionId}-${scoreEntry.yearIndex}`,
          submissionId: sub.id,
          submittedAt: new Date(sub.createdAt).toLocaleString(),
          questionId: scoreEntry.questionId,
          year:
            scoreEntry.yearIndex != null
              ? `Year ${scoreEntry.yearIndex + 1}`
              : "",
          score: scoreEntry.skipped ? "⏭️ Skipped" : scoreEntry.score,
        });
      });
    });

  const columns = [
    { title: "Submission ID", dataIndex: "submissionId", key: "submissionId" },
    { title: "When", dataIndex: "submittedAt", key: "submittedAt" },
    { title: "Question ID", dataIndex: "questionId", key: "questionId" },
    { title: "Year", dataIndex: "year", key: "year" },
    { title: "Score", dataIndex: "score", key: "score" },
  ];

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <Select
            allowClear
            placeholder="Filter by Submission ID"
            style={{ width: 200 }}
            value={filterId}
            onChange={setFilterId}
          >
            {submissionIds.map((id) => (
              <Select.Option key={id} value={id}>
                {id}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col>
          <Popconfirm
            title={`Delete submission ${filterId}?`}
            onConfirm={handleDelete}
            okButtonProps={{ loading: deleting }}
            disabled={!filterId}
          >
            <Button
              type="primary"
              danger
              disabled={!filterId}
              loading={deleting}
            >
              Delete Submission
            </Button>
          </Popconfirm>
        </Col>
      </Row>

      <Table
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
    </>
  );
}
