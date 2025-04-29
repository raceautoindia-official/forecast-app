'use client';
import { useState, useEffect } from 'react';
import { Button, Select, Upload, message } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';

export default function UploadVolumeData() {
  const [formatCharts, setFormatCharts] = useState([]);
  const [hierarchyNodes, setHierarchyNodes] = useState([]);
  const [contentHierarchy, setContentHierarchy] = useState([]);
  const [streamSelection, setStreamSelection] = useState([]);
  const [streamDropdowns, setStreamDropdowns] = useState([]);

  const [rowChart, setRowChart] = useState(null);
  const [rowLevels, setRowLevels] = useState([]);
  const [selectedRowLevel, setSelectedRowLevel] = useState(null);

  const [colChart, setColChart] = useState(null);
  const [colLevels, setColLevels] = useState([]);
  const [selectedColLevel, setSelectedColLevel] = useState(null);

  const [fileList, setFileList] = useState([]);
  const [templateDownloading, setTemplateDownloading] = useState(false);

  useEffect(() => {
    fetch('/api/formatHierarchy')
      .then((res) => res.json())
      .then((data) => {
        setHierarchyNodes(data);
        const rootCharts = data.filter(node => node.parent_id === null);
        setFormatCharts(rootCharts);
      });

    fetch('/api/contentHierarchy')
      .then((res) => res.json())
      .then(data => {
        setContentHierarchy(data);
        const roots = data.filter(n => n.parent_id === null);
        setStreamDropdowns([{ level: 0, options: roots, selected: null }]);
      });
  }, []);

  const updateStreamDropdown = (selectedId, levelIndex) => {
    const updatedDropdowns = [...streamDropdowns];
    updatedDropdowns[levelIndex].selected = selectedId;
    updatedDropdowns.splice(levelIndex + 1);

    const children = contentHierarchy.filter(n => n.parent_id === parseInt(selectedId));
    if (children.length > 0) {
      updatedDropdowns.push({ level: levelIndex + 1, options: children, selected: null });
    }

    setStreamDropdowns(updatedDropdowns);
    setStreamSelection(updatedDropdowns.map(d => d.selected).filter(Boolean));
  };

  const getLevelOptions = (chartId) => {
    const levels = {};

    const traverse = (nodeId, level = 1) => {
      const children = hierarchyNodes.filter(n => n.parent_id === nodeId && n.chart_id === chartId);
      if (children.length > 0) {
        if (!levels[level]) levels[level] = [];
        children.forEach(child => {
          levels[level].push(child);
          traverse(child.id, level + 1);
        });
      }
    };

    hierarchyNodes
      .filter(n => n.chart_id === chartId && n.parent_id === null)
      .forEach(root => {
        if (!levels[1]) levels[1] = [];
        levels[1].push(root);
        traverse(root.id, 2);
      });

    return Object.entries(levels).map(([level, nodes]) => ({
      label: `Level ${level}: ${nodes.map(n => n.name).join(', ')}`,
      value: `level-${level}`,
      level: parseInt(level),
      nodeIds: nodes.map(n => n.id)
    }));
  };

  const handleRowChartSelect = (id) => {
    setRowChart(id);
    setSelectedRowLevel(null);
    const levels = getLevelOptions(id);
    setRowLevels(levels);
  };

  const handleColChartSelect = (id) => {
    setColChart(id);
    setSelectedColLevel(null);
    const levels = getLevelOptions(id);
    setColLevels(levels);
  };

  const handleTemplateDownload = async () => {
    if (!rowChart || !selectedRowLevel || !colChart || !selectedColLevel) {
      return message.error('Please select both row and column charts and levels.');
    }
    try {
      setTemplateDownloading(true);
      const res = await fetch('/api/generateExcelTemplate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowChartId: rowChart,
          rowLevelNodes: selectedRowLevel.nodeIds,
          colChartId: colChart,
          colLevelNodes: selectedColLevel.nodeIds
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Template download failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'volume_template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      message.error(err.message);
    } finally {
      setTemplateDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!fileList.length || !rowChart || !selectedRowLevel || !colChart || !selectedColLevel || !streamSelection.length) {
      return message.error('Please complete all selections, stream, and choose a file.');
    }

    const formData = new FormData();
    formData.append('file', fileList[0]);
    formData.append('rowChartId', rowChart);
    formData.append('rowLevelNodes', selectedRowLevel.nodeIds.join(','));
    formData.append('colChartId', colChart);
    formData.append('colLevelNodes', selectedColLevel.nodeIds.join(','));
    formData.append('streamPath', streamSelection.join(','));

    const res = await fetch('/api/uploadVolumeData', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      message.success('Upload successful!');
      setFileList([]);
    } else {
      const error = await res.json();
      if (error.details) {
        const messages = [];
        if (error.details.missingRowLabels?.length) {
          messages.push(`Missing row labels: ${error.details.missingRowLabels.join(', ')}`);
        }
        if (error.details.missingColumnLabels?.length) {
          messages.push(`Missing column labels: ${error.details.missingColumnLabels.join(', ')}`);
        }
        message.error(messages.join('\n'));
      } else {
        message.error(error.message || 'Upload failed');
      }      
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h3>Upload Volume Data with Format Validation</h3>

      {/* Row Chart Selection */}
      <div style={{ marginBottom: 16 }}>
        <strong>Row Flow Chart:</strong>
        <Select
          placeholder="Select Row Chart"
          value={rowChart}
          onChange={handleRowChartSelect}
          options={formatCharts.map(c => ({ label: c.name, value: c.id }))}
          style={{ width: 250, marginLeft: 8 }}
        />
        {rowLevels.length > 0 && (
          <Select
            placeholder="Select Row Level"
            value={selectedRowLevel?.value}
            onChange={(val) => {
              const level = rowLevels.find(l => l.value === val);
              setSelectedRowLevel(level);
            }}
            options={rowLevels.map(l => ({ label: l.label, value: l.value }))}
            style={{ width: 400, marginLeft: 16 }}
          />
        )}
      </div>

      {/* Column Chart Selection */}
      <div style={{ marginBottom: 16 }}>
        <strong>Column Flow Chart:</strong>
        <Select
          placeholder="Select Column Chart"
          value={colChart}
          onChange={handleColChartSelect}
          options={formatCharts.map(c => ({ label: c.name, value: c.id }))}
          style={{ width: 250, marginLeft: 8 }}
        />
        {colLevels.length > 0 && (
          <Select
            placeholder="Select Column Level"
            value={selectedColLevel?.value}
            onChange={(val) => {
              const level = colLevels.find(l => l.value === val);
              setSelectedColLevel(level);
            }}
            options={colLevels.map(l => ({ label: l.label, value: l.value }))}
            style={{ width: 400, marginLeft: 16 }}
          />
        )}
      </div>

      {/* Stream Selection */}
      <div style={{ marginBottom: 16 }}>
        <strong>Stream Selection:</strong>
        {streamDropdowns.map((dropdown, index) => (
          <Select
            key={index}
            placeholder={`Select Level ${index + 1}`}
            value={dropdown.selected}
            onChange={(val) => updateStreamDropdown(val, index)}
            options={dropdown.options.map(opt => ({ label: opt.name, value: opt.id.toString() }))}
            style={{ width: 250, marginRight: 8, marginBottom: 8 }}
          />
        ))}
        {streamSelection.length > 0 && (
          <div style={{ marginTop: 8, fontStyle: 'italic' }}>
            <strong>Selected Stream:</strong> {
              streamSelection
                .map(id => contentHierarchy.find(n => n.id.toString() === id)?.name)
                .filter(Boolean)
                .join(' > ')
            }
          </div>
        )}
      </div>

      {/* Download Template Button */}
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<DownloadOutlined />}
          onClick={handleTemplateDownload}
          loading={templateDownloading}
        >
          Download Template
        </Button>
      </div>

      {/* File Upload and Submit */}
      <Upload
        beforeUpload={(file) => {
          setFileList([file]);
          return false;
        }}
        fileList={fileList}
        onRemove={() => setFileList([])}
      >
        <Button icon={<UploadOutlined />}>Select Excel File</Button>
      </Upload>

      <Button
        type="primary"
        onClick={handleUpload}
        style={{ marginTop: 16 }}
      >
        Upload Volume Data
      </Button>
    </div>
  );
}






