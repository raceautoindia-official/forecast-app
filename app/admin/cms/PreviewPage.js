// File: app/components/PreviewPage.jsx
'use client';

import React, { useState, useEffect, useMemo } from "react";
import { FaPlay } from "react-icons/fa";
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis,
  ResponsiveContainer,
  Tooltip, Legend,
  PieChart, Pie, Cell,
} from "recharts";

// Hook for linear regression forecast
import { useLinearRegressionForecast } from "../../hooks/LinearRegressionForecast";
// Hook for score based forecast
import { useForecastGrowth }       from "../../hooks/useForecastGrowth";
import { useAverageYearlyScores }  from "../../hooks/useAverageYearlyScores";

export default function PreviewPage() {
  // --- UI state ---
  const [isSidebarOpen, setIsSidebarOpen]             = useState(true);
  const [isGraphListOpen, setIsGraphListOpen]         = useState(true);
  const [isDatasetFilterOpen, setIsDatasetFilterOpen] = useState(true);
  const [isRegionFilterOpen, setIsRegionFilterOpen]   = useState(true);

  // --- fetched data ---
  const [graphs, setGraphs]               = useState([]);
  const [volumeDataMap, setVolumeDataMap] = useState({});
  const [hierarchyMap, setHierarchyMap]   = useState({});
  const [scoreSettings, setScoreSettings] = useState({ yearNames: [] });
  const [submissions, setSubmissions] = useState([]);
  const [formatHierarchy, setFormatHierarchy] = useState([]);

  // --- user selections ---
  const [selectedGraphId, setSelectedGraphId]     = useState(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [selectedRegions, setSelectedRegions]     = useState([]);

  // 1) Fetch all needed data once
  useEffect(() => {
    fetch('/api/graphs')
      .then(r => r.json())
      .then(setGraphs)
      .catch(console.error);

    fetch('/api/volumeData')
      .then(r => r.json())
      .then(arr => {
        const m = {};
        arr.forEach(d => {
          // filter out any weird “undefined” key
          const cleanData = Object.fromEntries(
            Object.entries(d.data).filter(([k,v]) => k != null && Object.keys(v).length)
          );
          m[d.id] = { ...d, data: cleanData };
        });
        setVolumeDataMap(m);
      })
      .catch(console.error);


    fetch('/api/contentHierarchy')
      .then(r => r.json())
      .then(arr => {
        const m = {};
        arr.forEach(node => { m[node.id] = node.name; });
        setHierarchyMap(m);
      })
      .catch(console.error);

    fetch('/api/scoreSettings')
      .then(r => r.json())
      .then(data => setScoreSettings(data))
      .catch(console.error);
    
    // now also fetch the format‐hierarchy tree
    fetch('/api/formatHierarchy')
    .then(r => r.json())
    .then(setFormatHierarchy)
    .catch(console.error);

    // also pull in the submissions, questions & settings so we can compute averages
    Promise.all([
        fetch('/api/saveScores'),
        fetch('/api/questions'),
       fetch('/api/scoreSettings')
     ])
     .then(async ([subRes, qRes, sRes]) => {
       if (!subRes.ok || !qRes.ok || !sRes.ok) throw new Error();
      const { submissions: rawSubs } = await subRes.json();
       const questions = await qRes.json();
       const { yearNames } = await sRes.json();
  
      // build posAttrs, negAttrs & weights (same as in UserOverallScores)
       const posAttrs = [], negAttrs = [], weights = {};
      questions.forEach(q => {
         const key = String(q.id);
         weights[key] = Number(q.weight) || 0;
         const attr = { key, label: q.text };
         q.type === 'positive' ? posAttrs.push(attr) : negAttrs.push(attr);
       });
  
       // enrich
       const enriched = rawSubs.map(sub => {
         const posScores = {}, negScores = {};
         posAttrs.forEach(a => posScores[a.key] = Array(yearNames.length).fill(0));
         negAttrs.forEach(a => negScores[a.key] = Array(yearNames.length).fill(0));
        sub.scores.forEach(({ questionId, yearIndex, score, skipped }) => {
           if (skipped) return;
           const k = String(questionId);
           if (posScores[k]) posScores[k][yearIndex] = score;
           if (negScores[k]) negScores[k][yearIndex] = score;
         });
         return{
           id:            sub.id,
           createdAt:     sub.createdAt,
           posAttributes: posAttrs, negAttributes: negAttrs,
           posScores,     negScores,
           weights,
           yearNames
         };
       });
  
       setSubmissions(enriched);
     })
     .catch(console.error);
  }, []);

  // 2) Default dataset when graph changes
  useEffect(() => {
    const g = graphs.find(g => g.id === selectedGraphId);
    if (g && g.dataset_ids.length) {
      setSelectedDatasetId(g.dataset_ids[0]);
    }
  }, [selectedGraphId, graphs]);

  // 3) Default select all regions when dataset changes
  const selectedDataset = volumeDataMap[selectedDatasetId];
  useEffect(() => {
    if (selectedDataset?.data) {
      setSelectedRegions(Object.keys(selectedDataset.data));
    }
  }, [selectedDataset]);

  const selectedGraph = graphs.find(g => g.id === selectedGraphId);

  // Derive allRegions from selectedDataset
  const allRegions = useMemo(
    () => selectedDataset?.data ? Object.keys(selectedDataset.data) : [],
    [selectedDataset]
  );

  // 4) Chart data for historical
  const chartData = useMemo(() => {
    if (!selectedDataset?.data || !selectedRegions.length) return [];
    const data = selectedDataset.data;
    console.log("data ", data);
    const regions = selectedRegions.filter(r => data[r]);
    console.log("regions " ,regions);
    if (!regions.length) return [];
    const years = Object.keys(data[regions[0]]).sort();
    return years.map(year => {
      const row = { year };
      regions.forEach(r => row[r] = data[r][year] ?? 0);
      return row;
    });
  }, [selectedDataset, selectedRegions]);

  // 5) Pie data
  const pieData = useMemo(() => {
    if (!selectedDataset?.data) return [];
    const data = selectedDataset.data;
    return allRegions
      .filter(r => selectedRegions.includes(r))
      .map(r => ({
        name:  r,
        value: Object.values(data[r] || {}).reduce((s, v) => s + v, 0)
      }));
  }, [selectedDataset, selectedRegions, allRegions]);

  // 6) Aggregate historical volumes
  const historicalVolumes = useMemo(() => {
    return chartData.map(row =>
      allRegions.reduce((sum, r) => sum + (row[r] || 0), 0)
    );
  }, [chartData, allRegions]);
  // **NEW**: compute your per-year average scores from all submissions
  // (you already fetched submissions via setSubmissions in your effect)
  const { yearNames: scoreYearNames, averages: avgScores } = useAverageYearlyScores(submissions);
  // turn [{year,avg},…] into [1.43, 0.52, …]
  const avgScoreValues = avgScores.map(a => Number(a.avg));

  // 7) Linear regression forecast hook
  const forecastDataLR = useLinearRegressionForecast(
    historicalVolumes,
    scoreSettings.yearNames || []
  );

  // 8) Score-based forecast hook
  const forecastDataScore = useForecastGrowth(
    historicalVolumes,
    avgScoreValues,
  );

   // 9) Combine historical + forecast, merging the boundary into the last historical point
   const combinedData = useMemo(() => {
    if (!chartData.length) return [];

    // 1) Build historical slice, with forecastVolume initialized to null
    const hist = historicalVolumes.map((v, i) => ({
      year:           Number(chartData[i].year),
      value:          v,
      forecastVolume: null
    }));

    // 2) Inject the last historical value into forecastVolume of the last hist point
    if (hist.length > 0) {
      hist[hist.length - 1].forecastVolume = hist[hist.length - 1].value;
    }

    // 3) Build your forecast slice (value stays null), starting at the next year
    const fc = (forecastDataLR || []).map((pt, i) => ({
      year:           Number(scoreSettings.yearNames[i]),  // e.g. 2024, 2025…
      value:          null,
      forecastVolume: pt.forecastVolume
    }));

    // 4) Simply concat – years will already be in ascending order
    return [...hist, ...fc];
  }, [historicalVolumes, forecastDataLR, chartData, scoreSettings.yearNames]);

  // 10) Combine historical + score-based forecast
  const combinedDataScore = useMemo(() => {
    if (!chartData.length) return [];
    const hist = historicalVolumes.map((v,i) => ({
      year: Number(chartData[i].year),
      value: v,
      forecastVolume: null
    }));
    if (hist.length) hist[hist.length-1].forecastVolume = hist[hist.length-1].value;
    const fc = forecastDataScore.map((pt,i) => ({
      year: Number(scoreYearNames[i]),
      value: null,
      forecastVolume: pt.forecastVolume
    }));
    return [...hist, ...fc];
  }, [chartData, historicalVolumes, forecastDataScore, scoreYearNames]);

  const bothData = useMemo(() => {
    if (!chartData.length) return [];
    // 1) historical…
    const hist = historicalVolumes.map((v,i) => {
      const isLast = i === historicalVolumes.length - 1;
      return {
        year:           Number(chartData[i].year),
        value:          v,
        // on the last historical point, duplicate value into both forecasts
        forecastLinear: isLast ? v : null,
        forecastScore:  isLast ? v : null,
      };
    });
    // 2) one object per forecast year, merging both
    const forecastSlice = scoreSettings.yearNames.map((yr, i) => ({
      year:            Number(yr),
      value:           null,
      forecastLinear:  forecastDataLR[i]?.forecastVolume  ?? null,
      forecastScore:   forecastDataScore[i]?.forecastVolume ?? null,
    }));
    return [...hist, ...forecastSlice];
  }, [
    chartData,
    historicalVolumes,
    forecastDataLR,
    forecastDataScore,
    scoreSettings.yearNames,
  ]);

  // 1) Build a map of name→node for quick lookups
  const nodeByName = useMemo(() => {
    const m = {};
    formatHierarchy.forEach(node => {
      m[node.name] = node;
    });
    return m;
  }, [formatHierarchy]);

  // 2) Build raw grouping from data keys → parent group name
  const regionsByGroup = useMemo(() => {
    const grouping = {};
    allRegions.forEach(regionName => {
      const node = nodeByName[regionName];
      if (!node) return;
      // find its immediate parent in the tree
      const parent = formatHierarchy.find(n => n.id === node.parent_id);
      const group = parent?.name || "Other";
      (grouping[group] = grouping[group] || []).push(node);
    });
    return grouping;
  }, [allRegions, nodeByName, formatHierarchy]);

  // 4) Initialize openGroups whenever `regionsByGroup` changes
  const [openGroups, setOpenGroups] = useState({});
  useEffect(() => {
    const init = {};
    Object.keys(regionsByGroup).forEach(g => init[g] = false);
    setOpenGroups(init);
  }, [regionsByGroup]);

  // 5) Helper for “select all” within a group
  const toggleGroupSelection = ( nodes) => {
    const allSelected = nodes.every(n => selectedRegions.includes(n.name));
    setSelectedRegions(curr =>
      allSelected
        ? curr.filter(r => !nodes.some(n => n.name === r))
        : [...curr, ...nodes.map(n => n.name).filter(nm => !curr.includes(nm))]
    );
  };

  console.log("chartdata ", chartData);
  console.log("bothdata " , bothData);
  
  const getColor = i => ["#1039EE","#23DD1D","#38CCD4","#F58C1F"][i % 4];

  return (
    <div className="de-view container-fluid d-flex">
      <p onClick={()=>setIsSidebarOpen(v=>!v)}
         style={{ fontSize:24, cursor:"pointer", marginTop:8 }}>
        <FaPlay/>
      </p>

      {isSidebarOpen && (
        <aside className="fw-bold border-end border-2 border-black mr-10" style={{ width:300,padding:5 }}>
          {/* Graph list */}
          <h2 style={{ color:"#15AFE4" }}>Graphs</h2>
          <h4 onClick={()=>setIsGraphListOpen(v=>!v)} style={{ cursor:"pointer", padding:"8px 0" }}>
            {isGraphListOpen ? '▼' : '▶'}
          </h4>
          {isGraphListOpen && graphs.map(g => (
            <div key={g.id}
                 onClick={()=>setSelectedGraphId(g.id)}
                 style={{ cursor:"pointer", padding:"4px 0", fontWeight: g.id===selectedGraphId ? 'bold':'normal' }}>
              {g.name}
            </div>
          ))}

          {/* Dataset picker */}
          <h5 onClick={()=>setIsDatasetFilterOpen(v=>!v)} style={{ cursor:"pointer", marginTop:20 }}>
            Datasets
          </h5>
          {isDatasetFilterOpen && selectedGraph?.dataset_ids.map(dsId => {
            const ds = volumeDataMap[dsId];
            if (!ds?.stream) return null;
            const parts = ds.stream.split(',').map(n=>+n);
            const lastId= parts[parts.length-1];
            const label = hierarchyMap[lastId] || `#${lastId}`;
            return (
              <div key={dsId} className="d-block">
                <input
                  type="radio"
                  name="dataset"
                  className="me-2"
                  checked={selectedDatasetId===dsId}
                  onChange={()=>setSelectedDatasetId(dsId)}
                />
                {label}
              </div>
            );
          })}

          {/* Region filter, grouped by parent */}
          <h5 onClick={() => setIsRegionFilterOpen(v => !v)}>Regions</h5>
          {isRegionFilterOpen && Object.entries(regionsByGroup).map(([groupName, nodes]) => {
          const allSelected = nodes.every(n => selectedRegions.includes(n.name));
          return (
            <div key={groupName} style={{ marginBottom: 8 }}>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => toggleGroupSelection(nodes)}
                  className="me-2"
                />
                <strong
                  onClick={e =>{
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenGroups(o => ({ ...o, [groupName]: !o[groupName] }));
                  }}
                  style={{ userSelect: "none" }}
                >
                  {groupName} {openGroups[groupName] ? "▾" : "▸"}
                </strong>
              </label>
              {openGroups[groupName] && nodes.map(node => (
                <label key={node.id} className="d-block ps-3" style={{ fontSize: 14, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    className="me-2"
                    checked={selectedRegions.includes(node.name)}
                    onChange={() =>
                      setSelectedRegions(s =>
                        s.includes(node.name)
                          ? s.filter(x => x !== node.name)
                          : [...s, node.name]
                      )
                    }
                  />
                  {node.name}
                </label>
              ))}
            </div>
          );
        })}
        </aside>
      )}

      {/* Main pane */}
      <main className="flex-grow-1 container mt-3" style={{paddingLeft:0 }}>
        <h2 className="ms-5 mt-5" style={{ color:"#FFCD24" }}>
          {selectedGraph?.name || 'Select a graph'}
        </h2>

        {(!selectedGraph || !selectedDataset) ? (
          <p className="text-center">Please choose a graph & dataset.</p>
        ) : (
          <ResponsiveContainer width="100%" height={350} style={{borderLeft:10}}>
            {/* Line + linear and score forecast */}
            {selectedGraph.chart_type === 'line'
             && selectedGraph.forecast_types?.includes('linear')
             && selectedGraph.forecast_types?.includes('score') ? (
              <LineChart data={bothData} margin={{ top: 20, right: 20, bottom: 20, left: 30 }}>
                 <XAxis dataKey="year" stroke="black" />
                 <YAxis stroke="black" style={{borderLeft:10}} />
                 <Tooltip />
                 <Legend />
                 {/* historical */}
                <Line
                  dataKey="value"
                  name="Historical"
                  stroke="#1039EE"
                  strokeWidth={2}                  
                  connectNulls
                />
                {/* linear */}
                <Line
                  dataKey="forecastLinear"
                  name="Forecast (Linear)"
                  stroke="#F58C1F"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  connectNulls
                />
                {/* score */}
                <Line
                  dataKey="forecastScore"
                  name="Forecast (Score)"
                  stroke="#23DD1D"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  connectNulls
                />
               </LineChart>
             ) : selectedGraph.chart_type === 'line' /*line + linear forecast */
             && selectedGraph.forecast_types?.includes('linear') ? (
              <LineChart data={combinedData}>
                <XAxis  dataKey="year" stroke="black" />
                <YAxis stroke="black" />
                <Tooltip />
                <Legend />
                <Line
                  dataKey="value"
                  name="Historical"
                  stroke="#1039EE"
                  strokeWidth={2}
                  connectNulls
                />
                <Line
                  dataKey="forecastVolume"
                  name="Forecast (Linear)"
                  stroke="#F58C1F"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  connectNulls
                />
              </LineChart>
            ) : selectedGraph.chart_type === 'line'   /*line + score forecast */
              && selectedGraph.forecast_types?.includes('score') ? (
                <LineChart data={combinedDataScore}>
                  <XAxis dataKey="year" stroke="black" />
                  <YAxis stroke="black" />
                  <Tooltip />
                  <Legend />
                  <Line
                  dataKey="value"
                  name="Historical"
                  stroke="#1039EE"
                  strokeWidth={2}
                  connectNulls
                  />
                  <Line
                  dataKey="forecastVolume"
                  name="Forecast (Score)"
                  stroke="#23DD1D"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  connectNulls
                  />
                </LineChart>
              ) : selectedGraph.chart_type === 'line' ? (
              <LineChart data={chartData}>
                <XAxis dataKey="year" stroke="black" />
                <YAxis stroke="black" />
                <Tooltip />
                <Legend />
                {allRegions.filter(r=>selectedRegions.includes(r)).map((r,i) => (
                  <Line
                    key={r}
                    dataKey={r}
                    stroke={getColor(i)}
                    strokeWidth={2}
                    type="monotone"
                    connectNulls
                  />
                ))}
              </LineChart>
            ) : selectedGraph.chart_type === 'bar' ? (
              <BarChart data={chartData}>
                <XAxis dataKey="year" stroke="black" />
                <YAxis stroke="black" />
                <Tooltip />
                <Legend />
                {allRegions.filter(r=>selectedRegions.includes(r)).map((r,i) => (
                  <Bar
                    key={r}
                    dataKey={r}
                    stackId="a"
                    fill={getColor(i)}
                  />
                ))}
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  outerRadius={120}
                  labelLine={false}
                  label={({name,value}) => `${name}: ${value}`}
                >
                  {pieData.map((_,i) => (
                    <Cell key={i} fill={getColor(i)} />
                  ))}
                </Pie>
                <Tooltip/>
                <Legend/>
              </PieChart>
            )}
          </ResponsiveContainer>
        )}

        <p className="fw-bold mt-2 ms-5">Source: N/A</p>
        <p className="fw-bold ms-5" style={{ fontSize:12 }}>
          © Copyright 2025 Race Auto India – All Rights Reserved.
        </p>
      </main>
    </div>
  );
}
