// File: app/page.js
'use client';

import { Tabs } from 'antd';
import ContentHierarchyFlow from './components/ContentHierarchyFlow';
import FormatHierarchyFlow  from './components/FormatHierarchyFlow';
import FilterData           from './components/FilterData';
import UploadVolumeData     from './components/UploadVolumeData';
import VehicleSalesScoreApp from './components/VehicleSalesScoreApp';
import ManageQuestions      from './components/ManageQuestions';   // ← new
import CreateGraph          from './components/CreateGraph';
import GraphList            from './components/GraphList';

export default function Home() {
  const historicalItems = [
    { key: '1', label: 'Content Hierarchy',   children: <ContentHierarchyFlow />   },
    { key: '2', label: 'Format Hierarchy',    children: <FormatHierarchyFlow />    },
    { key: '3', label: 'Filter Data',         children: <FilterData />             },
    { key: '4', label: 'Upload Volume Data',  children: <UploadVolumeData />       },
  ];

  const scoreSubtabs = [
    { key: 'manage',    label: 'Manage Questions', children: <ManageQuestions />      },
    { key: 'calculator',label: 'Score Calculator',  children: <VehicleSalesScoreApp /> },
  ];

  const forecastSubtabs = [
    { key: 'create', label: 'Create Graph', children: <CreateGraph /> },
    { key: 'list',   label: 'All Graphs',   children: <GraphList   /> },
  ];

  const tabItems = [
    {
      key: 'historical',
      label: 'Historical Data',
      children: <Tabs defaultActiveKey="1" items={historicalItems} />,
    },
    {
      key: 'score',
      label: 'Score Analysis',
      children: <Tabs defaultActiveKey="manage" items={scoreSubtabs} />,
    },
    {
      key: 'forecast',
      label: 'Forecast',
      children: <Tabs defaultActiveKey="create" items={forecastSubtabs} />,
    },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Forecast Application CMS</h1>
      <Tabs defaultActiveKey="historical" items={tabItems} />
    </div>
  );
}

