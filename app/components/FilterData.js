'use client';
import { useState, useEffect, useMemo } from 'react';
import { Table, Select, Button, message } from 'antd';

export default function FilterData() {
  const [contentHierarchy, setContentHierarchy] = useState([]);
  const [streamDropdowns, setStreamDropdowns] = useState([]);
  const [streamSelection, setStreamSelection] = useState([]);
  const [volumeData, setVolumeData] = useState([]);

  // Row/column filter state
  const [rowOptions, setRowOptions] = useState([]);
  const [colOptions, setColOptions] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedCol, setSelectedCol] = useState(null);

  // Table checkbox selection
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    fetch('/api/contentHierarchy')
      .then(res => res.json())
      .then(data => {
        setContentHierarchy(data);
        const roots = data.filter(n => n.parent_id === null);
        setStreamDropdowns([{ level: 0, options: roots, selected: null }]);
      });
  }, []);

  // helper to fetch & flatten volume data for a given stream path
  const fetchAndFlatten = (path) => {
    fetch(`/api/filterVolumeData?stream=${path.join(',')}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        const flat = [];
        data.forEach(entry => {
          const matrix = typeof entry.data === 'string'
            ? JSON.parse(entry.data)
            : entry.data;
          const names = entry.stream
            .split(',')
            .map(id => contentHierarchy.find(n => n.id.toString() === id)?.name)
            .filter(Boolean)
            .join(' > ');
          Object.entries(matrix).forEach(([r, cols]) => {
            Object.entries(cols).forEach(([c, v]) => {
              flat.push({
                id: entry.id,
                stream: names,
                row: r,
                column: c,
                value: v,
                created_at: entry.created_at
              });
            });
          });
        });
        setVolumeData(flat);

        // build row/col filter options
        setRowOptions(Array.from(new Set(flat.map(d => d.row))).map(r => ({ label: r, value: r })));
        setColOptions(Array.from(new Set(flat.map(d => d.column))).map(c => ({ label: c, value: c })));
      })
      .catch(() => message.error('Error fetching volume data'));
  };

  const updateStreamDropdown = (selectedId, levelIndex) => {
    const updated = [...streamDropdowns];
    updated[levelIndex].selected = selectedId;
    updated.splice(levelIndex + 1);
    const children = contentHierarchy.filter(n => n.parent_id === parseInt(selectedId));
    if (children.length) {
      updated.push({ level: levelIndex + 1, options: children, selected: null });
    }
    setStreamDropdowns(updated);

    const path = updated.map(d => d.selected).filter(Boolean);
    setStreamSelection(path);

    // reset row/col filters & checkboxes
    setSelectedRowKeys([]);
    setSelectedRow(null);
    setSelectedCol(null);

    if (path.length) {
      fetchAndFlatten(path);
    } else {
      setVolumeData([]);
      setRowOptions([]);
      setColOptions([]);
    }
  };

  const filteredData = useMemo(() =>
    volumeData.filter(d =>
      (!selectedRow || d.row === selectedRow) &&
      (!selectedCol || d.column === selectedCol)
    ),
    [volumeData, selectedRow, selectedCol]
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const deleteSelected = async () => {
    if (!selectedRowKeys.length) return;
    try {
      const cells = selectedRowKeys.map(key => {
        const [id, row, column] = key.split('||');
        return { id: Number(id), row, column };
      });
      const res = await fetch('/api/volumeData', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cells })
      });
      if (!res.ok) throw new Error();

      message.success('Deleted successfully');

      // clear row/col filters & checkboxes
      setSelectedRowKeys([]);
      setSelectedRow(null);
      setSelectedCol(null);

      // re-fetch with the exact same stream path
      if (streamSelection.length) {
        fetchAndFlatten(streamSelection);
      }
    } catch {
      message.error('Delete failed');
    }
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <strong>Select Stream Path:</strong>
        {streamDropdowns.map((dd, i) => (
          <Select
            key={i}
            placeholder={`Level ${i + 1}`}
            value={dd.selected}
            onChange={val => updateStreamDropdown(val, i)}
            options={dd.options.map(o => ({ label: o.name, value: o.id.toString() }))}
            style={{ width: 250, marginRight: 8, marginBottom: 8 }}
          />
        ))}
      </div>

      {rowOptions.length > 0 && (
        <Select
          placeholder="Filter by Row"
          style={{ width: 200, marginRight: 8, marginBottom: 16 }}
          options={rowOptions}
          allowClear
          value={selectedRow}
          onChange={setSelectedRow}
        />
      )}
      {colOptions.length > 0 && (
        <Select
          placeholder="Filter by Column"
          style={{ width: 200, marginBottom: 16 }}
          options={colOptions}
          allowClear
          value={selectedCol}
          onChange={setSelectedCol}
        />
      )}

      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary" danger
          onClick={deleteSelected}
          disabled={!selectedRowKeys.length}
        >
          Delete Selected
        </Button>
        {selectedRowKeys.length > 0 && (
          <span style={{ marginLeft: 8 }}>
            {selectedRowKeys.length} item(s) selected
          </span>
        )}
      </div>

      <Table
        rowSelection={{ type: 'checkbox', ...rowSelection }}
        dataSource={filteredData}
        columns={[
          { title: 'Stream',     dataIndex: 'stream'     },
          { title: 'Row',        dataIndex: 'row'        },
          { title: 'Column',     dataIndex: 'column'     },
          { title: 'Value',      dataIndex: 'value'      },
          { title: 'Created At', dataIndex: 'created_at' }
        ]}
        rowKey={rec => `${rec.id}||${rec.row}||${rec.column}`}
        pagination={{ pageSize: 20 }}
      />
    </>
  );
}

