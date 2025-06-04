"use client";
import { useState, useEffect, useMemo } from "react";
import { Table, Select, Button, message, Descriptions } from "antd";

export default function FilterData() {
  const [contentHierarchy, setContentHierarchy] = useState([]);
  const [streamDropdowns, setStreamDropdowns] = useState([]);
  const [streamSelection, setStreamSelection] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [rowOptions, setRowOptions] = useState([]);
  const [colOptions, setColOptions] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // load hierarchy
  useEffect(() => {
    fetch("/api/contentHierarchy", {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setContentHierarchy(data);
        const roots = data.filter((n) => n.parent_id === null);
        setStreamDropdowns([{ level: 0, options: roots, selected: null }]);
      });
  }, []);

  // fetch & flatten data
  const fetchAndFlatten = (path) => {
    fetch(`/api/filterVolumeData?stream=${path.join(",")}`, {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`,
      },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const flat = [];
        data.forEach((entry) => {
          const matrix =
            typeof entry.data === "string"
              ? JSON.parse(entry.data)
              : entry.data;
          Object.entries(matrix).forEach(([r, cols]) => {
            Object.entries(cols).forEach(([c, v]) => {
              flat.push({
                id: entry.id,
                stream: entry.stream,
                row: r,
                column: c,
                value: v,
                created_at: entry.created_at,
              });
            });
          });
        });
        setVolumeData(flat);
        setRowOptions([...new Set(flat.map((d) => d.row))]);
        setColOptions([...new Set(flat.map((d) => d.column))]);
      })
      .catch(() => message.error("Error fetching volume data"));
  };

  // update dropdown
  const updateStreamDropdown = (selectedId, levelIndex) => {
    const updated = [...streamDropdowns];
    updated[levelIndex].selected = selectedId;
    updated.splice(levelIndex + 1);
    const children = contentHierarchy.filter(
      (n) => n.parent_id === parseInt(selectedId)
    );
    if (children.length)
      updated.push({
        level: levelIndex + 1,
        options: children,
        selected: null,
      });
    setStreamDropdowns(updated);

    const path = updated.map((d) => d.selected).filter(Boolean);
    setStreamSelection(path);
    setSelectedRowKeys([]);
    setSelectedRow(null);
    if (path.length) fetchAndFlatten(path);
    else setVolumeData([]);
  };

  // pivot data
  const pivotData = useMemo(() => {
    const grouped = {};
    volumeData.forEach(({ row, column, value }) => {
      if (!grouped[row]) grouped[row] = { key: row, row };
      grouped[row][column] = value;
    });
    return Object.values(grouped);
  }, [volumeData]);

  // dynamic columns
  const pivotColumns = useMemo(() => {
    const cols = [{ title: "Row", dataIndex: "row", key: "row" }];
    colOptions.forEach((c) => cols.push({ title: c, dataIndex: c, key: c }));
    return cols;
  }, [colOptions]);

  // filtered rows
  const filteredPivotData = useMemo(() => {
    return pivotData.filter((r) => !selectedRow || r.row === selectedRow);
  }, [pivotData, selectedRow]);

  // header
  const headerInfo = useMemo(() => {
    if (!volumeData.length) return null;
    // Convert comma-separated IDs to names
    const ids = volumeData[0].stream.split(",");
    const names = ids
      .map((id) => contentHierarchy.find((n) => String(n.id) === id)?.name)
      .filter(Boolean)
      .join(" > ");
    const created_at = volumeData[0].created_at;
    return { stream: names, created_at };
  }, [volumeData, contentHierarchy]);

  const rowSelection = { selectedRowKeys, onChange: setSelectedRowKeys };

  const deleteSelected = async () => {
    if (!selectedRowKeys.length) return;
    try {
      const cells = selectedRowKeys.flatMap((key) => {
        const [id, row] = key.split("||");
        return volumeData
          .filter((d) => d.id.toString() === id && d.row === row)
          .map((d) => ({ id: d.id, row: d.row, column: d.column }));
      });
      const res = await fetch("/api/volumeData", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json" ,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`
        },
        body: JSON.stringify({ cells }),
      });
      if (!res.ok) throw new Error();
      message.success("Deleted successfully");
      setSelectedRowKeys([]);
      fetchAndFlatten(streamSelection);
    } catch {
      message.error("Delete failed");
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
            onChange={(val) => updateStreamDropdown(val, i)}
            options={dd.options.map((o) => ({
              label: o.name,
              value: o.id.toString(),
            }))}
            style={{ width: 250, marginRight: 8, marginBottom: 8 }}
          />
        ))}
      </div>

      {headerInfo && (
        <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Stream">
            {headerInfo.stream}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {headerInfo.created_at}
          </Descriptions.Item>
        </Descriptions>
      )}

      {rowOptions.length > 0 && (
        <Select
          placeholder="Filter by Row"
          style={{ width: 200, marginBottom: 16 }}
          options={rowOptions.map((r) => ({ label: r, value: r }))}
          allowClear
          value={selectedRow}
          onChange={setSelectedRow}
        />
      )}

      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          danger
          onClick={deleteSelected}
          disabled={!selectedRowKeys.length}
        >
          Delete Selected
        </Button>
        {selectedRowKeys.length > 0 && (
          <span style={{ marginLeft: 8 }}>
            {selectedRowKeys.length} row(s) selected
          </span>
        )}
      </div>

      <Table
        rowSelection={{ type: "checkbox", ...rowSelection }}
        dataSource={filteredPivotData.map((r) => ({
          ...r,
          key: `${volumeData.find((d) => d.row === r.row).id}||${r.row}`,
        }))}
        columns={pivotColumns}
        pagination={false}
        scroll={{ x: "max-content", y: 400 }}
      />
    </>
  );
}
