// File: app/components/UserOverallScores.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Collapse, Typography, Spin, Alert, Table } from 'antd';
import SubmissionYearlyScores from './SubmissionYearlyScores';
import { useAverageYearlyScores } from '../../hooks/useAverageYearlyScores';

const { Title, Text } = Typography;
const { Panel } = Collapse;

export default function UserOverallScores() {
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // use the new hook to compute per‐year averages
  const { yearNames, averages } = useAverageYearlyScores(submissions);
  console.log(yearNames);

  useEffect(() => {
    async function loadAll() {
      try {
        const [subRes, qRes, sRes] = await Promise.all([
          fetch('/api/saveScores', {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`, 
            },
          }),
          fetch('/api/questions', {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`, 
            },
          }),
          fetch('/api/scoreSettings', {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`, 
            },
          }),
        ]);
        if (!subRes.ok) throw new Error('Failed to fetch submissions');
        if (!qRes.ok)   throw new Error('Failed to fetch questions');
        if (!sRes.ok)   throw new Error('Failed to fetch settings');

        const { submissions: rawSubs } = await subRes.json();
        const questions               = await qRes.json();
        const { yearNames }           = await sRes.json();

        // build attribute defs & weights
        const posAttrs = [];
        const negAttrs = [];
        const weights  = {};
        questions.forEach(q => {
          const key = String(q.id);
          weights[key] = Number(q.weight) || 0;
          const attr = { key, label: q.text };
          q.type === 'positive' ? posAttrs.push(attr) : negAttrs.push(attr);
        });

        // reshape submissions
        const enriched = rawSubs.map(sub => {
          const posScores = {};
          const negScores = {};
          posAttrs.forEach(a => posScores[a.key] = Array(yearNames.length).fill(0));
          negAttrs.forEach(a => negScores[a.key] = Array(yearNames.length).fill(0));

          sub.scores.forEach(({ questionId, yearIndex, score, skipped }) => {
            if (skipped) return;
            const k = String(questionId);
            if (posScores[k]) posScores[k][yearIndex] = score;
            if (negScores[k]) negScores[k][yearIndex] = score;
          });

          return {
            id:            sub.id,
            createdAt:     sub.createdAt,
            posAttributes: posAttrs,
            negAttributes: negAttrs,
            posScores,
            negScores,
            weights,
            yearNames,
          };
        });

        setSubmissions(enriched);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (loading) return <Spin tip="Loading submissions…" />;
  if (error)   return <Alert type="error" message="Error" description={error} showIcon />;

 

  // prepare a single row and column definition for a horizontal table
  const row = averages.reduce(
    (acc, { year, avg }) => ({ ...acc, [year]: avg }),
    { key: 'overall' }
  );
  const columns = yearNames.map(year => ({
    title: year,
    dataIndex: year,
    key: year,
    align: 'center',
  }));

  // open all panels by default
  const defaultOpenKeys = submissions.map(sub => String(sub.id));

  return (
    <div style={{ padding: '1rem' }}>
      

      <Title level={4}>Average Score Across All Submissions</Title>
      {console.table(averages)}
      <Table
        dataSource={[row]}
        columns={columns}
        pagination={false}
        size="small"
        bordered
        rowKey="key"            // ← add this
        style={{ marginBottom: '1.5rem' }}
      />

      <Title level={3}>All Submissions (Yearly Scores)</Title>

      <Collapse defaultActiveKey={defaultOpenKeys}>
        {submissions.map(sub => (
          <Panel
            key={sub.id}
            header={
              <div>
                <Text strong>Submission {sub.id}</Text>{' '}
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {new Date(sub.createdAt).toLocaleString()}
                </Text>
              </div>
            }
          >
            <SubmissionYearlyScores submission={sub} />
          </Panel>
        ))}
      </Collapse>
    </div>
  );
}
