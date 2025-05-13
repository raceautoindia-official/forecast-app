"use client";
import React, { useState } from "react";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { FaPlay } from "react-icons/fa";
import './globals.css';
const SidebarToggle = () => {
  const [selectedChart, setSelectedChart] = useState("Bajaj's Auto's Operating Profit Margin (Rs.Cr)");
  const [chartType, setChartType] = useState("bar");
  const [selectedCategories, setSelectedCategories] = useState([
    "Light CV",
    "Medium And Heavy CV",
    "Mopeds",
    "Motor Cycles",
  ]);
  const [isHovering, setIsHovering] = useState(false);
  const [isComparedByOpen, setIsComparedByOpen] = useState(false);
  const [comparedBy, setComparedBy] = useState("year");
  const [isAutoOpen, setIsAutoOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // You were using setIsCollapsed

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const toggleComparedByOpen = () => {
    setIsComparedByOpen(prev => !prev);
  };

  const toggleAutoCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleComparedBy = () => {
    setComparedBy(prev => (prev === "year" ? "category" : "year"));
  };

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const getColorForCategory = (category, isEnabled = true) => {
    const colors = {
      "Light CV": "#1039EE",
      "Medium And Heavy CV": "#23DD1D",
      Mopeds: "#38CCD4",
      "Motor Cycles": "#F58C1F",
    };
    return isEnabled ? colors[category] : "#ccc";
  };

  const allCategories = ["Light CV", "Medium And Heavy CV", "Mopeds", "Motor Cycles"];
  const chartOptions = [
    {
      label: "Bajaj's Auto's Operating Profit Margin (Rs.Cr)",
      chartType: "bar",
    },
    {
      label: "Time Series",
      chartType: "line",
    },
    {
      label: "Bajaj Auto's Sales Distribution",
      chartType: "pie",
    },
  ];

  const bajajAutoData = [
    { year: "2013", "Light CV": 50000, "Medium And Heavy CV": 150000, Mopeds: 80000, "Motor Cycles": 70000 },
    { year: "2014", "Light CV": 60000, "Medium And Heavy CV": 140000, Mopeds: 90000, "Motor Cycles": 80000 },
    { year: "2015", "Light CV": 55000, "Medium And Heavy CV": 160000, Mopeds: 85000, "Motor Cycles": 75000 },
    { year: "2016", "Light CV": 70000, "Medium And Heavy CV": 130000, Mopeds: 100000, "Motor Cycles": 90000 },
    { year: "2017", "Light CV": 50000, "Medium And Heavy CV": 150000, Mopeds: 80000, "Motor Cycles": 70000 },
    { year: "2018", "Light CV": 60000, "Medium And Heavy CV": 140000, Mopeds: 90000, "Motor Cycles": 80000 },
    { year: "2019", "Light CV": 55000, "Medium And Heavy CV": 160000, Mopeds: 85000, "Motor Cycles": 75000 },
    { year: "2020", "Light CV": 70000, "Medium And Heavy CV": 130000, Mopeds: 100000, "Motor Cycles": 90000 },
    { year: "2021", "Light CV": 50000, "Medium And Heavy CV": 150000, Mopeds: 80000, "Motor Cycles": 70000 },
    { year: "2022", "Light CV": 60000, "Medium And Heavy CV": 140000, Mopeds: 90000, "Motor Cycles": 80000 },
    { year: "2023", "Light CV": 55000, "Medium And Heavy CV": 160000, Mopeds: 85000, "Motor Cycles": 75000 },
    { year: "2024", "Light CV": 70000, "Medium And Heavy CV": 130000, Mopeds: 100000, "Motor Cycles": 90000 },
  ];

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  const handleChartChange = (option) => {
    setSelectedChart(option.label);
    setChartType(option.chartType);
    setIsDropdownOpen(false);
    setIsHovering(false);
  };



  const CustomLegend = ({ payload }) => {
    return (
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", }}>
        {payload.map((entry, index) => {
          const isSelected = selectedCategories.includes(entry.value);
          return (
            <span
              key={`item-${index}`}
              onClick={() => {
                setSelectedCategories((prev) =>
                  prev.includes(entry.value)
                    ? prev.filter((c) => c !== entry.value) // Unselect if already selected
                    : [...prev, entry.value] // Select if not already selected
                );
              }}
              style={{
                marginRight: 15,
                cursor: "pointer",
                color: isSelected ? entry.color : "#ccc", // Disable the label color when not selected
                fontWeight: isSelected ? "bold" : "normal",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  backgroundColor: entry.color,
                  marginRight: 5,
                }}
              />
              {entry.value}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* desktop view */}
      <div className="de-view container-fluid " style={{ background: "#2C2E31", marginTop: "70px" }}>
        <div className="container mt-3">
          <h5 className="text-center position-relative">
            <div
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              style={{ display: "inline-block", cursor: "pointer", position: "relative" }}
            >
              <span style={{ color: "white" }} className="mt-5">{selectedChart} ▼</span>
              <div className={`chart-dropdown ${isHovering ? "open" : ""}`}>
                {chartOptions.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedChart(option.label);
                      setChartType(option.chartType);
                    }}
                    className="mt-1"
                    style={{ cursor: "pointer" }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>

            </div>
          </h5>
            <div className="mt-5">
          <ResponsiveContainer width="100%" height={400}>
            {chartType === "line" ? (
              <LineChart data={bajajAutoData}>
                <XAxis dataKey="year" stroke="white" tick={{ fill: 'white' }} />
                <YAxis stroke="white" tick={{ fill: 'white' }} />
                <Tooltip contentStyle={{ backgroundColor: "#000", border: "none" }} labelStyle={{ color: "white" }} itemStyle={{ color: "white" }} />
                <Legend content={<CustomLegend />} />
                {allCategories.map((category) =>
                  selectedCategories.includes(category) ? (
                    <Line
                      key={category}
                      type="monotone"
                      dataKey={category}
                      stroke={getColorForCategory(category)}
                      strokeWidth={4} // Make the stroke width larger here (e.g., 8)
                      dot={false}
                    />
                  ) : (
                    <Line
                      key={category}
                      type="monotone"
                      dataKey={category}
                      stroke={getColorForCategory(category, false)}
                      strokeWidth={8} // Ensure the stroke width is also increased here
                      dot={false}
                      strokeOpacity={0.3}
                    />
                  )
                )}
              </LineChart>
            ) : chartType === "bar" ? (
              <BarChart data={bajajAutoData}>
                <XAxis dataKey="year" stroke="white" tick={{ fill: 'white' }} />
                <YAxis stroke="white" tick={{ fill: 'white' }} />
                <Tooltip contentStyle={{ backgroundColor: "#000", border: "none" }} labelStyle={{ color: "white" }} itemStyle={{ color: "white" }} />
                <Legend content={<CustomLegend />} />
                {allCategories.map((category) =>
                  selectedCategories.includes(category) ? (
                    <Bar
                      key={category}
                      dataKey={category}
                      stackId="a"
                      fill={getColorForCategory(category)}
                    />
                  ) : (
                    <Bar
                      key={category}
                      dataKey={category}
                      stackId="a"
                      fill={getColorForCategory(category, false)}
                      opacity={0.3}
                    />
                  )
                )}
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={allCategories
                    .filter((category) => selectedCategories.includes(category))
                    .map((category) => ({
                      name: category,
                      value: bajajAutoData.reduce((sum, entry) => sum + entry[category], 0),
                    }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                  fill="#fff"
                >
                  {allCategories
                    .filter((category) => selectedCategories.includes(category))
                    .map((category, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getColorForCategory(category)}
                        style={{
                          opacity: selectedCategories.includes(category) ? 1 : 0.3,
                        }}
                      />
                    ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#000", border: "none" }} labelStyle={{ color: "white" }} itemStyle={{ color: "white" }} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            )}
          </ResponsiveContainer>
          </div>



          <p className="fw-bold mt-4 text-white">Source: N/A</p>
          <div className="d-flex fw-bold" style={{ gap: "50px" }}>
            <p className="text-white">© Copyright 2025 Race Auto India - All Rights Reserved.</p>
            <p className="text-white">Term & Conditions</p>
            <p className="text-white">Privacy & Policy</p>
          </div>
        </div>

        {/* Smooth dropdown CSS */}
        <style jsx>{`
        .chart-dropdown {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-10px);
          width: 430px;
          background: grey;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          border-radius: 5px;
          padding: 10px;
          text-align: left;
         color: snow;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.6s ease, transform 0.6s ease; /* Slower transition */
          z-index: 10;
        }

        .chart-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>
      </div>


      {/* mobile */}
      <div className="mo-view container-fluid">
        <div className="container mt-3">
          <h5 className="text-center position-relative">
            <div
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: 'inline-block',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <span style={{ color: 'white' }} className="mt-5">
                {selectedChart} ▼
              </span>

              <div
                className={`chart-dropdown ${isHovering || isDropdownOpen ? 'open' : ''
                  }`}
              >
                {chartOptions.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => handleChartChange(option)}
                    className="mt-1"
                    style={{ cursor: 'pointer' }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            </div>
          </h5>

          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={bajajAutoData}>
                <XAxis dataKey="year" stroke="white" tick={{ fill: 'white' }} />
                <YAxis stroke="white" tick={{ fill: 'white' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: 'none' }}
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend content={<CustomLegend />} />
                {allCategories.map((category) =>
                  selectedCategories.includes(category) ? (
                    <Line
                      key={category}
                      type="monotone"
                      dataKey={category}
                      stroke={getColorForCategory(category)}
                      strokeWidth={4}
                      dot={false}
                    />
                  ) : (
                    <Line
                      key={category}
                      type="monotone"
                      dataKey={category}
                      stroke={getColorForCategory(category, false)}
                      strokeWidth={8}
                      dot={false}
                      strokeOpacity={0.3}
                    />
                  )
                )}
              </LineChart>
            ) : chartType === 'bar' ? (
              <BarChart data={bajajAutoData}>
                <XAxis dataKey="year" stroke="white" tick={{ fill: 'white' }} />
                <YAxis stroke="white" tick={{ fill: 'white' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: 'none' }}
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend content={<CustomLegend />} />
                {allCategories.map((category) =>
                  selectedCategories.includes(category) ? (
                    <Bar
                      key={category}
                      dataKey={category}
                      stackId="a"
                      fill={getColorForCategory(category)}
                    />
                  ) : (
                    <Bar
                      key={category}
                      dataKey={category}
                      stackId="a"
                      fill={getColorForCategory(category, false)}
                      opacity={0.3}
                    />
                  )
                )}
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={allCategories
                    .filter((category) => selectedCategories.includes(category))
                    .map((category) => ({
                      name: category,
                      value: bajajAutoData.reduce(
                        (sum, entry) => sum + entry[category],
                        0
                      ),
                    }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                  fill="#fff"
                >
                  {allCategories
                    .filter((category) => selectedCategories.includes(category))
                    .map((category, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getColorForCategory(category)}
                        style={{
                          opacity: selectedCategories.includes(category) ? 1 : 0.3,
                        }}
                      />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: 'none' }}
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend content={<CustomLegend />} />
              </PieChart>
            )}
          </ResponsiveContainer>

          <p className="fw-light   mt-5 text-white">Source: N/A</p>
          <div className="d-flex flex-column fw-light mt-2">
            <p className="text-white mb-2">
              © Copyright 2025 Race Auto India - All Rights Reserved.
            </p>

          </div>
          <div className="d-flex justify-content-between">
            <p className="text-white mb-0">Terms & Conditions</p>
            <p className="text-white mb-0">Privacy & Policy</p>
          </div>


        </div>

        <style jsx>{`
        .chart-dropdown {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-10px);
          width: 300px;
          background: grey;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          border-radius: 5px;
          padding: 10px;
          text-align: left;
          opacity: 0;
          color: snow;
          visibility: hidden;
          transition: opacity 0.6s ease, transform 0.6s ease;
          z-index: 10;
        }

        .chart-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>
      </div>


      {/* tab */}
      <div className="ta-view container-fluid" style={{ marginTop: "150px" }}>
        <div className="container mt-3">
          <h5 className="text-center position-relative">
            <div
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: 'inline-block',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <span style={{ color: 'white' }} className="mt-5">
                {selectedChart} ▼
              </span>

              <div
                className={`chart-dropdown ${isHovering || isDropdownOpen ? 'open' : ''
                  }`}
              >
                {chartOptions.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => handleChartChange(option)}
                    className="mt-1"
                    style={{ cursor: 'pointer' }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            </div>
          </h5>
              <div className="mt-5">
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={bajajAutoData}>
                <XAxis dataKey="year" stroke="white" tick={{ fill: 'white' }} />
                <YAxis stroke="white" tick={{ fill: 'white' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: 'none' }}
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend content={<CustomLegend />} />
                {allCategories.map((category) =>
                  selectedCategories.includes(category) ? (
                    <Line
                      key={category}
                      type="monotone"
                      dataKey={category}
                      stroke={getColorForCategory(category)}
                      strokeWidth={4}
                      dot={false}
                    />
                  ) : (
                    <Line
                      key={category}
                      type="monotone"
                      dataKey={category}
                      stroke={getColorForCategory(category, false)}
                      strokeWidth={8}
                      dot={false}
                      strokeOpacity={0.3}
                    />
                  )
                )}
              </LineChart>
            ) : chartType === 'bar' ? (
              <BarChart data={bajajAutoData}>
                <XAxis dataKey="year" stroke="white" tick={{ fill: 'white' }} />
                <YAxis stroke="white" tick={{ fill: 'white' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: 'none' }}
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend content={<CustomLegend />} />
                {allCategories.map((category) =>
                  selectedCategories.includes(category) ? (
                    <Bar
                      key={category}
                      dataKey={category}
                      stackId="a"
                      fill={getColorForCategory(category)}
                    />
                  ) : (
                    <Bar
                      key={category}
                      dataKey={category}
                      stackId="a"
                      fill={getColorForCategory(category, false)}
                      opacity={0.3}
                    />
                  )
                )}
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={allCategories
                    .filter((category) => selectedCategories.includes(category))
                    .map((category) => ({
                      name: category,
                      value: bajajAutoData.reduce(
                        (sum, entry) => sum + entry[category],
                        0
                      ),
                    }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                  fill="#fff"
                >
                  {allCategories
                    .filter((category) => selectedCategories.includes(category))
                    .map((category, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getColorForCategory(category)}
                        style={{
                          opacity: selectedCategories.includes(category) ? 1 : 0.3,
                        }}
                      />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', border: 'none' }}
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend content={<CustomLegend />} />
              </PieChart>
            )}
          </ResponsiveContainer>
          </div>
          <p className="fw-light   text-white" style={{marginTop:"125px"}}>Source: N/A</p>
          <div className="d-flex flex-column fw-light mt-2">
            <p className="text-white mb-2">
              © Copyright 2025 Race Auto India - All Rights Reserved.
            </p>

          </div>
          <div className="d-flex justify-content-between">
            <p className="text-white mb-0">Terms & Conditions</p>
            <p className="text-white mb-0">Privacy & Policy</p>
          </div>


        </div>

        <style jsx>{`
        .chart-dropdown {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-10px);
          width: 420px;
          background: grey;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          border-radius: 5px;
          padding: 10px;
          text-align: left;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.6s ease, transform 0.6s ease;
          z-index: 10;
          color: snow;
        }

        .chart-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>
      </div>
    </>
  );
};

export default SidebarToggle;
