"use client";
import React, { useState } from "react";
import { FaPlay } from "react-icons/fa";
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
} from "recharts";

const SidebarToggle = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAutoOpen, setIsAutoOpen] = useState(true);
  const [isComparedByOpen, setIsComparedByOpen] = useState(true);
  const [selectedChart, setSelectedChart] = useState(
    "Bajaj's Auto's Operating Profit Margin (Rs.Cr)"
  );
  const [chartType, setChartType] = useState("line");
  const [selectedCategories, setSelectedCategories] = useState([
    "Light CV",
    "Medium And Heavy CV",
    "Mopeds",
    "Motor Cycles",
  ]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const toggleAutoCollapse = () => setIsAutoOpen((prev) => !prev);
  const toggleComparedBy = () => setIsComparedByOpen((prev) => !prev);
  const toggleChartType = () =>
    setChartType((prev) => (prev === "line" ? "bar" : "line"));

  const bajajAutoData = [
    {
      year: "2013",
      "Light CV": 500000,
      "Medium And Heavy CV": 1500000,
      Mopeds: 800000,
      "Motor Cycles": 700000,
    },
    {
      year: "2014",
      "Light CV": 600000,
      "Medium And Heavy CV": 1400000,
      Mopeds: 900000,
      "Motor Cycles": 800000,
    },
    {
      year: "2015",
      "Light CV": 550000,
      "Medium And Heavy CV": 1600000,
      Mopeds: 850000,
      "Motor Cycles": 750000,
    },
    {
      year: "2016",
      "Light CV": 700000,
      "Medium And Heavy CV": 1300000,
      Mopeds: 1000000,
      "Motor Cycles": 900000,
    },
    {
      year: "2017",
      "Light CV": 500000,
      "Medium And Heavy CV": 1500000,
      Mopeds: 800000,
      "Motor Cycles": 700000,
    },
    {
      year: "2018",
      "Light CV": 600000,
      "Medium And Heavy CV": 1400000,
      Mopeds: 900000,
      "Motor Cycles": 800000,
    },
    {
      year: "2019",
      "Light CV": 550000,
      "Medium And Heavy CV": 1600000,
      Mopeds: 850000,
      "Motor Cycles": 750000,
    },
    {
      year: "2020",
      "Light CV": 700000,
      "Medium And Heavy CV": 1300000,
      Mopeds: 1000000,
      "Motor Cycles": 900000,
    },
    {
      year: "2021",
      "Light CV": 500000,
      "Medium And Heavy CV": 1500000,
      Mopeds: 800000,
      "Motor Cycles": 700000,
    },
    {
      year: "2022",
      "Light CV": 600000,
      "Medium And Heavy CV": 1400000,
      Mopeds: 900000,
      "Motor Cycles": 800000,
    },
    {
      year: "2023",
      "Light CV": 550000,
      "Medium And Heavy CV": 1600000,
      Mopeds: 850000,
      "Motor Cycles": 750000,
    },
    {
      year: "2024",
      "Light CV": 700000,
      "Medium And Heavy CV": 1300000,
      Mopeds: 1000000,
      "Motor Cycles": 900000,
    },
  ];

  const allCategories = [
    "Light CV",
    "Medium And Heavy CV",
    "Mopeds",
    "Motor Cycles",
  ];

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };
  const getColorForCategory = (category) => {
    const colors = {
      "Light CV": "#1039EE",
      "Medium And Heavy CV": "#23DD1D",
      Mopeds: "#38CCD4",
      "Motor Cycles": "#F58C1F",
    };
    return colors[category] || "#000000";
  };

  return (
    <>
      <div className="de-view  conatainer-fluid ">
        <div className=" conatainer-fluid d-flex ">
          <p
            onClick={toggleSidebar}
            style={{ fontSize: "24px", cursor: "pointer", marginTop: "8px" }}
          >
            <FaPlay />
          </p>

          {isSidebarOpen && (
            <div
              className="fw-bold border-end border-2 border-black"
              style={{ width: "300px", padding: "10px" }}
            >
              <h2 style={{ color: "#15AFE4" }}>Data Analytics</h2>
              <h4
                onClick={toggleAutoCollapse}
                style={{ cursor: "pointer", padding: "8px 0" }}
              >
                AUTO {isAutoOpen ? "▼" : "▲"}
              </h4>

              {isAutoOpen && (
                <div style={{ fontSize: "14px" }}>
                  <div
                    onClick={() => {
                      setSelectedChart(
                        "Bajaj's Auto's Operating Profit Margin (Rs.Cr)"
                      );
                      setChartType("bar");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Bajaj's Auto's Operating Profit Margin (Rs.Cr)
                  </div>

                  <div
                    onClick={() => {
                      setSelectedChart("Time Series");
                      setChartType("line");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Time Series
                  </div>

                  <div
                    onClick={() => {
                      setSelectedChart("Bajaj Auto's Sales Distribution");
                      setChartType("pie");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Bajaj Auto's Sales Distribution
                  </div>
                  <div
                    onClick={() => {
                      setSelectedChart(
                        "Bajaj's Auto's Operating Profit Margin (Rs.Cr)"
                      );
                      setChartType("bar");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Bajaj's Auto's Operating Profit Margin (Rs.Cr)
                  </div>

                  <div
                    onClick={() => {
                      setSelectedChart("Time Series");
                      setChartType("line");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Time Series
                  </div>

                  <div
                    onClick={() => {
                      setSelectedChart("Bajaj Auto's Sales Distribution");
                      setChartType("pie");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Bajaj Auto's Sales Distribution
                  </div>
                  <div
                    onClick={() => {
                      setSelectedChart(
                        "Bajaj's Auto's Operating Profit Margin (Rs.Cr)"
                      );
                      setChartType("bar");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Bajaj's Auto's Operating Profit Margin (Rs.Cr)
                  </div>

                  <div
                    onClick={() => {
                      setSelectedChart("Time Series");
                      setChartType("line");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Time Series
                  </div>

                  <p
                    onClick={() => {
                      setSelectedChart("Bajaj Auto's Sales Distribution");
                      setChartType("pie");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Bajaj Auto's Sales Distribution
                  </p>
                </div>
              )}

              <h5
                onClick={toggleComparedBy}
                style={{ cursor: "pointer", marginTop: "20px" }}
              >
                COMPARED BY {isComparedByOpen ? "▼" : "▲"}
              </h5>
              {isComparedByOpen && (
                <div style={{ fontSize: "14px" }}>
                  {allCategories.map((category, index) => (
                    <div key={index} className="d-flex align-items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="me-2"
                      />
                      <label>{category}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="container mt-3">
            <h2 className="ms-5 mt-5" style={{ color: "#FFCD24" }}>
              Race Analytics
            </h2>
            <h5 className="text-center">{selectedChart}</h5>

            <ResponsiveContainer width="100%" height={350}>
              {chartType === "line" ? (
                <LineChart data={bajajAutoData}>
                  <XAxis dataKey="year" stroke="black" />
                  <YAxis stroke="black" />
                  <Tooltip />
                  <Legend />
                  {selectedCategories.map((category) => (
                    <Line
                      key={category}
                      type="monotone"
                      dataKey={category}
                      stroke={getColorForCategory(category)}
                      strokeWidth={3}
                    />
                  ))}
                </LineChart>
              ) : chartType === "bar" ? (
                <BarChart width={800} height={400} data={bajajAutoData}>
                  <XAxis dataKey="year" stroke="black" />
                  <YAxis stroke="black" />
                  <Tooltip />
                  <Legend />
                  {selectedCategories.map((category) => (
                    <Bar
                      key={category}
                      dataKey={category}
                      stackId="a"
                      fill={getColorForCategory(category)}
                    />
                  ))}
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={selectedCategories.map((category) => ({
                      name: category,
                      value: bajajAutoData.reduce(
                        (sum, entry) => sum + entry[category],
                        0
                      ), 
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#FF7F0E"
                    label={({ name, value }) => `${name}: ${value}`} 
                    labelLine={false}
                  >
                    {selectedCategories.map((category, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getColorForCategory(category)}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
            <p className="fw-bold mt-2">Source: N/A</p>
            <div className="d-flex fw-bold" style={{ gap: "50px" }}>
              <p>© Copyright 2025 Race Auto India - All Rights Reserved.</p>
              <p>Term & Conditions </p>
              <p>Privacy & Policy</p>
            </div>
          </div>
        </div>
      </div>

      
      {/* mobile */}
      <div className="mo-view container-fluid ">
        {/* <p
        onClick={toggleSidebar}
        style={{ fontSize: "24px", cursor: "pointer", marginTop: "8px" }}
      >
        <FaPlay />
      </p> */}

        {isSidebarOpen && (
          <div className="fw-bold " style={{ width: "300px", padding: "10px" }}>
            <h2 style={{ color: "#15AFE4" }}>Data Analytics</h2>
            <h6
              onClick={toggleAutoCollapse}
              style={{
                cursor: "pointer",
                padding: "8px 0",
                borderTop: "1px solid #000",
                borderBottom: "1px solid #000",
              }}
            >
              AUTO {isAutoOpen ? "▼" : "▲"}
            </h6>

            {isAutoOpen && (
              <div style={{ fontSize: "14px" }}>
                <div
                  onClick={() => {
                    setSelectedChart(
                      "Bajaj's Auto's Operating Profit Margin (Rs.Cr)"
                    );
                    setChartType("bar");
                    setIsAutoOpen(false);
                    document
                      .getElementById("chart-section")
                      .scrollIntoView({ behavior: "smooth" });
                      setTimeout(() => {
                        const chartElement = document.getElementById("chart-section");
                        if (chartElement) {
                          chartElement.scrollIntoView({ behavior: "smooth" });
                        }
                      }, 100);
                  }}
                  style={{ cursor: "pointer" }}
                  className="mt-1"
                >
                  Bajaj's Auto's Operating Profit Margin (Rs.Cr)
                </div>

                <div
                  onClick={() => {
                    setSelectedChart("Time Series");
                    setChartType("line");
                    setIsAutoOpen(false);
                    document
                      .getElementById("chart-section")
                      .scrollIntoView({ behavior: "smooth" });
                      setTimeout(() => {
                        const chartElement = document.getElementById("chart-section");
                        if (chartElement) {
                          chartElement.scrollIntoView({ behavior: "smooth" });
                        }
                      }, 100);
                  }}
                  style={{ cursor: "pointer" }}
                  className="mt-1"
                >
                  Time Series
                </div>

                <div
                  onClick={() => {
                    setSelectedChart("Bajaj Auto's Sales Distribution");
                    setChartType("pie");
                    setIsAutoOpen(false);
                    document
                      .getElementById("chart-section")
                      .scrollIntoView({ behavior: "smooth" });
                      setTimeout(() => {
                        const chartElement = document.getElementById("chart-section");
                        if (chartElement) {
                          chartElement.scrollIntoView({ behavior: "smooth" });
                        }
                      }, 100);
                  }}
                  style={{ cursor: "pointer" }}
                  className="mt-1"
                >
                  Bajaj Auto's Sales Distribution
                </div>
                <div
                  onClick={() => {
                    setSelectedChart(
                      "Bajaj's Auto's Operating Profit Margin (Rs.Cr)"
                    );
                    setChartType("bar");
                    setIsAutoOpen(false);
                    document
                      .getElementById("chart-section")
                      .scrollIntoView({ behavior: "smooth" });
                      setTimeout(() => {
                        const chartElement = document.getElementById("chart-section");
                        if (chartElement) {
                          chartElement.scrollIntoView({ behavior: "smooth" });
                        }
                      }, 100);
                  }}
                  style={{ cursor: "pointer" }}
                  className="mt-1"
                >
                  Bajaj's Auto's Operating Profit Margin (Rs.Cr)
                </div>

                <div
                  onClick={() => {
                    setSelectedChart("Time Series");
                    setChartType("line");
                    setIsAutoOpen(false);
                    document
                      .getElementById("chart-section")
                      .scrollIntoView({ behavior: "smooth" });
                      setTimeout(() => {
                        const chartElement = document.getElementById("chart-section");
                        if (chartElement) {
                          chartElement.scrollIntoView({ behavior: "smooth" });
                        }
                      }, 100);
                  }}
                  style={{ cursor: "pointer" }}
                  className="mt-1"
                >
                  Time Series
                </div>

                <div
                  onClick={() => {
                    setSelectedChart("Bajaj Auto's Sales Distribution");
                    setChartType("pie");
                    setIsAutoOpen(false);
                  
                    // Wait for the state update to complete, then scroll
                    setTimeout(() => {
                      const chartElement = document.getElementById("chart-section");
                      if (chartElement) {
                        chartElement.scrollIntoView({ behavior: "smooth" });
                      }
                    }, 100); // Small delay to allow React to re-render
                  }}
                  
                  style={{ cursor: "pointer" }}
                  className="mt-1"
                >
                  Bajaj Auto's Sales Distribution
                </div>
              </div>
            )}

            <h6
              onClick={toggleComparedBy}
              style={{
                cursor: "pointer",
                marginTop: "20px",
                borderTop: "1px solid #000",
                borderBottom: "1px solid #000",
                padding: "8px 0",
              }}
            >
              COMPARED BY {isComparedByOpen ? "▼" : "▲"}
            </h6>
            {isComparedByOpen && (
              <div style={{ fontSize: "14px" }}>
                {allCategories.map((category, index) => (
                  <div key={index} className="d-flex align-items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="me-2"
                    />
                    <label>{category}</label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="chart-section container mt-3"  id="chart-section">
          <h2 className="ms-5 mt-5" style={{ color: "#FFCD24" }}>
            Race Analytics
          </h2>
          <h5 className="text-center">{selectedChart}</h5>

          <ResponsiveContainer width="100%" height={350}>
            {chartType === "line" ? (
              <LineChart data={bajajAutoData}>
                <XAxis dataKey="year" stroke="black" />
                <YAxis stroke="black" />
                <Tooltip />
                <Legend />
                {selectedCategories.map((category) => (
                  <Line
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={getColorForCategory(category)}
                    strokeWidth={3}
                  />
                ))}
              </LineChart>
            ) : chartType === "bar" ? (
              <BarChart width={800} height={400} data={bajajAutoData}>
                <XAxis dataKey="year" stroke="black" />
                <YAxis stroke="black" />
                <Tooltip />
                <Legend />
                {selectedCategories.map((category) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    stackId="a"
                    fill={getColorForCategory(category)}
                  />
                ))}
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={selectedCategories.map((category) => ({
                    name: category,
                    value: bajajAutoData.reduce(
                      (sum, entry) => sum + entry[category],
                      0
                    ), // Sum up values
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#FF7F0E"
                  label={({ name, value }) => `${name}: ${value}`} // Clean labels
                  labelLine={false}
                >
                  {selectedCategories.map((category, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getColorForCategory(category)}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
          <p className="fw-bold mt-2">Source: N/A</p>
          <p className="fw-bold" style={{ fontSize: "12px" }}>
            © Copyright 2025 Race Auto India - All Rights Reserved.
          </p>
          <div className="d-flex" style={{ gap: "50px" }}>
            <p className="fw-bold">Term & Conditions </p>
            <p className="fw-bold">Privacy & Policy</p>
          </div>
          <div style={{ height: "100px" }}></div>
        </div>
      </div>
      {/* tab */}
      <div className="ta-view container-fluid ">
        {/* <p
        onClick={toggleSidebar}
        style={{ fontSize: "24px", cursor: "pointer", marginTop: "8px" }}
      >
        <FaPlay />
      </p> */}

<div className="row">
  {/* AUTO Section */}
  <div className="col-6">
    <h6
      onClick={toggleAutoCollapse}
      style={{
        cursor: "pointer",
        padding: "8px 0",
        borderTop: "1px solid #000",
        borderBottom: "1px solid #000",
      }}
    >
      AUTO {isAutoOpen ? "▼" : "▲"}
    </h6>
    {isAutoOpen && (
                <div style={{ fontSize: "14px" }}>
                  <div
                    onClick={() => {
                      setSelectedChart(
                        "Bajaj's Auto's Operating Profit Margin (Rs.Cr)"
                      );
                      setChartType("bar");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Bajaj's Auto's Operating Profit Margin (Rs.Cr)
                  </div>

                  <div
                    onClick={() => {
                      setSelectedChart("Time Series");
                      setChartType("line");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Time Series
                  </div>

                  <div
                    onClick={() => {
                      setSelectedChart("Bajaj Auto's Sales Distribution");
                      setChartType("pie");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Bajaj Auto's Sales Distribution
                  </div>
                  <div
                    onClick={() => {
                      setSelectedChart(
                        "Bajaj's Auto's Operating Profit Margin (Rs.Cr)"
                      );
                      setChartType("bar");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Bajaj's Auto's Operating Profit Margin (Rs.Cr)
                  </div>

                  <div
                    onClick={() => {
                      setSelectedChart("Time Series");
                      setChartType("line");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Time Series
                  </div>

                  <div
                    onClick={() => {
                      setSelectedChart("Bajaj Auto's Sales Distribution");
                      setChartType("pie");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Bajaj Auto's Sales Distribution
                  </div>
                  <div
                    onClick={() => {
                      setSelectedChart(
                        "Bajaj's Auto's Operating Profit Margin (Rs.Cr)"
                      );
                      setChartType("bar");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Bajaj's Auto's Operating Profit Margin (Rs.Cr)
                  </div>

                  <div
                    onClick={() => {
                      setSelectedChart("Time Series");
                      setChartType("line");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Time Series
                  </div>

                  <p
                    onClick={() => {
                      setSelectedChart("Bajaj Auto's Sales Distribution");
                      setChartType("pie");
                    }}
                    style={{ cursor: "pointer" }}
                    className="mt-1"
                  >
                    Bajaj Auto's Sales Distribution
                  </p>
                </div>
              )}
  </div>

  {/* COMPARED BY Section */}
  <div className="col-6">
    <h6
      onClick={toggleComparedBy}
      style={{
        cursor: "pointer",
        padding: "8px 0",
        borderTop: "1px solid #000",
        borderBottom: "1px solid #000",
      }}
    >
      COMPARED BY {isComparedByOpen ? "▼" : "▲"}
    </h6>
    {isComparedByOpen && (
      <div style={{ fontSize: "14px" }}>
        {allCategories.map((category, index) => (
          <div key={index} className="d-flex align-items-center">
            <input
              type="checkbox"
              checked={selectedCategories.includes(category)}
              onChange={() => toggleCategory(category)}
              className="me-2"
            />
            <label>{category}</label>
          </div>
        ))}
      </div>
    )}
  </div>
</div>


        <div className="chart-section container mt-3"  id="chart-section">
          <h2 className="ms-5 mt-5" style={{ color: "#FFCD24" }}>
            Race Analytics
          </h2>
          <h5 className="text-center">{selectedChart}</h5>

          <ResponsiveContainer width="100%" height={350}>
            {chartType === "line" ? (
              <LineChart data={bajajAutoData}>
                <XAxis dataKey="year" stroke="black" />
                <YAxis stroke="black" />
                <Tooltip />
                <Legend />
                {selectedCategories.map((category) => (
                  <Line
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={getColorForCategory(category)}
                    strokeWidth={3}
                  />
                ))}
              </LineChart>
            ) : chartType === "bar" ? (
              <BarChart width={800} height={400} data={bajajAutoData}>
                <XAxis dataKey="year" stroke="black" />
                <YAxis stroke="black" />
                <Tooltip />
                <Legend />
                {selectedCategories.map((category) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    stackId="a"
                    fill={getColorForCategory(category)}
                  />
                ))}
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={selectedCategories.map((category) => ({
                    name: category,
                    value: bajajAutoData.reduce(
                      (sum, entry) => sum + entry[category],
                      0
                    ), // Sum up values
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#FF7F0E"
                  label={({ name, value }) => `${name}: ${value}`} // Clean labels
                  labelLine={false}
                >
                  {selectedCategories.map((category, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getColorForCategory(category)}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
          <p className="fw-bold mt-2">Source: N/A</p>
          <p className="fw-bold" style={{ fontSize: "12px" }}>
            © Copyright 2025 Race Auto India - All Rights Reserved.
          </p>
          <div className="d-flex" style={{ gap: "50px" }}>
            <p className="fw-bold">Term & Conditions </p>
            <p className="fw-bold">Privacy & Policy</p>
          </div>
          <div style={{ height: "100px" }}></div>
        </div>
      </div>
    </>
  );
};

export default SidebarToggle;
