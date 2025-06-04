// File: app/forecast/page.js
'use client';
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Brush,
  Rectangle
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClipboardList, FaBolt } from 'react-icons/fa';
import './forecast.css';
import GlobalStyles from "./GlobalStyles";
import Footer from './Footer';
// Hook for linear regression forecast
import { useLinearRegressionForecast } from "../hooks/LinearRegressionForecast";
// Hook for score based forecast
import { useForecastGrowth }       from "../hooks/useForecastGrowth";
import { useAverageYearlyScores }  from "../hooks/useAverageYearlyScores";

export default function ForecastPage() {

  const router = useRouter()

  // --- UI state ---
  const [isLogoHover, setLogoHover] = useState(false)
  const [isHovering, setIsHovering]         = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDatasetHovering, setIsDatasetHovering] = useState(false);
  const [isRegionsHovering, setIsRegionsHovering] = useState(false);
  const [loading, setLoading] = useState(true);

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
    fetch('/api/graphs', {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`, 
            },
          })
      .then(r => r.json())
      .then(setGraphs)
      .catch(console.error);

    fetch('/api/volumeData', {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`, 
            },
          })
      .then(r => r.json())
      .then(arr => {
        const m = {};
        arr.forEach(d => {
          const cleanData = Object.fromEntries(
            Object.entries(d.data)
              .filter(([region, years]) => region != null && Object.keys(years).length)
              .map(([region, years]) => [
                region,
                Object.fromEntries(
                  Object.entries(years).map(([yr, val]) => [
                    yr,
                    // drop commas and coerce to number
                    Number(String(val).replace(/,/g, '')) || 0
                  ])
                )
              ])
          );
          m[d.id] = { ...d, data: cleanData };
        });
        setVolumeDataMap(m);
      })
      .catch(console.error);



    fetch('/api/contentHierarchy', {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`, 
            },
          })
      .then(r => r.json())
      .then(arr => {
        const m = {};
        arr.forEach(node => { m[node.id] = node.name; });
        setHierarchyMap(m);
      })
      .catch(console.error);

    fetch('/api/scoreSettings', {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`, 
            },
          })
      .then(r => r.json())
      .then(data => setScoreSettings(data))
      .catch(console.error);
    
    // now also fetch the format‐hierarchy tree
    fetch('/api/formatHierarchy', {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`, 
            },
          })
    .then(r => r.json())
    .then(setFormatHierarchy)
    .catch(console.error);

    // also pull in the submissions, questions & settings so we can compute averages
    Promise.all([
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
          })
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
        setLoading(false);
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
    // console.log("volumedatamap",volumeDataMap)
    // console.log("seleected dataset ",selectedDataset)
    if (!selectedDataset?.data || !selectedRegions.length) return [];
    const data = selectedDataset.data;
    // console.log("data ", data);
    const regions = selectedRegions.filter(r => data[r]);
    // console.log("regions " ,regions);
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
    console.log( "allregions",allRegions);
    // console.log("chartdata",chartData);
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
      // console.log("historicalVolumes",historicalVolumes);
      // console.log("avgScoreValues",avgScoreValues);
      // console.log("forecastDataScore",forecastDataScore);
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

  // console.log("bothdata", bothData);
  // console.log("data ", data);

 const PALETTE = [
    // Sapphire Blue (your --accent)
    { light: '#15AFE4', dark:  '#0D7AAB' },
    // Amber Gold   (your --fg)
    { light: '#FFC107', dark:  '#B38600' },
    // Emerald Green (score forecast)
    { light: '#23DD1D', dark:  '#149A11' },
    // Teal Accent
    { light: '#38CCD4', dark:  '#1F7F84' },

    // Royal Purple
    { light: '#A17CFF', dark:  '#5E3DBD' },
    // Coral Sunset
    { light: '#FF8A65', dark:  '#C75B39' },
    // Mint Breeze
    { light: '#85FF8C', dark:  '#50AA5B' },
    // Rose Quartz
    { light: '#FF92E3', dark:  '#C25AA8' },
  ];

  const getColor = i => PALETTE[i % PALETTE.length].light;
  const getDark  = i => PALETTE[i % PALETTE.length].dark;


  // at top of your ForecastPage component, after you’ve computed selectedGraph:
  const legendPayload = useMemo(() => {
    const items = [
      { value: 'Historical',         type: 'line', color: '#D64444' }
    ];
    if (selectedGraph?.forecast_types?.includes('linear')) {
      items.push({
        value: 'Forecast (Stats)',
        type:  'line',
        color: '#F58C1F'
      });
    }
    if (selectedGraph?.forecast_types?.includes('score')) {
      items.push({
        value: 'Forecast (Survey-based)',
        type:  'line',
        color: '#23DD1D'
      });
    }
    return items;
  }, [selectedGraph]);

  // bar chart computations
  const barCount     = chartData.length;
  const maxBarSize   = barCount < 5 ? 100 : barCount < 10 ? 60 : 24;
  const barCategoryGap = barCount < 5 ? 40 : barCount < 10 ? 24 : 16;

  // custom tool tip 
 const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  // Helper to format any numeric value as an integer with separators
  const fmt = v =>
    typeof v === 'number'
      ? v.toLocaleString(undefined, { maximumFractionDigits: 0 })
      : v;

  return (
    <>
      <div className="tooltip-card">
        <p>{label}</p>
        {payload.map(p => (
          <div key={p.dataKey}>
            <span className="dot" style={{ background: p.color }} />
            {p.name}: {fmt(p.value)}
          </div>
        ))}
      </div>
      <style jsx>{`
        .tooltip-card {
          background: rgba(20,20,20,0.9);
          padding: var(--space-sm);
          border-radius: var(--radius);
          box-shadow: var(--shadow-deep);
          color: rgba(255,255,255,0.7);
          font-size: 0.875rem;
        }
        .tooltip-card .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 4px;
          display: inline-block;
        }
      `}</style>
    </>
  );
};

// y-axis formatter
const abbreviate = v => {
  if (v >= 1e9)   return `${(v / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
  if (v >= 1e6)   return `${(v / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1e3)   return `${(v / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return v.toString();
}

  // ——— Render —————————————————————————————————————————————————————————————
  return (
    <>
      <GlobalStyles />
      {/* Desktop View */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="de-view container-fluid"
        style={{ background: '#2C2E31' }}
      >
        <div className="container mt-1 ">  
        {/* ─── APP HEADER ───────────────────────────────────── */}
        <div className="app-header d-flex justify-content-between align-items-center">
         <Link href="/" passHref>
            <motion.div
                className="logo-container"
                onMouseEnter={() => setLogoHover(true)}
                onMouseLeave={() => setLogoHover(false)}
                onClick={() => router.push('/')}
                animate={{
                  scale: isLogoHover ? 1.05 : 1,
                  filter: isLogoHover
                    ? "drop-shadow(0 0 12px var(--accent, #FFDC00)) brightness(1.2) saturate(1.3)"
                    : "none"
                }}
                transition={{
                  scale: { type: "spring", stiffness: 300, damping: 20 },
                  filter: { duration: 0.2 }
                }}
              >
                <Image
                  src="/images/log.png"
                  alt="Race Auto India"
                  // className="app-logo"
                  width={170}
                  height={60}
                />
                {/* <motion.span
                  className="logo-tooltip"
                  initial={{ opacity: 0, y: -8 }}
                  animate={isLogoHover ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
                  transition={{ delay: 0.3, duration: 0.2 }}
                >
                  <FaPlay style={{ marginRight: 4, color: '#fff', transform: 'rotate(-90deg)'}}/>
                  <span style={{textDecoration:'none'}}>Go Home</span>
                </motion.span> */}
              </motion.div>

          </Link>
          <div className="nav-buttons">
            <button
              className="nav-btn"
              onClick={() => router.push('/score-card')}
            >
              <FaClipboardList className="btn-icon" />
              Build Your Own Tailored Forecast
            </button>

            <button
              className="nav-btn"
              onClick={() => router.push('/reports')}
            >
              <FaBolt className="btn-icon" />
              Flash Reports
            </button>
          </div>

        </div>
          {/* Heading */}
          <h5 className="chart-header">
            <div
              className={`dropdown-toggle ${isHovering ? 'dropdown-open' : ''}`}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <span className="chart-title">
                {selectedGraph?.name || 'Select a graph'}
              </span>
              <div className={`chart-dropdown ${isHovering ? 'open' : ''}`}>
                {graphs.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() =>setSelectedGraphId(opt.id)}
                    className="mt-1"
                    style={{ cursor: 'pointer' }}
                  >
                    {opt.name}
                  </div>
                ))}
              </div>
            </div>
          </h5>
          
          {/* Above your chart, in the same row: */}
          <div className="selectors d-flex align-items-center gap-3">
            {/* Dataset picker */}
            <div
              className={`dropdown-toggle ${isDatasetHovering ? 'dropdown-open' : ''}`}
              onMouseEnter={() => setIsDatasetHovering(true)}
              onMouseLeave={() => setIsDatasetHovering(false)}
            >
              <span style={{ color:"white"}}>Categories</span>
              <div className={`chart-dropdown ${isDatasetHovering ? 'open' : ''}`}>
                {selectedGraph?.dataset_ids.map(dsId => {
                const ds = volumeDataMap[dsId];
                if (!ds?.stream) return null;
                const parts = ds.stream.split(',').map(n => +n);
                const lastId = parts[parts.length - 1];
                const label = hierarchyMap[lastId] || `#${lastId}`;
                return (
                  <div
                    key={dsId}
                    onClick={() => setSelectedDatasetId(dsId)}
                    className="mt-1"
                    style={{ cursor: 'pointer', color: 'white' }}
                  >
                    {label}
                  </div>
                );
              })}
              </div>
            </div>
           {/* Regions picker */}
            <div
              className={`dropdown-toggle ${isRegionsHovering ? 'dropdown-open' : ''}`}
              onMouseEnter={() => setIsRegionsHovering(true)}
              onMouseLeave={() => setIsRegionsHovering(false)}
            >
              <span style={{ color:"white" }}>Regions</span>
              <div className={`chart-dropdown ${isRegionsHovering ? 'open' : ''}`}>
                {/* ── select / remove all ─────────────────────────────── */}
                <div
                  onClick={() =>
                    setSelectedRegions(sr =>
                      sr.length === allRegions.length
                        ? []               // remove all
                        : [...allRegions]  // select all
                    )
                  }
                  className="mt-1 select-all"
                  style={{
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: selectedRegions.length === allRegions.length
                      ? 'var(--accent-active)'
                      : 'var(--accent)',
                  }}
                >
                  {selectedRegions.length === allRegions.length
                    ? 'Remove all'
                    : 'Select all'}
                </div>

                {/* ── then your grouped regions ───────────────────────── */}
                {Object.entries(regionsByGroup).map(([groupName, nodes]) => {
                  const allSelected = nodes.every(n => selectedRegions.includes(n.name));
                  return (
                    <div key={groupName} style={{ marginBottom: 8, color: 'white' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          className="me-2"
                          checked={allSelected}
                          onChange={() => toggleGroupSelection(nodes)}
                        />
                        <strong
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenGroups(o => ({ ...o, [groupName]: !o[groupName] }));
                          }}
                          style={{ userSelect: 'none' }}
                        >
                          {groupName} {openGroups[groupName] ? '▾' : '▸'}
                        </strong>
                      </label>
                      {openGroups[groupName] && nodes.map(node => (
                        <label
                          key={node.id}
                          className="d-block ps-3"
                          style={{ fontSize: 14, marginTop: 4, color: 'white', cursor: 'pointer' }}
                        >
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
              </div>
            </div>

          </div>
          <div className="mt-3">
          {loading ? (
            // Skeleton placeholder
            <div className="skeleton-line" />
            ) : (!selectedGraph || !selectedDataset) ? (
              <p className="text-center">Please choose a graph & dataset.</p>
            ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${selectedGraphId}-${selectedDatasetId}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                  >
                <div className="chart-card">
                <ResponsiveContainer width="100%" height={400} style={{borderLeft:10}}>
                        {/* Line + linear and score forecast */}
                        {/*
                          Unified LineChart for all “line” cases.
                          We pick the data & forecast series based on forecast_types,
                          but keep all styling identical.
                        */}
                        {selectedGraph.chart_type === 'line' ? (() => {
                          const hasLinear = selectedGraph.forecast_types?.includes('linear');
                          const hasScore  = selectedGraph.forecast_types?.includes('score');

                          // pick the right dataset
                          const data = hasLinear && hasScore
                            ? bothData
                            : hasLinear
                              ? combinedData
                              : hasScore
                                ? combinedDataScore
                                : chartData;
                          console.log("data " ,data);

                          return (
                            <LineChart
                              data={data}
                              margin={{ top: 20, right: 20, bottom: 0, left: 10 }}
                              animationDuration={2500}
                              animationEasing="ease-out"
                            >
                              <defs>
                                <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={hasLinear && hasScore ? '#D64444' : '#1039EE'} stopOpacity={0.9}/>
                                  <stop offset="100%" stopColor={hasLinear && hasScore ? '#D64444' : '#1039EE'} stopOpacity={0.3}/>
                                </linearGradient>
                              </defs>

                              {/* subtle grid */}
                              <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3"/>

                              {/* styled axes */}
                              <XAxis
                                dataKey="year"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#FFC107', fontSize: 12 }}
                                /* start the axis at 95% of the min, end at 105% of the max */
                                domain={['auto','auto']}
                                /* Format every tick as an integer */
                                tickFormatter={abbreviate}
                              />

                              {/* slim brush */}
                              <Brush
                                dataKey="year"
                                height={12}
                                stroke="rgba(255,255,255,0.4)"
                                fill="rgba(255,255,255,0.08)"
                                strokeWidth={1}
                                tickFormatter={d => d}
                                tick={{
                                  fill: 'rgba(255,255,255,0.6)',
                                  fontSize: 9,
                                  fontFamily: 'inherit',
                                }}
                                tickMargin={4}
                                traveller={
                                  <Rectangle
                                    width={6}
                                    height={16}
                                    radius={3}
                                    fill="rgba(255,255,255,0.6)"
                                    stroke="rgba(255,255,255,0.4)"
                                    strokeWidth={1}
                                    cursor="ew-resize"
                                  />
                                }
                              />

                              {/* custom tooltip & spaced legend */}
                              <Tooltip content={<CustomTooltip />} />
                              <Legend 
                              wrapperStyle={{ marginTop: 24 }}
                              payload={legendPayload}
                              />

                              {/* historical line always */}
                              <Line
                                dataKey="value"
                                name="Historical"
                                stroke="url(#histGrad)"
                                strokeWidth={3}
                                connectNulls
                                animationBegin={0}
                              />

                              {/* linear forecast, if any */}
                              {hasLinear && (
                                <Line
                                  dataKey={hasLinear && hasScore ? 'forecastLinear' : 'forecastVolume'}
                                  name="Forecast (Stats)"
                                  stroke="#F58C1F"
                                  strokeWidth={2}
                                  strokeDasharray="5 5"
                                  connectNulls
                                  animationBegin={150}
                                />
                              )}

                              {/* score forecast, if any */}
                              {hasScore && (
                                <Line
                                  dataKey={hasLinear && hasScore ? 'forecastScore' : 'forecastVolume'}
                                  name="Forecast (Survey-based)"
                                  stroke="#23DD1D"
                                  strokeWidth={2}
                                  strokeDasharray="2 2"
                                  connectNulls
                                  animationBegin={300}
                                />
                              )}
                            </LineChart>
                          );
                     })() : selectedGraph.chart_type === 'bar' ? (
                          <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 20, bottom: 20, left: 30 }}
                            barCategoryGap={barCategoryGap}
                            maxBarSize={maxBarSize}
                          >
                            {/* soft, low-contrast grid */}
                            <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3"/>

                            <XAxis 
                              dataKey="year" axisLine={false} tickLine={false}
                              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                              padding={{ left: 10, right: 10 }}
                            />
                            <YAxis 
                              axisLine={false} tickLine={false}
                              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                            />

                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.08)' }}/>
                            <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)', marginTop: 16 }} iconType="circle"/>

                            <defs>
                              {allRegions.filter(r=>selectedRegions.includes(r)).map((r,i) => (
                                <linearGradient key={r} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={getColor(i)} stopOpacity={0.8}/>
                                  <stop offset="100%" stopColor={getDark(i)}  stopOpacity={0.3}/>
                                </linearGradient>
                              ))}
                            </defs>


                            {allRegions.filter(r=>selectedRegions.includes(r)).map((r,i) => (
                              <Bar
                                key={r}
                                dataKey={r}
                                stackId="a"
                                fill={`url(#grad-${i})`}
                                radius={[6,6,0,0]}            // pronounced rounding
                                className="premium-bar"
                              />
                            ))}
                          </BarChart>
                        ) : (
                           <PieChart>
                              {/* 1) Define per-slice gradients */}
                              <defs>
                                {pieData.map((_, i) => (
                                  <linearGradient key={i} id={`sliceGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={getColor(i)} stopOpacity={0.8} />
                                    <stop offset="100%" stopColor={getDark(i)}  stopOpacity={0.3} />
                                  </linearGradient>
                                ))}
                              </defs>

                              {/* 2) Use a donut style, with paddingAngle for breathing room */}
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%" cy="50%"
                                innerRadius={70}
                                outerRadius={110}
                                paddingAngle={4}
                                stroke="rgba(255,255,255,0.1)"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {pieData.map((_, i) => (
                                  <Cell key={i} fill={`url(#sliceGrad-${i})`} />
                                ))}
                              </Pie>

                              {/* 3) Polished tooltip & legend */}
                              <Tooltip content={<CustomTooltip />} cursor={false} />
                              <Legend
                                verticalAlign="bottom"
                                align="center"
                                iconType="circle"
                                wrapperStyle={{ color: 'rgba(255,255,255,0.7)', marginTop: 16 }}
                              />
                            </PieChart>
                        )}
                      </ResponsiveContainer>
                      </div>
                      </motion.div>
                      </AnimatePresence>
                      )}
          </div>
        <div style={{height:'.75rem'}}></div>
        <Footer />
        </div>
      </motion.div>

      {/* Mobile View */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="mo-view container-fluid px-0"
        style={{ background: '#2C2E31' }}
      >
        <div className="container mt-1 ">
          {/* ─── APP HEADER ───────────────────────────────────── */}
          <div className="app-header d-flex justify-content-center align-items-center">
            <Link href="/" passHref>
              <motion.div
                className="logo-container d-flex justify-content-center w-100"
                onMouseEnter={() => setLogoHover(true)}
                onMouseLeave={() => setLogoHover(false)}
                onClick={() => router.push('/')}
                animate={{
                  scale: isLogoHover ? 1.05 : 1,
                  filter: isLogoHover
                    ? "drop-shadow(0 0 12px var(--accent, #FFDC00)) brightness(1.2) saturate(1.3)"
                    : "none"
                }}
                transition={{
                  scale: { type: "spring", stiffness: 300, damping: 20 },
                  filter: { duration: 0.2 }
                }}
              >
                <div className="">
                  <Image
                    src="/images/log.png"
                    alt="Race Auto India"
                    className="app-logo"
                    width={180}
                    height={70}
                  />
                </div>


              </motion.div>

            </Link>


          </div>
          <div className="nav-buttons d-flex justify-content-center  mb-3 rounded">
            <button
              className="nav-btn p-2 "
              onClick={() => router.push('/score-card')}
            >
              <FaClipboardList className="btn-icon" />
              Build Your Own   Tailored Forecast
            </button>
          </div>
          <div className="nav-buttons d-flex justify-content-center  mb-3 rounded">
            <button
              className="nav-btn  p-2"
              onClick={() => router.push('/reports')}
            >
              <FaBolt className="btn-icon " />
              Flash Reports
            </button>
          </div>
          {/* Heading */}
          <h5 className="chart-header">
            <div
              className={`dropdown-toggle ${isHovering ? 'dropdown-open' : ''}`}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <span className="chart-title">
                {selectedGraph?.name || 'Select a graph'}
              </span>
              <div className={`chart-dropdown ${isHovering ? 'open' : ''}`}>
                {graphs.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedGraphId(opt.id)}
                    className="mt-1"
                    style={{ cursor: 'pointer' }}
                  >
                    {opt.name}
                  </div>
                ))}
              </div>
            </div>
          </h5>
          {/* Dataset picker */}


          {/* Region filter, grouped by parent */}

          {/* Above your chart, in the same row: */}
          <div className="selectors d-flex justify-content-center gap-3">
            <div
              className={`dropdown-toggle ${isDatasetHovering ? 'dropdown-open' : ''}`}
              onMouseEnter={() => setIsDatasetHovering(true)}
              onMouseLeave={() => setIsDatasetHovering(false)}
              onClick={() => setIsDatasetFilterOpen(o => !o)}
            >
              <span style={{ color: "white" }}>Datasets</span>
              <div className={`chart-dropdown ${isDatasetHovering ? 'open' : ''}`}>
                {selectedGraph?.dataset_ids.map(dsId => {
                  const ds = volumeDataMap[dsId];
                  if (!ds?.stream) return null;
                  const parts = ds.stream.split(',').map(n => +n);
                  const lastId = parts[parts.length - 1];
                  const label = hierarchyMap[lastId] || `#${lastId}`;
                  return (
                    <div
                      key={dsId}
                      onClick={() => setSelectedDatasetId(dsId)}
                      className="mt-1"
                      style={{ cursor: 'pointer', color: 'white' }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className={`dropdown-toggle ${isRegionsHovering ? 'dropdown-open' : ''}`}
              onMouseEnter={() => setIsRegionsHovering(true)}
              onMouseLeave={() => setIsRegionsHovering(false)}
              onClick={() => setIsRegionFilterOpen(o => !o)}
            >
              <span style={{ color: "white" }}>Regions</span>
              <div className={`chart-dropdown ${isRegionsHovering ? 'open' : ''}`}>
                {Object.entries(regionsByGroup).map(([groupName, nodes]) => {
                  const allSelected = nodes.every(n => selectedRegions.includes(n.name));
                  return (
                    <div key={groupName} style={{ marginBottom: 8, color: 'white' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          className="me-2"
                          checked={allSelected}
                          onChange={() => toggleGroupSelection(nodes)}
                        />
                        <strong
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenGroups(o => ({ ...o, [groupName]: !o[groupName] }));
                          }}
                          style={{ userSelect: 'none' }}
                        >
                          {groupName} {openGroups[groupName] ? '▾' : '▸'}
                        </strong>
                      </label>
                      {openGroups[groupName] && nodes.map(node => (
                        <label
                          key={node.id}
                          className="d-block ps-3"
                          style={{ fontSize: 14, marginTop: 4, color: 'white' }}
                        >
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
              </div>
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              // Skeleton placeholder
              <div className="skeleton-line" />
            ) : (!selectedGraph || !selectedDataset) ? (
              <p className="text-center">Please choose a graph & dataset.</p>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedGraphId}-${selectedDatasetId}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="chart-card">
                    <ResponsiveContainer width="100%" height={selectedGraph.chart_type === 'line' ? 300 : 400} >

                      {selectedGraph.chart_type === 'line' ? (() => {
                        const hasLinear = selectedGraph.forecast_types?.includes('linear');
                        const hasScore = selectedGraph.forecast_types?.includes('score');

                        // pick the right dataset
                        const data = hasLinear && hasScore
                          ? bothData
                          : hasLinear
                            ? combinedData
                            : hasScore
                              ? combinedDataScore
                              : chartData;

                        return (
                          <LineChart
                            data={data}
                            margin={{ top: 20, bottom: 20, right: 10, left: 0 }}
                            animationDuration={2500}
                            animationEasing="ease-out"
                          >
                            <defs>
                              <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={hasLinear && hasScore ? '#D64444' : '#1039EE'} stopOpacity={0.9} />
                                <stop offset="100%" stopColor={hasLinear && hasScore ? '#D64444' : '#1039EE'} stopOpacity={0.3} />
                              </linearGradient>
                            </defs>

                            {/* subtle grid */}
                            <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />

                            {/* styled axes */}
                            <XAxis
                              dataKey="year"
                              axisLine={false}

                              tickLine={false}
                              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: '0.55rem' }}
                            />
                            <YAxis
                              /* start the axis at 95% of the min, end at 105% of the max */
                              domain={['auto', 'auto']}
                              /* Format every tick as an integer */
                              width={10}
                              axisLine={false}
                              tickLine={false}
                              tick={({ x, y, payload }) => (
                                <text
                                  x={x + 4}
                                  y={y + 4}
                                  fill="rgba(255,255,255,0.7)"
                                  fontSize={10}
                                >
                                  {abbreviate(payload.value)}

                                </text>
                              )}
                            />

                            {/* slim brush */}
                            <Brush
                              dataKey="year"
                              height={12}
                              stroke="rgba(255,255,255,0.4)"
                              fill="rgba(255,255,255,0.08)"
                              strokeWidth={1}
                              tickFormatter={d => d}
                              tick={{
                                fill: 'rgba(255,255,255,0.6)',
                                fontSize: 9,
                                fontFamily: 'inherit',
                              }}
                              tickMargin={4}
                              traveller={
                                <Rectangle
                                  width={6}
                                  height={16}
                                  radius={3}
                                  fill="rgba(255,255,255,0.6)"
                                  stroke="rgba(255,255,255,0.4)"
                                  strokeWidth={1}
                                  cursor="ew-resize"
                                />
                              }
                            />

                            {/* custom tooltip & spaced legend */}
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                              wrapperStyle={{ marginTop: 24, fontSize: 10 }}
                              payload={legendPayload}
                            />

                            {/* historical line always */}
                            <Line
                              dataKey="value"
                              name="Historical"
                              stroke="url(#histGrad)"
                              strokeWidth={3}
                              connectNulls
                              animationBegin={0}
                            />

                            {/* linear forecast, if any */}
                            {hasLinear && (
                              <Line
                                dataKey={hasLinear && hasScore ? 'forecastLinear' : 'forecastVolume'}
                                name="Forecast (Linear)"
                                stroke="#F58C1F"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                connectNulls
                                animationBegin={150}
                              />
                            )}

                            {/* score forecast, if any */}
                            {hasScore && (
                              <Line
                                dataKey={hasLinear && hasScore ? 'forecastScore' : 'forecastVolume'}
                                name="Forecast (Score)"
                                stroke="#23DD1D"
                                strokeWidth={2}
                                strokeDasharray="2 2"
                                connectNulls
                                animationBegin={300}
                              />
                            )}
                          </LineChart>
                        );
                      })() : selectedGraph.chart_type === 'bar' ? (
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, bottom: 20 }}
                          barCategoryGap={barCategoryGap}
                          maxBarSize={maxBarSize}
                        >
                          {/* soft, low-contrast grid */}
                          <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

                          <XAxis
                            dataKey="year" axisLine={false} tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                            strokeWidth={2}
                          />
                          <YAxis
                            axisLine={false} tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                          />

                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.08)' }} />
                          <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)', marginTop: 16 }} iconType="circle" />

                          <defs>
                            {allRegions.filter(r => selectedRegions.includes(r)).map((r, i) => (
                              <linearGradient key={r} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={getColor(i)} stopOpacity={0.8} />
                                <stop offset="100%" stopColor={getDark(i)} stopOpacity={0.3} />
                              </linearGradient>
                            ))}
                          </defs>


                          {allRegions.filter(r => selectedRegions.includes(r)).map((r, i) => (
                            <Bar
                              key={r}
                              dataKey={r}
                              stackId="a"
                              fill={`url(#grad-${i})`}
                              radius={[6, 6, 0, 0]}            // pronounced rounding
                              className="premium-bar"
                            />
                          ))}
                        </BarChart>
                      ) : (
                        <PieChart>
                          {/* 1) Define per-slice gradients */}
                          <defs>
                            {pieData.map((_, i) => (
                              <linearGradient key={i} id={`sliceGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={getColor(i)} stopOpacity={0.8} />
                                <stop offset="100%" stopColor={getDark(i)} stopOpacity={0.3} />
                              </linearGradient>
                            ))}
                          </defs>

                          {/* 2) Use a donut style, with paddingAngle for breathing room */}
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%" cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={4}
                            stroke="rgba(255,255,255,0.1)"
                            labelLine={false}
                           
                          >
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={`url(#sliceGrad-${i})`} style={{outline:'none'}} />
                            ))}
                          </Pie>

                          {/* 3) Polished tooltip & legend */}
                          <Tooltip content={<CustomTooltip />} cursor={false} />
                          <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            wrapperStyle={{ color: 'rgba(255,255,255,0.7)', marginTop: 16 }}
                          />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <Footer />
        </div>
      </motion.div>

      {/* Tab View */}
        <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="ta-view container-fluid"
        style={{ background: '#2C2E31' }}
      >
       
          {/* ─── APP HEADER ───────────────────────────────────── */}
          <div className="app-header d-flex justify-content-between align-items-center">
            <Link href="/" passHref>
              <motion.div
                className="logo-container"
                onMouseEnter={() => setLogoHover(true)}
                onMouseLeave={() => setLogoHover(false)}
                onClick={() => router.push('/')}
                animate={{
                  scale: isLogoHover ? 1.05 : 1,
                  filter: isLogoHover
                    ? "drop-shadow(0 0 12px var(--accent, #FFDC00)) brightness(1.2) saturate(1.3)"
                    : "none"
                }}
                transition={{
                  scale: { type: "spring", stiffness: 300, damping: 20 },
                  filter: { duration: 0.2 }
                }}
              >
                <Image
                  src="/images/log.png"
                  alt="Race Auto India"
                  className="app-logo"
                  width={170}
                  height={60}
                />
                {/* <motion.span
                  className="logo-tooltip"
                  initial={{ opacity: 0, y: -8 }}
                  animate={isLogoHover ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
                  transition={{ delay: 0.3, duration: 0.2 }}
                >
                  <FaPlay style={{ marginRight: 4, color: '#fff', transform: 'rotate(-90deg)'}}/>
                  <span style={{textDecoration:'none'}}>Go Home</span>
                </motion.span> */}
              </motion.div>

            </Link>
            <div className="nav-buttons">
              <button
                className="nav-btn"
                onClick={() => router.push('/score-card')}
              >
                <FaClipboardList className="btn-icon" />
                Build Your Own Tailored Forecast
              </button>

              <button
                className="nav-btn"
                onClick={() => router.push('/reports')}
              >
                <FaBolt className="btn-icon" />
                Flash Reports
              </button>
            </div>

          </div>
          {/* Heading */}
          <h5 className="chart-header">
            <div
              className={`dropdown-toggle ${isHovering ? 'dropdown-open' : ''}`}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <span className="chart-title">
                {selectedGraph?.name || 'Select a graph'}
              </span>
              <div className={`chart-dropdown ${isHovering ? 'open' : ''}`}>
                {graphs.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedGraphId(opt.id)}
                    className="mt-1"
                    style={{ cursor: 'pointer' }}
                  >
                    {opt.name}
                  </div>
                ))}
              </div>
            </div>
          </h5>
          {/* Dataset picker */}


          {/* Region filter, grouped by parent */}

          {/* Above your chart, in the same row: */}
          <div className="selectors d-flex align-items-center gap-3">
            <div
              className={`dropdown-toggle ${isDatasetHovering ? 'dropdown-open' : ''}`}
              onMouseEnter={() => setIsDatasetHovering(true)}
              onMouseLeave={() => setIsDatasetHovering(false)}
              onClick={() => setIsDatasetFilterOpen(o => !o)}
            >
              <span style={{ color: "white" }}>Datasets</span>
              <div className={`chart-dropdown ${isDatasetHovering ? 'open' : ''}`}>
                {selectedGraph?.dataset_ids.map(dsId => {
                  const ds = volumeDataMap[dsId];
                  if (!ds?.stream) return null;
                  const parts = ds.stream.split(',').map(n => +n);
                  const lastId = parts[parts.length - 1];
                  const label = hierarchyMap[lastId] || `#${lastId}`;
                  return (
                    <div
                      key={dsId}
                      onClick={() => setSelectedDatasetId(dsId)}
                      className="mt-1"
                      style={{ cursor: 'pointer', color: 'white' }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className={`dropdown-toggle ${isRegionsHovering ? 'dropdown-open' : ''}`}
              onMouseEnter={() => setIsRegionsHovering(true)}
              onMouseLeave={() => setIsRegionsHovering(false)}
              onClick={() => setIsRegionFilterOpen(o => !o)}
            >
              <span style={{ color: "white" }}>Regions</span>
              <div className={`chart-dropdown ${isRegionsHovering ? 'open' : ''}`}>
                {Object.entries(regionsByGroup).map(([groupName, nodes]) => {
                  const allSelected = nodes.every(n => selectedRegions.includes(n.name));
                  return (
                    <div key={groupName} style={{ marginBottom: 8, color: 'white' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          className="me-2"
                          checked={allSelected}
                          onChange={() => toggleGroupSelection(nodes)}
                        />
                        <strong
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenGroups(o => ({ ...o, [groupName]: !o[groupName] }));
                          }}
                          style={{ userSelect: 'none' }}
                        >
                          {groupName} {openGroups[groupName] ? '▾' : '▸'}
                        </strong>
                      </label>
                      {openGroups[groupName] && nodes.map(node => (
                        <label
                          key={node.id}
                          className="d-block ps-3"
                          style={{ fontSize: 14, marginTop: 4, color: 'white' }}
                        >
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
              </div>
            </div>
          </div>
          <div className="mt-3">
            {loading ? (
              // Skeleton placeholder
              <div className="skeleton-line" />
            ) : (!selectedGraph || !selectedDataset) ? (
              <p className="text-center">Please choose a graph & dataset.</p>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedGraphId}-${selectedDatasetId}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="chart-card">
                    <ResponsiveContainer width="100%" height={450} >
                      {/* Line + linear and score forecast */}
                      {/*
                          Unified LineChart for all “line” cases.
                          We pick the data & forecast series based on forecast_types,
                          but keep all styling identical.
                        */}
                      {selectedGraph.chart_type === 'line' ? (() => {
                        const hasLinear = selectedGraph.forecast_types?.includes('linear');
                        const hasScore = selectedGraph.forecast_types?.includes('score');

                        // pick the right dataset
                        const data = hasLinear && hasScore
                          ? bothData
                          : hasLinear
                            ? combinedData
                            : hasScore
                              ? combinedDataScore
                              : chartData;

                        return (
                          <LineChart
                            data={data}
                            margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                            animationDuration={2500}
                            animationEasing="ease-out"
                          >
                            <defs>
                              <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={hasLinear && hasScore ? '#D64444' : '#1039EE'} stopOpacity={0.9} />
                                <stop offset="100%" stopColor={hasLinear && hasScore ? '#D64444' : '#1039EE'} stopOpacity={0.3} />
                              </linearGradient>
                            </defs>

                            {/* subtle grid */}
                            <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />

                            {/* styled axes */}
                            <XAxis
                              dataKey="year"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                            />
                            <YAxis
                            /* start the axis at 95% of the min, end at 105% of the max */
                                domain={['auto','auto']}
                                /* Format every tick as an integer */
                                tickFormatter={abbreviate}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#FFC107', fontSize: 12 }}
                            />

                            {/* slim brush */}
                            <Brush
                              dataKey="year"
                              height={12}
                              stroke="rgba(255,255,255,0.4)"
                              fill="rgba(255,255,255,0.08)"
                              strokeWidth={1}
                              tickFormatter={d => d}
                              tick={{
                                fill: 'rgba(255,255,255,0.6)',
                                fontSize: 9,
                                fontFamily: 'inherit',
                              }}
                              tickMargin={4}
                              traveller={
                                <Rectangle
                                  width={6}
                                  height={16}
                                  radius={3}
                                  fill="rgba(255,255,255,0.6)"
                                  stroke="rgba(255,255,255,0.4)"
                                  strokeWidth={1}
                                  cursor="ew-resize"
                                />
                              }
                            />

                            {/* custom tooltip & spaced legend */}
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                              wrapperStyle={{ marginTop: 24 }}
                              payload={legendPayload}
                            />

                            {/* historical line always */}
                            <Line
                              dataKey="value"
                              name="Historical"
                              stroke="url(#histGrad)"
                              strokeWidth={3}
                              connectNulls
                              animationBegin={0}
                            />

                            {/* linear forecast, if any */}
                            {hasLinear && (
                              <Line
                                dataKey={hasLinear && hasScore ? 'forecastLinear' : 'forecastVolume'}
                                name="Forecast (Linear)"
                                stroke="#F58C1F"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                connectNulls
                                animationBegin={150}
                              />
                            )}

                            {/* score forecast, if any */}
                            {hasScore && (
                              <Line
                                dataKey={hasLinear && hasScore ? 'forecastScore' : 'forecastVolume'}
                                name="Forecast (Score)"
                                stroke="#23DD1D"
                                strokeWidth={2}
                                strokeDasharray="2 2"
                                connectNulls
                                animationBegin={300}
                              />
                            )}
                          </LineChart>
                        );
                      })() : selectedGraph.chart_type === 'bar' ? (
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 20, bottom: 20, left: 30 }}
                          barCategoryGap={barCategoryGap}
                          maxBarSize={maxBarSize}
                        >
                          {/* soft, low-contrast grid */}
                          <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

                          <XAxis
                            dataKey="year" axisLine={false} tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                            padding={{ left: 10, right: 10 }}
                          />
                          <YAxis
                            axisLine={false} tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                          />

                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.08)' }} />
                          <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)', marginTop: 16 }} iconType="circle" />

                          <defs>
                            {allRegions.filter(r => selectedRegions.includes(r)).map((r, i) => (
                              <linearGradient key={r} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={getColor(i)} stopOpacity={0.8} />
                                <stop offset="100%" stopColor={getDark(i)} stopOpacity={0.3} />
                              </linearGradient>
                            ))}
                          </defs>


                          {allRegions.filter(r => selectedRegions.includes(r)).map((r, i) => (
                            <Bar
                              key={r}
                              dataKey={r}
                              stackId="a"
                              fill={`url(#grad-${i})`}
                              radius={[6, 6, 0, 0]}            // pronounced rounding
                              className="premium-bar"
                            />
                          ))}
                        </BarChart>
                      ) : (
                        <PieChart>
                          {/* 1) Define per-slice gradients */}
                          <defs>
                            {pieData.map((_, i) => (
                              <linearGradient key={i} id={`sliceGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={getColor(i)} stopOpacity={0.8} />
                                <stop offset="100%" stopColor={getDark(i)} stopOpacity={0.3} />
                              </linearGradient>
                            ))}
                          </defs>

                          {/* 2) Use a donut style, with paddingAngle for breathing room */}
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%" cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={4}
                            stroke="rgba(255,255,255,0.1)"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={`url(#sliceGrad-${i})`} />
                            ))}
                          </Pie>

                          {/* 3) Polished tooltip & legend */}
                          <Tooltip content={<CustomTooltip />} cursor={false} />
                          <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            wrapperStyle={{ color: 'rgba(255,255,255,0.7)', marginTop: 16 }}
                          />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
          <div style={{height:'10rem'}}></div>
          <Footer />
        
      </motion.div>
    </>
  );
}
