"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules"; // Only import once
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import './score.css';

import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";

export default function Table() {

  const [value, setValue] = useState(1);
  
  const [questions,     setQuestions]    = useState([]);
  const [years,         setYears]        = useState([]);
  const [dropdownOpts,  setDropdownOpts] = useState([]);
  const [selectedValues, setSelectedValues] = useState([]);
  const [skipFlags, setSkipFlags] = useState([]);
  
  useEffect(() => {
    async function load() {
      // 1) fetch questions
      const qRes  = await fetch('/api/questions', {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`, 
            },
          });
      const qList = await qRes.json();
      console.log(qList);
  
      // 2) fetch settings
      const sRes = await fetch('/api/scoreSettings', {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`, 
            },
          });
      const { yearNames, scoreLabels } = await sRes.json();
  
      // 3) now set ALL state at once
      setQuestions(qList);
      setYears(yearNames);
      setDropdownOpts(scoreLabels);
      setSelectedValues(
        qList.map(() => Array(yearNames.length).fill('Select'))
      );
      setSkipFlags(qList.map(() => false));
    }
    load().catch(console.error);
  }, []);

  const handleSkip = (qIdx) => {
    setSkipFlags(sf => {
      const copy = [...sf];
      copy[qIdx] = true;
      return copy;
    });
    setSelectedValues(sv => {
      const copy = sv.map(arr => [...arr]);
      // clear any previous scores if you like:
      copy[qIdx] = Array(years.length).fill(null);
      return copy;
    });
  };


  const handleSubmit = async () => {
    // build numeric lookup
    const numOpts = dropdownOpts.length;
    const step = numOpts > 1 ? 10 / (numOpts - 1) : 0;
    const labelToScore = dropdownOpts.reduce((m, lbl, i) => {
      m[lbl] = i * step;
      return m;
    }, {});

    const payload = questions.map((q, idx) => {
      let scores = [];
      if (!skipFlags[idx]) {
        scores = selectedValues[idx].map(lbl => {
          // if they never selected (or you used "Select" placeholder),
          // you can choose to push null or 0 here:
          return labelToScore[lbl] != null ? labelToScore[lbl] : null;
        });
      }
      return {
        questionId: q.id,
        scores,
        skipped:  skipFlags[idx]
      };
    });
    const res = await fetch('/api/saveScores', {
      method: 'POST',
      headers: {
          "Content-Type": "application/json" ,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_SECRET}`
        },
      body: JSON.stringify({ results: payload })
    });
    if (res.ok) {
      // e.g. navigate, toast, etc.
      console.log('Saved successfully!');
    } else {
      console.error('Save failed', await res.text());
    }
  };


  

  const mobileSwiperRef = useRef(null);
  const tabletSwiperRef = useRef(null);
  const desktopSwiperRef = useRef(null);
  useEffect(() => {
    if (!desktopSwiperRef.current) return;
    const swiperInstance = desktopSwiperRef.current;

    const updateSlide = () => {
      console.log("Swiper Changed to:", swiperInstance.activeIndex + 1);
      setValue(swiperInstance.activeIndex + 1);
    };

    swiperInstance.on("slideChange", updateSlide);

    return () => swiperInstance.off("slideChange", updateSlide);
  }, [desktopSwiperRef]);
  // tab
  useEffect(() => {
    if (!tabletSwiperRef.current) return;
    const swiperInstance = tabletSwiperRef.current;

    const updateSlide = () => {
      console.log("Swiper Changed to:", swiperInstance.activeIndex + 1);
      setValue(swiperInstance.activeIndex + 1);
    };

    swiperInstance.on("slideChange", updateSlide);

    return () => swiperInstance.off("slideChange", updateSlide);
  }, [tabletSwiperRef]);
  // mobile

  useEffect(() => {
    if (!mobileSwiperRef.current) return;
    const swiperInstance = mobileSwiperRef.current;

    const updateSlide = () => {
      console.log("Swiper Changed to:", swiperInstance.activeIndex + 1);
      setValue(swiperInstance.activeIndex + 1);
    };

    swiperInstance.on("slideChange", updateSlide);

    return () => swiperInstance.off("slideChange", updateSlide);
  }, [mobileSwiperRef]);

  const handleSliderChange = (event) => {
    const newValue = Number(event.target.value);
    console.log("Slider Changed:", newValue);
    setValue(newValue);
  };

  const chunkSize = 4;
  const questionSlides = [];
  for (let i = 0; i < questions.length; i += chunkSize) {
    questionSlides.push(questions.slice(i, i + chunkSize));
  }

  const totalPages = Math.max(1, Math.ceil(questions.length / chunkSize));

  if (!questions.length || !years.length) {
    return <div>Loading questions…</div>;
  }
  

  return (
    <>
      <div className="desktop-view container-wrapper shadow custom-border m-4">
        <div className="container-fluid p-0 m-0 mt-3">
          <div
            className="d-flex align-items-center justify-content-between w-100 px-3"
            style={{ height: "80px" }}
          >
            <Image
              src="/images/logo.png"
              alt="Company Logo"
              width={43}
              height={43}
              className="img-fluid rounded shadow-sm"
            />
            <div className="text-center flex-grow-1">
              <h1
                className="mb-0 fw-bold"
                style={{ color: "#12298C", fontSize: "35px" }}
              >
                Commercial Vehicles
              </h1>
              <h4 className="mb-0" style={{ fontSize: "20px" }}>
                Unit Sales Drivers, Ranked in Order of Impact 2025 - 2030
              </h4>
            </div>

            {/* Next Button to Slide Swiper */}
            <button
              className="btn text-white fw-bold d-flex align-items-center px-3"
              style={{ backgroundColor: "#1D478A", borderRadius: "5px" }}
              onClick={async () => {
                if (value < totalPages) {
                  desktopSwiperRef.current?.slideNext();
                } else {
                  await handleSubmit();
                }
              }}
            >
             {value < totalPages ? 'Next' : 'Submit'}{" "}
              <span className="ms-2" style={{ fontSize: "18px" }}>
                →
              </span>
            </button>
          </div>
        </div>

        <div className="container-fluid mt-3 fw-bold">
          <div
            className="d-flex justify-content-between align-items-center p-2 ms-1 mt-4"
            style={{
              backgroundColor: "rgba(204, 250, 236, 0.80)",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ color: "#12298C" }}>KEY DRIVERS</h3>
            <div
              className="d-flex gap-4 year-container"
              style={{ fontSize: "1.20rem", marginRight: "107px" }}
            >
              {years.map((year, idx) => (
                <h5 key={idx} style={{ color: "#1D478A", fontSize: "inherit" }}>{year}</h5>
              ))}

            </div>
          </div>
        </div>

        {/* Swiper Section */}
        <div className="container-fluid mt-3 fw-bold">
          <Swiper
            slidesPerView={1}
            modules={[Navigation]}
            onSwiper={(swiper) => (desktopSwiperRef.current = swiper)}
            navigation={false}
          >
            {questionSlides.map((slideQuestions, index) => (
              <SwiperSlide key={index}>
                {slideQuestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center p-3 mt-2 w-100"
                    style={{ backgroundColor: "#5EC2A4", borderRadius: "8px" }}
                  >
                    <div className="text-start w-100 w-md-50">
                      <p className="text-black fs-6 text-wrap m-0">
                        {item.text}
                      </p>
                    </div>
                    <div className="d-flex flex-wrap gap-2 justify-content-start justify-content-md-end w-100 w-md-50 mt-2 mt-md-0">
                    {years.map((_, yIdx) => (
                        <select
                            key={yIdx}
                            className="form-select fw-bold"
                            style={{ width: "110px", fontSize: "12px" }}
                            value={selectedValues[idx]?.[yIdx] || "Select"}
                            onChange={e => {
                            const newVal = e.target.value;
                            setSelectedValues(sv => {
                                const copy = sv.map(arr => [...arr]);
                                copy[idx][yIdx] = newVal;
                                return copy;
                            });
                            }}
                        >
                            <option value="Select">Select</option>
                            {dropdownOpts.map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>{opt}</option>
                            ))}
                        </select>
                    ))}


                      <button
                        className="d-flex align-items-center px-2 py-1 rounded ms-3"
                        style={{ backgroundColor: "#66C2A5", border: "none" }}
                        onClick={() => handleSkip(idx)}
                      >
                        <span className="text-dark fw-semibold">Skip</span>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="black"
                          className="mt-1"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M6 4l8 8-8 8V4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="d-inline" style={{ fontSize: "16px" }}>
            <span className="text-danger">Note:</span>
            <span className="ms-1 mt-2">
              These questions assess key factors shaping the CV industry, with
              positive ones highlighting growth drivers and negative ones
              identifying challenges. Higher impact responses indicate strong
              market shifts, while lower ones suggest stability. This approach
              enables better forecasting and strategic planning.
            </span>
          </div>

          <div className="d-flex flex-column align-items-center justify-content-center mt-3 w-100">
            {" "}
            <div className="d-flex align-items-center w-75 position-relative">
              <button
                className="border-0 bg-transparent d-flex align-items-center"
                style={{ fontSize: "30px", lineHeight: "1" }}
                onClick={() =>
                  desktopSwiperRef.current &&
                  desktopSwiperRef.current.slidePrev()
                }
              >
                ❮
              </button>

              <div
                className="position-relative flex-grow-1 mx-3"
                style={{ height: "7px", width: "100%" }}
              >
                <div
                  style={{
                    height: "7px",
                    width: "100%",
                    background: "#c6b5b5",
                    borderRadius: "10px",
                    position: "absolute",
                  }}
                ></div>
                <div
                  key={value} // Forces re-render when value changes
                  style={{
                    height: "7px",
                    width: `${(value / totalPages) * 100}%`,
                    background: "#4683A6",
                    borderRadius: "10px",
                    position: "absolute",
                    transition: "width 0.3s ease",
                  }}
                ></div>

                <input
                  type="range"
                  min="1"
                  max={totalPages}
                  value={value}
                  onChange={handleSliderChange}
                  className="form-range position-absolute"
                  style={{
                    width: "100%",
                    height: "10px",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                />
              </div>
              <button
                className="border-0 bg-transparent d-flex align-items-center"
                style={{ fontSize: "30px", lineHeight: "1" }}
                onClick={() =>
                  desktopSwiperRef.current &&
                  desktopSwiperRef.current.slideNext()
                }
              >
                ❯
              </button>
            </div>
            <div className="mt-2 fw-bold fs-5" style={{ color: "#12298C" }}>
              {value}/{totalPages}
            </div>
          </div>
          {/* Impact Levels Section */}
          <div className="row mt-5">
            <div className="col-md-4" style={{ fontSize: "16px" }}>
              <ul>
                <li>
                  VERY HIGH – Strong influence, directly shaping industry
                  trends.
                </li>
                <li>HIGH – Significant influence on market movement.</li>
                <li>MEDIUM HIGH – Noticeable but not dominant impact.</li>
              </ul>
            </div>
            <div className="col-md-4" style={{ fontSize: "16px" }}>
              <ul>
                <li>
                  MEDIUM – Moderate influence, dependent on external factors.
                </li>
                <li>MEDIUM LOW – Noticeable but not dominant impact.</li>
                <li>LOW – Minimal impact on overall industry.</li>
              </ul>
            </div>
            <div className="col-md-4" style={{ fontSize: "16px" }}>
              <ul>
                <li>VERY LOW – Negligible or nearly no effect.</li>
                <li>NO IMPACT – No expected influence on industry trends.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* mobile */}
      <div className="mobile-view container-wrapper shadow custom-border m-4">
        <div className="container-fluid p-0 m-0 mt-3">
          <div
            className="d-flex align-items-center justify-content-between w-100 px-3"
            style={{ height: "80px" }}
          >
            <Image
              src="/images/logo.png"
              alt="Company Logo"
              width={40}
              height={43}
              className="img-fluid rounded shadow-sm"
            />
            <div className="text-center flex-grow-1">
              <h1
                className="mb-0 fw-bold"
                style={{ color: "#12298C", fontSize: "25px" }}
              >
                Commercial Vehicles
              </h1>
              <h6 className="mb-0" style={{ fontSize: "13px" }}>
                Unit Sales Drivers, Ranked in Order of Impact 2025 - 2030
              </h6>
            </div>

            {/* Next Button to Slide Swiper */}
            <button
              className="btn text-white fw-bold d-flex align-items-center px-3"
              style={{ backgroundColor: "#1D478A", borderRadius: "5px" }}
              onClick={() =>
                mobileSwiperRef.current && mobileSwiperRef.current.slideNext()
              }
            >
              Next{" "}
              <span className="ms-2" style={{ fontSize: "18px" }}>
                →
              </span>
            </button>
          </div>
        </div>

        <div className="container-fluid mt-3 fw-bold">
          {/* <div
            className="d-flex justify-content-between align-items-center p-2 ms-1 mt-4"
            style={{
              backgroundColor: "rgba(204, 250, 236, 0.80)",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ color: "#12298C" }}>KEY DRIVERS</h3>
            <div
              className="d-flex gap-4 "
              style={{ fontSize: "1.20rem", marginRight: "107px" }}
            >
              {[
                "2025-2026",
                "2026-2027",
                "2027-2028",
                "2028-2029",
                "2029-2030",
              ].map((year, index) => (
                <h5
                  key={index}
                  style={{ color: "#1D478A", fontSize: "inherit" }}
                >
                  {year}
                </h5>
              ))}
            </div>
          </div> */}
        </div>

        {/* Swiper Section */}
        <div className="container-fluid mt-3 fw-bold">
          <Swiper
            slidesPerView={1}
            modules={[Navigation]}
            onSwiper={(swiper) => (mobileSwiperRef.current = swiper)}
            navigation={false}
          >
            {questionSlides.map((slideQuestions, index) => (
              <SwiperSlide key={index}>
                {slideQuestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center p-3 mt-2 w-100"
                    style={{ borderRadius: "8px" }}
                  >
                    {/* Question Section */}
                    <div className="text-start w-100 w-md-50">
                      <p className="text-black fs-6 text-wrap m-0">
                        {item.question} ({item.category})
                      </p>
                    </div>

                    {/* Dropdown & Skip Section */}
                    <div className="d-flex flex-column w-100 align-items-md-end">
                      {/* First Row - Three Dropdowns */}
                      <div className="d-flex flex-nowrap gap-2 justify-content-between w-100">
                        {["2025 to 2026", "2026 to 2027", "2027 to 2028"].map(
                          (year, idx) => (
                            <div
                              key={idx}
                              className="d-flex flex-column align-items-center"
                            >
                              <p
                                className="fw-bold text-center"
                                style={{
                                  color: "#1D478A",
                                  fontSize: "12px",
                                  marginBottom: "2px",
                                }}
                              >
                                {year}
                              </p>
                              <select
                                className="form-select fw-bold text-center"
                                style={{
                                  width: "110px",
                                  fontSize: "12px",
                                  backgroundColor: "#B3E6DA",
                                }}
                              >
                                <option>Select</option>
                                <option>No Impact</option>
                                <option>Very Low</option>
                                <option>Low</option>
                                <option>Medium Low</option>
                                <option>Medium</option>
                                <option>Medium High</option>
                                <option>High</option>
                                <option>Very High</option>
                              </select>
                            </div>
                          )
                        )}
                      </div>

                      {/* Second Row - Two Dropdowns + Skip Button (Aligned with First Row) */}
                      <div className="d-flex flex-nowrap gap-2 justify-content-between w-100 mt-2">
                        {["2028 to 2029", "2029 to 2030"].map((year, idx) => (
                          <div
                            key={idx}
                            className="d-flex flex-column align-items-center"
                          >
                            <p
                              className="fw-bold text-center"
                              style={{
                                color: "#1D478A",
                                fontSize: "12px",
                                marginBottom: "2px",
                              }}
                            >
                              {year}
                            </p>
                            <select
                              className="form-select fw-bold text-center"
                              style={{
                                width: "110px",
                                fontSize: "12px",
                                backgroundColor: "#B3E6DA",
                              }}
                            >
                              <option>Select</option>
                              <option>No Impact</option>
                              <option>Very Low</option>
                              <option>Low</option>
                              <option>Medium Low</option>
                              <option>Medium</option>
                              <option>Medium High</option>
                              <option>High</option>
                              <option>Very High</option>
                            </select>
                          </div>
                        ))}

                        {/* Skip Button - Ensure Alignment */}
                        <div
                          className="d-flex align-items-center px-2 py-1 rounded mt-3"
                          style={{
                            border: "none",
                            height: "40px",
                            alignSelf: "center",
                          }}
                        >
                          <span className="text-dark fw-semibold">Skip</span>
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="black"
                            className="mt-1"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M6 4l8 8-8 8V4z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="d-inline" style={{ fontSize: "16px" }}>
            <span className="text-danger">Note:</span>
            <span className="ms-1 mt-2">
              These questions assess key factors shaping the CV industry, with
              positive ones highlighting growth drivers and negative ones
              identifying challenges. Higher impact responses indicate strong
              market shifts, while lower ones suggest stability. This approach
              enables better forecasting and strategic planning.
            </span>
          </div>

          <div className="d-flex flex-column align-items-center justify-content-center mt-3 w-100">
            {" "}
            <div className="d-flex align-items-center w-75 position-relative">
              <button
                className="border-0 bg-transparent d-flex align-items-center"
                style={{ fontSize: "30px", lineHeight: "1" }}
                onClick={() =>
                  mobileSwiperRef.current && mobileSwiperRef.current.slidePrev()
                }
              >
                ❮
              </button>

              <div
                className="position-relative flex-grow-1 mx-3"
                style={{ height: "7px", width: "100%" }}
              >
                <div
                  style={{
                    height: "7px",
                    width: "100%",
                    background: "#c6b5b5",
                    borderRadius: "10px",
                    position: "absolute",
                  }}
                ></div>
                <div
                  key={value} // Forces re-render when value changes
                  style={{
                    height: "7px",
                    width: `${(value / totalPages) * 100}%`,
                    background: "#4683A6",
                    borderRadius: "10px",
                    position: "absolute",
                    transition: "width 0.3s ease",
                  }}
                ></div>
                <input
                  type="range"
                  min="1"
                  max={totalPages}
                  value={value}
                  onChange={handleSliderChange}
                  className="form-range position-absolute"
                  style={{
                    width: "100%",
                    height: "10px",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                />
              </div>
              <button
                className="border-0 bg-transparent d-flex align-items-center"
                style={{ fontSize: "30px", lineHeight: "1" }}
                onClick={() =>
                  mobileSwiperRef.current && mobileSwiperRef.current.slideNext()
                }
              >
                ❯
              </button>
            </div>
            <div className="mt-2 fw-bold fs-5" style={{ color: "#12298C" }}>
              {value}/{totalPages}
            </div>
          </div>
          {/* Impact Levels Section */}
          <div className="row mt-5">
            <div className="col-md-4" style={{ fontSize: "16px" }}>
              <ul>
                <li>
                  VERY HIGH – Strong influence, directly shaping industry
                  trends.
                </li>
                <li>HIGH – Significant influence on market movement.</li>
                <li>MEDIUM HIGH – Noticeable but not dominant impact.</li>
              </ul>
            </div>
            <div className="col-md-4" style={{ fontSize: "16px" }}>
              <ul>
                <li>
                  MEDIUM – Moderate influence, dependent on external factors.
                </li>
                <li>MEDIUM LOW – Noticeable but not dominant impact.</li>
                <li>LOW – Minimal impact on overall industry.</li>
              </ul>
            </div>
            <div className="col-md-4" style={{ fontSize: "16px" }}>
              <ul>
                <li>VERY LOW – Negligible or nearly no effect.</li>
                <li>NO IMPACT – No expected influence on industry trends.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* tab */}
      <div className="tab-view container-wrapper shadow custom-border m-4">
        <div className="container-fluid p-0 m-0 mt-3">
          <div
            className="d-flex align-items-center justify-content-between w-100 px-3"
            style={{ height: "80px" }}
          >
            <Image
              src="/images/logo.png"
              alt="Company Logo"
              width={40}
              height={43}
              className="img-fluid rounded shadow-sm"
            />
            <div className="text-center flex-grow-1">
              <h1
                className="mb-0 fw-bold"
                style={{ color: "#12298C", fontSize: "35px" }}
              >
                Commercial Vehicles
              </h1>
              <h6 className="mb-0" style={{ fontSize: "20px" }}>
                Unit Sales Drivers, Ranked in Order of Impact 2025 - 2030
              </h6>
            </div>
            <button
              className="btn text-white fw-bold d-flex align-items-center px-3"
              style={{ backgroundColor: "#1D478A", borderRadius: "5px" }}
              onClick={() =>
                tabletSwiperRef.current && tabletSwiperRef.current.slideNext()
              }
            >
              Next{" "}
              <span className="ms-2" style={{ fontSize: "18px" }}>
                →
              </span>
            </button>
          </div>
        </div>

        <div className="container-fluid mt-3 fw-bold">
        </div>
        <div className="container-fluid mt-3 fw-bold">
          <Swiper
            slidesPerView={1}
            modules={[Navigation]}
            onSwiper={(swiper) => (tabletSwiperRef.current = swiper)}
            navigation={false}
          >
            {questionSlides.map((slideQuestions, index) => (
              <SwiperSlide key={index}>
                {slideQuestions.map((item, idx) => (
                  <div
                  key={idx}
                  className="d-flex flex-column p-3 mt-2 w-100"
                  style={{ borderRadius: "8px" }}
                >
                  <div className="text-start w-100 mb-2">
                    <p className="text-black fs-6 text-wrap m-0 fw-bold">
                      {item.question} ({item.category})
                    </p>
                  </div>
                  <div className="d-flex flex-row justify-content-between align-items-center w-100 flex-wrap">
                    <div className="d-flex flex-row gap-2">
                      {["2025 to 2026", "2026 to 2027", "2027 to 2028", "2028 to 2029", "2029 to 2030"].map(
                        (year, idx) => (
                          <div key={idx} className="d-flex flex-column align-items-center">
                            <p
                              className="fw-bold text-center"
                              style={{
                                color: "#1D478A",
                                fontSize: "12px",
                                marginBottom: "2px",
                              }}
                            >
                              {year}
                            </p>
                            <select
                              className="form-select fw-bold text-center"
                              style={{
                                width: "110px",
                                fontSize: "12px",
                                backgroundColor: "#B3E6DA",
                              }}
                            >
                              <option>Select</option>
                              <option>No Impact</option>
                              <option>Very Low</option>
                              <option>Low</option>
                              <option>Medium Low</option>
                              <option>Medium</option>
                              <option>Medium High</option>
                              <option>High</option>
                              <option>Very High</option>
                            </select>
                          </div>
                        )
                      )}
                    </div>
                    <div
                      className="d-flex align-items-center px-2 py-1 rounded"
                      style={{
                        border: "none",
                        height: "40px",
                        cursor: "pointer",
                        alignSelf: "center",
                      }}
                    >
                      <span className="text-dark fw-semibold">Skip</span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="black"
                        className="mt-1"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M6 4l8 8-8 8V4z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                
                ))}
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="d-inline" style={{ fontSize: "16px" }}>
            <span className="text-danger">Note:</span>
            <span className="ms-1 mt-2">
              These questions assess key factors shaping the CV industry, with
              positive ones highlighting growth drivers and negative ones
              identifying challenges. Higher impact responses indicate strong
              market shifts, while lower ones suggest stability. This approach
              enables better forecasting and strategic planning.
            </span>
          </div>

          <div className="d-flex flex-column align-items-center justify-content-center mt-3 w-100">
            {" "}
            <div className="d-flex align-items-center w-75 position-relative">
              <button
                className="border-0 bg-transparent d-flex align-items-center"
                style={{ fontSize: "30px", lineHeight: "1" }}
                onClick={() =>
                  tabletSwiperRef.current && tabletSwiperRef.current.slidePrev()
                }
              >
                ❮
              </button>

              <div
                className="position-relative flex-grow-1 mx-3"
                style={{ height: "7px", width: "100%" }}
              >
                <div
                  style={{
                    height: "7px",
                    width: "100%",
                    background: "#c6b5b5",
                    borderRadius: "10px",
                    position: "absolute",
                  }}
                ></div>
                <div
                  key={value}
                  style={{
                    height: "7px",
                    width: `${(value / totalPages) * 100}%`,
                    background: "#4683A6",
                    borderRadius: "10px",
                    position: "absolute",
                    transition: "width 0.3s ease",
                  }}
                ></div>
                <input
                  type="range"
                  min="1"
                  max={totalPages}
                  value={value}
                  onChange={handleSliderChange}
                  className="form-range position-absolute"
                  style={{
                    width: "100%",
                    height: "10px",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                />
              </div>
              <button
                className="border-0 bg-transparent d-flex align-items-center"
                style={{ fontSize: "30px", lineHeight: "1" }}
                onClick={() =>
                  tabletSwiperRef.current && tabletSwiperRef.current.slideNext()
                }
              >
                ❯
              </button>
            </div>
            <div className="mt-2 fw-bold fs-5" style={{ color: "#12298C" }}>
              {value}/{totalPages}
            </div>
          </div>
          <div className="row mt-5">
            <div className="col-md-4" style={{ fontSize: "16px" }}>
              <ul>
                <li>
                  VERY HIGH – Strong influence, directly shaping industry
                  trends.
                </li>
                <li>HIGH – Significant influence on market movement.</li>
                <li>MEDIUM HIGH – Noticeable but not dominant impact.</li>
              </ul>
            </div>
            <div className="col-md-4" style={{ fontSize: "16px" }}>
              <ul>
                <li>
                  MEDIUM – Moderate influence, dependent on external factors.
                </li>
                <li>MEDIUM LOW – Noticeable but not dominant impact.</li>
                <li>LOW – Minimal impact on overall industry.</li>
              </ul>
            </div>
            <div className="col-md-4" style={{ fontSize: "16px" }}>
              <ul>
                <li>VERY LOW – Negligible or nearly no effect.</li>
                <li>NO IMPACT – No expected influence on industry trends.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}