"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { FaClipboardList, FaBolt } from "react-icons/fa";

import "./forecast.css";
import GlobalStyles from "./GlobalStyles";
import Footer from "./Footer";

import {
  allRegions,
  regionGroups,
  graphs,
  bothDataMap,
  datasetMap,
} from "./forecastConfig";
import CustomTooltip from "./CustomTooltip";

export default function ForecastPage() {
  const router = useRouter();

  // ─── UI State ─────────────────────────────────────────────────────
  const [isLogoHover, setLogoHover] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isDatasetHovering, setIsDatasetHovering] = useState(false);
  const [isRegionsHovering, setIsRegionsHovering] = useState(false);

  // ─── Selection State ──────────────────────────────────────────────
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedGraphId, setSelectedGraphId] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Update graph when dataset changes
  useEffect(() => {
    if (selectedDatasetId) {
      const available = graphs.filter((g) =>
        g.dataset_ids.includes(selectedDatasetId)
      );
      setSelectedGraphId(available.length ? available[0].id : null);
    } else {
      setSelectedGraphId(null);
    }
  }, [selectedDatasetId]);

  const selectedGraph = graphs.find((g) => g.id === selectedGraphId);

  // ─── Region grouping logic ─────────────────────────────────────────
  const regionsByGroup = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(regionGroups).map(([grp, list]) => [
          grp,
          list.map((name) => ({ id: name, name })),
        ])
      ),
    []
  );
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(Object.keys(regionsByGroup).map((g) => [g, false]))
  );

  // ─── Chart logic ─────────────────────────────────────────────────
  const bothData = bothDataMap[selectedGraphId] || [];
  const hasLinear = selectedGraph?.forecast_types.includes("linear");
  const hasScore = selectedGraph?.forecast_types.includes("score");
  const hasAi = selectedGraph?.forecast_types.includes("ai");
  const hasRaceInsights =
    selectedGraph?.forecast_types.includes("raceInsights");

  const legendPayload = useMemo(() => {
    const items = [{ value: "Historical", type: "line", color: "#D64444" }];
    if (hasLinear)
      items.push({ value: "Forecast (Stats)", type: "line", color: "#F58C1F" });
    if (hasScore)
      items.push({
        value: "Forecast (Survey-based)",
        type: "line",
        color: "#23DD1D",
      });
    if (hasAi)
      items.push({ value: "Forecast (AI)", type: "line", color: "#0080FF" });
    if (hasRaceInsights)
      items.push({
        value: "Forecast (Race Insights)",
        type: "line",
        color: "#8A2BE2",
      });
    return items;
  }, [hasLinear, hasScore, hasAi, hasRaceInsights]);

  const abbreviate = (v) => {
    if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
    return v;
  };

  // ─── Subscription overlay ──────────────────────────────────────────
  function SubscriptionPrompt({ onClose }) {
    return (
      <div className="subscribe-prompt">
        <p>Please subscribe to unlock this feature.</p>
        <button
          className="subscribe-btn"
          onClick={() => {
            onClose();
            router.push("https://raceautoindia.com/subscription");
          }}
        >
          Subscribe Now
        </button>
        <style jsx>{`
          .subscribe-prompt {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(20, 20, 20, 0.9);
            padding: 1.5rem;
            border-radius: 0.5rem;
            color: #fff;
            text-align: center;
            z-index: 10;
          }
          .subscribe-btn {
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background: var(--accent);
            border: none;
            border-radius: 0.25rem;
            cursor: pointer;
            font-weight: bold;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <GlobalStyles />
      <motion.div
        className="de-view container-fluid"
        style={{ background: "#2C2E31" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
      >
        <div className="container mt-1">
          {/* HEADER */}
          <div className="app-header d-flex justify-content-between align-items-center">
            <Link href="/" passHref>
              <motion.div
                className="logo-container"
                onMouseEnter={() => setLogoHover(true)}
                onMouseLeave={() => setLogoHover(false)}
                onClick={() => router.push("/")}
                animate={{
                  scale: isLogoHover ? 1.05 : 1,
                  filter: isLogoHover
                    ? "drop-shadow(0 0 12px var(--accent))"
                    : "none",
                }}
                transition={{
                  scale: { type: "spring", stiffness: 300, damping: 20 },
                  filter: { duration: 0.2 },
                }}
              >
                <Image
                  src="/images/log.png"
                  alt="Logo"
                  width={170}
                  height={60}
                />
              </motion.div>
            </Link>
            <div className="nav-buttons">
              <button
                className="nav-btn"
                onClick={() => router.push("/score-card")}
              >
                <FaClipboardList className="btn-icon" /> Build Your Own Tailored
                Forecast
              </button>
              <button
                className="nav-btn"
                onClick={() => router.push("/reports")}
              >
                <FaBolt className="btn-icon" /> Flash Reports
              </button>
            </div>
          </div>

          {/* DATASET PICKER */}
          <div className="selectors d-flex align-items-center gap-3">
            <div
              className={`dropdown-toggle ${
                isDatasetHovering ? "dropdown-open" : ""
              }`}
              onMouseEnter={() => setIsDatasetHovering(true)}
              onMouseLeave={() => setIsDatasetHovering(false)}
            >
              <span style={{ color: "white" }}>
                {selectedDatasetId
                  ? datasetMap[selectedDatasetId].label
                  : "Categories"}
              </span>
              <div
                className={`chart-dropdown ${isDatasetHovering ? "open" : ""}`}
              >
                {Object.entries(datasetMap).map(([id, ds]) => (
                  <div
                    key={id}
                    onClick={() => setSelectedDatasetId(id)}
                    className="mt-1"
                    style={{ cursor: "pointer", color: "white" }}
                  >
                    {ds.label || id}
                  </div>
                ))}
              </div>
            </div>

            {/* REGIONS PICKER */}
            <div
              className={`dropdown-toggle ${
                isRegionsHovering ? "dropdown-open" : ""
              }`}
              onMouseEnter={() => setIsRegionsHovering(true)}
              onMouseLeave={() => setIsRegionsHovering(false)}
            >
              <span style={{ color: "white" }}>
                {selectedRegions.length > 0
                  ? `${selectedRegions.length} region${
                      selectedRegions.length > 1 ? "s" : ""
                    }`
                  : "Regions"}
              </span>
              <div
                className={`chart-dropdown ${isRegionsHovering ? "open" : ""}`}
              >
                {/* select/remove all */}
                <div
                  onClick={() =>
                    selectedRegions.length === allRegions.length
                      ? setSelectedRegions([])
                      : setSelectedRegions(allRegions)
                  }
                  className="mt-1 select-all"
                  style={{
                    cursor: "pointer",
                    fontWeight: 600,
                    color: "var(--accent)",
                  }}
                >
                  {selectedRegions.length === allRegions.length
                    ? "Remove all"
                    : "Select all"}
                </div>

                {/* grouped regions: all other clicks show prompt */}
                {Object.entries(regionsByGroup).map(([grp, nodes]) => {
                  return (
                    <div key={grp} style={{ marginBottom: 8, color: "white" }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          className="me-2"
                          checked={nodes.every((n) =>
                            selectedRegions.includes(n.name)
                          )}
                          onChange={() => setShowPrompt(true)}
                        />
                        <strong
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenGroups((o) => ({ ...o, [grp]: !o[grp] }));
                          }}
                          style={{ userSelect: "none" }}
                        >
                          {grp} {openGroups[grp] ? "▾" : "▸"}
                        </strong>
                      </label>
                      {openGroups[grp] &&
                        nodes.map((n) => (
                          <label
                            key={n.id}
                            className="d-block ps-3"
                            style={{
                              fontSize: 14,
                              marginTop: 4,
                              color: "white",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              className="me-2"
                              checked={selectedRegions.includes(n.name)}
                              onChange={() => setShowPrompt(true)}
                            />
                            {n.name}
                          </label>
                        ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CHART HEADER */}
          <h5 className="chart-header">
            {!selectedDatasetId || !selectedRegions.length ? (
              <span className="chart-title">
                Please select a category and region first
              </span>
            ) : (
              <div
                className={`dropdown-toggle ${
                  isHovering ? "dropdown-open" : ""
                }`}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <span className="chart-title">{selectedGraph?.name}</span>
                <div className={`chart-dropdown ${isHovering ? "open" : ""}`}>
                  {graphs
                    .filter((g) => g.dataset_ids.includes(selectedDatasetId))
                    .map((g) => (
                      <div
                        key={g.id}
                        onClick={() => setSelectedGraphId(g.id)}
                        className="mt-1"
                        style={{ cursor: "pointer" }}
                      >
                        {g.name}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </h5>

          {/* CHART */}
          <div className="mt-3">
            {selectedDatasetId &&
              selectedRegions.length > 0 &&
              selectedGraphId && (
                <div className="chart-container">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedGraphId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div
                        className="chart-card"
                        style={{
                          filter: showPrompt ? "blur(4px)" : "none",
                          pointerEvents: showPrompt ? "none" : "auto",
                        }}
                      >
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart
                            data={bothData}
                            margin={{ top: 20, right: 20, bottom: 0, left: 10 }}
                          >
                            <defs>
                              <linearGradient
                                id="histGrad"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor={
                                    hasLinear && hasScore
                                      ? "#D64444"
                                      : "#1039EE"
                                  }
                                  stopOpacity={0.9}
                                />
                                <stop
                                  offset="100%"
                                  stopColor={
                                    hasLinear && hasScore
                                      ? "#D64444"
                                      : "#1039EE"
                                  }
                                  stopOpacity={0.3}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              stroke="rgba(255,255,255,0.1)"
                              strokeDasharray="3 3"
                            />
                            <XAxis
                              dataKey="year"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fill: "rgba(255,255,255,0.7)",
                                fontSize: 12,
                              }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#FFC107", fontSize: 12 }}
                              domain={["auto", "auto"]}
                              tickFormatter={abbreviate}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                              wrapperStyle={{ marginTop: 24 }}
                              payload={legendPayload}
                            />
                            <Line
                              dataKey="value"
                              name="Historical"
                              stroke="url(#histGrad)"
                              strokeWidth={3}
                              connectNulls
                            />
                            {hasLinear && (
                              <Line
                                dataKey="forecastLinear"
                                name="Forecast (Stats)"
                                stroke="#F58C1F"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                connectNulls
                              />
                            )}
                            {hasScore && (
                              <Line
                                dataKey="forecastScore"
                                name="Forecast (Survey-based)"
                                stroke="#23DD1D"
                                strokeWidth={2}
                                strokeDasharray="2 2"
                                connectNulls
                              />
                            )}
                            {hasAi && (
                              <Line
                                dataKey="forecastAi"
                                name="Forecast (AI)"
                                stroke="#0080FF"
                                strokeWidth={2}
                                strokeDasharray="3 3"
                                connectNulls
                              />
                            )}
                            {hasRaceInsights && (
                              <Line
                                dataKey="forecastRaceInsights"
                                name="Forecast (Race Insights)"
                                stroke="#8A2BE2"
                                strokeWidth={2}
                                strokeDasharray="1 4"
                                connectNulls
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      {showPrompt && (
                        <SubscriptionPrompt
                          onClose={() => setShowPrompt(false)}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <style jsx>{`
                    .chart-container {
                      position: relative;
                    }
                  `}</style>
                </div>
              )}
          </div>

          <div style={{ height: ".75rem" }} />
          <Footer />
        </div>
      </motion.div>
    </>
  );
}

// // File: app/forecast/page.js
// "use client";

// import React, { useState, useMemo, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import Link from "next/link";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   ResponsiveContainer,
//   Tooltip,
//   Legend,
// } from "recharts";
// import { motion, AnimatePresence } from "framer-motion";
// import { FaClipboardList, FaBolt } from "react-icons/fa";

// import "./forecast.css";
// import GlobalStyles from "./GlobalStyles";
// import Footer from "./Footer";

// import {
//   allRegions,
//   regionGroups,
//   graphs,
//   bothDataMap,
//   datasetMap,
// } from "./forecastConfig";
// import CustomTooltip from "./CustomTooltip";

// export default function ForecastPage() {
//   const router = useRouter();

//   // ─── UI State ─────────────────────────────────────────────────────
//   const [isLogoHover, setLogoHover] = useState(false);
//   const [isHovering, setIsHovering] = useState(false);
//   const [isDatasetHovering, setIsDatasetHovering] = useState(false);
//   const [isRegionsHovering, setIsRegionsHovering] = useState(false);

//   const [selectedGraphId, setSelectedGraphId] = useState(graphs[0].id);
//   const selectedGraph = graphs.find((g) => g.id === selectedGraphId);

//   const [selectedDatasetId, setSelectedDatasetId] = useState(
//     selectedGraph.dataset_ids[0]
//   );
//   const [selectedRegions, setSelectedRegions] = useState(allRegions);

//   // reset dataset when graph changes
//   useEffect(() => {
//     setSelectedDatasetId(selectedGraph.dataset_ids[0]);
//   }, [selectedGraph]);

//   // reset regions when dataset changes
//   useEffect(() => {
//     setSelectedRegions(datasetMap[selectedDatasetId].regions);
//   }, [selectedDatasetId]);

//   // overlay control
//   const [showPrompt, setShowPrompt] = useState(false);

//   // ─── Region grouping logic ─────────────────────────────────────────
//   const regionsByGroup = useMemo(() => {
//     return Object.fromEntries(
//       Object.entries(regionGroups).map(([grp, list]) => [
//         grp,
//         list.map((name) => ({ id: name, name })),
//       ])
//     );
//   }, []);

//   const [openGroups, setOpenGroups] = useState(() =>
//     Object.fromEntries(Object.keys(regionsByGroup).map((g) => [g, false]))
//   );

//   // ─── Chart logic ─────────────────────────────────────────────────
//   const bothData = bothDataMap[selectedGraphId];
//   const hasLinear = selectedGraph.forecast_types.includes("linear");
//   const hasScore = selectedGraph.forecast_types.includes("score");
//   const hasAi = selectedGraph.forecast_types.includes("ai");
//   const hasRaceInsights = selectedGraph.forecast_types.includes("raceInsights");

//   const legendPayload = useMemo(() => {
//     const items = [{ value: "Historical", type: "line", color: "#D64444" }];
//     if (hasLinear)
//       items.push({ value: "Forecast (Stats)", type: "line", color: "#F58C1F" });
//     if (hasScore)
//       items.push({
//         value: "Forecast (Survey-based)",
//         type: "line",
//         color: "#23DD1D",
//       });
//     if (hasAi)
//       items.push({ value: "Forecast (AI)", type: "line", color: "#0080FF" });
//     if (hasRaceInsights)
//       items.push({
//         value: "Forecast (Race Insights)",
//         type: "line",
//         color: "#8A2BE2",
//       });
//     return items;
//   }, [hasLinear, hasScore, hasAi, hasRaceInsights]);

//   const abbreviate = (v) => {
//     if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
//     if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
//     if (v >= 1e3) return `${(v / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
//     return v;
//   };

//   // ─── Subscription overlay ──────────────────────────────────────────
//   function SubscriptionPrompt({ onClose }) {
//     return (
//       <div className="subscribe-prompt">
//         <p>Please subscribe to unlock this feature.</p>
//         <button
//           className="subscribe-btn"
//           onClick={() => {
//             onClose();
//             router.push("https://raceautoindia.com/subscription");
//           }}
//         >
//           Subscribe Now
//         </button>
//         <style jsx>{`
//           .subscribe-prompt {
//             position: absolute;
//             top: 50%;
//             left: 50%;
//             transform: translate(-50%, -50%);
//             background: rgba(20, 20, 20, 0.9);
//             padding: 1.5rem;
//             border-radius: 0.5rem;
//             color: #fff;
//             text-align: center;
//             z-index: 10;
//           }
//           .subscribe-btn {
//             margin-top: 1rem;
//             padding: 0.5rem 1rem;
//             background: var(--accent);
//             border: none;
//             border-radius: 0.25rem;
//             cursor: pointer;
//             font-weight: bold;
//           }
//         `}</style>
//       </div>
//     );
//   }

//   // ─── Render ────────────────────────────────────────────────────────
//   return (
//     <>
//       <GlobalStyles />

//       {/* DESKTOP VIEW */}
//       <motion.div
//         className="de-view container-fluid"
//         style={{ background: "#2C2E31" }}
//         initial={{ opacity: 0, y: 10 }}
//         animate={{ opacity: 1, y: 0 }}
//         exit={{ opacity: 0, y: -10 }}
//         transition={{ duration: 0.4 }}
//       >
//         <div className="container mt-1">
//           {/* APP HEADER */}
//           <div className="app-header d-flex justify-content-between align-items-center">
//             <Link href="/" passHref>
//               <motion.div
//                 className="logo-container"
//                 onMouseEnter={() => setLogoHover(true)}
//                 onMouseLeave={() => setLogoHover(false)}
//                 onClick={() => router.push("/")}
//                 animate={{
//                   scale: isLogoHover ? 1.05 : 1,
//                   filter: isLogoHover
//                     ? "drop-shadow(0 0 12px var(--accent, #FFDC00))"
//                     : "none",
//                 }}
//                 transition={{
//                   scale: { type: "spring", stiffness: 300, damping: 20 },
//                   filter: { duration: 0.2 },
//                 }}
//               >
//                 <Image
//                   src="/images/log.png"
//                   alt="Logo"
//                   width={170}
//                   height={60}
//                 />
//               </motion.div>
//             </Link>
//             <div className="nav-buttons">
//               <button
//                 className="nav-btn"
//                 onClick={() => router.push("/score-card")}
//               >
//                 <FaClipboardList className="btn-icon" /> Build Your Own Tailored
//                 Forecast
//               </button>
//               <button
//                 className="nav-btn"
//                 onClick={() => router.push("/reports")}
//               >
//                 <FaBolt className="btn-icon" /> Flash Reports
//               </button>
//             </div>
//           </div>

//           {/* GRAPH SELECTOR */}
//           <h5 className="chart-header">
//             <div
//               className={`dropdown-toggle ${isHovering ? "dropdown-open" : ""}`}
//               onMouseEnter={() => setIsHovering(true)}
//               onMouseLeave={() => setIsHovering(false)}
//             >
//               <span className="chart-title">{selectedGraph.name}</span>
//               <div className={`chart-dropdown ${isHovering ? "open" : ""}`}>
//                 {graphs.map((g) => (
//                   <div
//                     key={g.id}
//                     onClick={() => setSelectedGraphId(g.id)}
//                     className="mt-1"
//                     style={{ cursor: "pointer" }}
//                   >
//                     {g.name}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </h5>

//           {/* DATASET & REGION PICKERS */}
//           <div className="selectors d-flex align-items-center gap-3">
//             {/* Dataset */}
//             <div
//               className={`dropdown-toggle ${
//                 isDatasetHovering ? "dropdown-open" : ""
//               }`}
//               onMouseEnter={() => setIsDatasetHovering(true)}
//               onMouseLeave={() => setIsDatasetHovering(false)}
//             >
//               <span style={{ color: "white" }}>Categories</span>
//               <div
//                 className={`chart-dropdown ${isDatasetHovering ? "open" : ""}`}
//               >
//                 {selectedGraph.dataset_ids.map((dsId) => (
//                   <div
//                     key={dsId}
//                     onClick={() => setShowPrompt(true)}
//                     className="mt-1"
//                     style={{ cursor: "pointer", color: "white" }}
//                   >
//                     {datasetMap[dsId].label}
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Regions */}
//             <div
//               className={`dropdown-toggle ${
//                 isRegionsHovering ? "dropdown-open" : ""
//               }`}
//               onMouseEnter={() => setIsRegionsHovering(true)}
//               onMouseLeave={() => setIsRegionsHovering(false)}
//             >
//               <span style={{ color: "white" }}>Regions</span>
//               <div
//                 className={`chart-dropdown ${isRegionsHovering ? "open" : ""}`}
//               >
//                 {/* select/remove all */}
//                 <div
//                   onClick={() => setShowPrompt(true)}
//                   className="mt-1 select-all"
//                   style={{
//                     cursor: "pointer",
//                     fontWeight: 600,
//                     color: "var(--accent)",
//                   }}
//                 >
//                   {selectedRegions.length === allRegions.length
//                     ? "Remove all"
//                     : "Select all"}
//                 </div>

//                 {/* grouped regions */}
//                 {Object.entries(regionsByGroup).map(([grp, nodes]) => {
//                   const allSel = nodes.every((n) =>
//                     selectedRegions.includes(n.name)
//                   );
//                   return (
//                     <div key={grp} style={{ marginBottom: 8, color: "white" }}>
//                       <label
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           cursor: "pointer",
//                         }}
//                       >
//                         <input
//                           type="checkbox"
//                           className="me-2"
//                           checked={allSel}
//                           onChange={() => setShowPrompt(true)}
//                         />
//                         <strong
//                           onClick={(e) => {
//                             e.preventDefault();
//                             e.stopPropagation();
//                             setOpenGroups((o) => ({ ...o, [grp]: !o[grp] }));
//                           }}
//                           style={{ userSelect: "none" }}
//                         >
//                           {grp} {openGroups[grp] ? "▾" : "▸"}
//                         </strong>
//                       </label>
//                       {openGroups[grp] &&
//                         nodes.map((node) => (
//                           <label
//                             key={node.id}
//                             className="d-block ps-3"
//                             style={{
//                               fontSize: 14,
//                               marginTop: 4,
//                               color: "white",
//                               cursor: "pointer",
//                             }}
//                           >
//                             <input
//                               type="checkbox"
//                               className="me-2"
//                               checked={selectedRegions.includes(node.name)}
//                               onChange={() => setShowPrompt(true)}
//                             />
//                             {node.name}
//                           </label>
//                         ))}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>

//           {/* LINE CHART + SUBSCRIPTION PROMPT */}
//           <div className="mt-3">
//             <div className="chart-container">
//               <AnimatePresence mode="wait">
//                 <motion.div
//                   key={selectedGraphId}
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -10 }}
//                   transition={{ duration: 0.5 }}
//                 >
//                   <div
//                     className="chart-card"
//                     style={{
//                       filter: showPrompt ? "blur(4px)" : "none",
//                       pointerEvents: showPrompt ? "none" : "auto",
//                     }}
//                   >
//                     <ResponsiveContainer width="100%" height={400}>
//                       <LineChart
//                         data={bothData}
//                         margin={{ top: 20, right: 20, bottom: 0, left: 10 }}
//                       >
//                         <defs>
//                           <linearGradient
//                             id="histGrad"
//                             x1="0"
//                             y1="0"
//                             x2="0"
//                             y2="1"
//                           >
//                             <stop
//                               offset="0%"
//                               stopColor={
//                                 hasLinear && hasScore ? "#D64444" : "#1039EE"
//                               }
//                               stopOpacity={0.9}
//                             />
//                             <stop
//                               offset="100%"
//                               stopColor={
//                                 hasLinear && hasScore ? "#D64444" : "#1039EE"
//                               }
//                               stopOpacity={0.3}
//                             />
//                           </linearGradient>
//                         </defs>
//                         <CartesianGrid
//                           stroke="rgba(255,255,255,0.1)"
//                           strokeDasharray="3 3"
//                         />
//                         <XAxis
//                           dataKey="year"
//                           axisLine={false}
//                           tickLine={false}
//                           tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
//                         />
//                         <YAxis
//                           axisLine={false}
//                           tickLine={false}
//                           tick={{ fill: "#FFC107", fontSize: 12 }}
//                           domain={["auto", "auto"]}
//                           tickFormatter={abbreviate}
//                         />
//                         <Tooltip content={<CustomTooltip />} />
//                         <Legend
//                           wrapperStyle={{ marginTop: 24 }}
//                           payload={legendPayload}
//                         />

//                         <Line
//                           dataKey="value"
//                           name="Historical"
//                           stroke="url(#histGrad)"
//                           strokeWidth={3}
//                           connectNulls
//                         />
//                         {hasLinear && (
//                           <Line
//                             dataKey="forecastLinear"
//                             name="Forecast (Stats)"
//                             stroke="#F58C1F"
//                             strokeWidth={2}
//                             strokeDasharray="5 5"
//                             connectNulls
//                           />
//                         )}
//                         {hasScore && (
//                           <Line
//                             dataKey="forecastScore"
//                             name="Forecast (Survey-based)"
//                             stroke="#23DD1D"
//                             strokeWidth={2}
//                             strokeDasharray="2 2"
//                             connectNulls
//                           />
//                         )}
//                         {hasAi && (
//                           <Line
//                             dataKey="forecastAi"
//                             name="Forecast (AI)"
//                             stroke="#0080FF"
//                             strokeWidth={2}
//                             strokeDasharray="3 3"
//                             connectNulls
//                           />
//                         )}
//                         {hasRaceInsights && (
//                           <Line
//                             dataKey="forecastRaceInsights"
//                             name="Forecast (Race Insights)"
//                             stroke="#8A2BE2"
//                             strokeWidth={2}
//                             strokeDasharray="1 4"
//                             connectNulls
//                           />
//                         )}
//                       </LineChart>
//                     </ResponsiveContainer>
//                   </div>
//                   {showPrompt && (
//                     <SubscriptionPrompt onClose={() => setShowPrompt(false)} />
//                   )}
//                 </motion.div>
//               </AnimatePresence>
//             </div>
//             <style jsx>{`
//               .chart-container {
//                 position: relative;
//               }
//             `}</style>
//           </div>

//           <div style={{ height: ".75rem" }} />
//           <Footer />
//         </div>
//       </motion.div>
//     </>
//   );
// }
