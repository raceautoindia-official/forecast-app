// File: app/hooks/useForecastGrowth.js
'use client';

import { useMemo } from 'react';

/**
 * Hook to compute forecast growth percentages and volumes based on past volumes and yearly scores.
 *
 * Forecast logic:
 * - Calculate past CAGR from historical volumes: (final/initial)^(1/numYears) - 1
 * - For each year i:
 *    change = (pastGrowth >= 0)
 *      ? pastGrowth * (scores[i] / 10)
 *      : Math.abs(pastGrowth) * (scores[i] / 10)
 *    forecast = pastGrowth + change
 *    forecastVolume = prevVolume * (1 + forecast)
 *    update pastGrowth = forecast, prevVolume = forecastVolume
 *
 * @param {number[]} volumes - Historical volume data array, length N > 0
 * @param {number[]} scores  - Yearly score values array (0-10 scale), length M
 * @returns {{ forecast: number, change: number, forecastVolume: number }[]} Array length M of forecast data
 */
export function useForecastGrowth(volumes, scores) {
  return useMemo(() => {
    const nVol = volumes.length;
    const nScore = scores.length;
    if (nVol < 1 || nScore < 1) {
      return [];
    }

    // Compute CAGR from historical volumes
    const initialVol = volumes[0];
    const finalVol = volumes[nVol - 1];
    let cagr = null;
    if (initialVol > 0) {
      cagr = Math.pow(finalVol / initialVol, 1 / nVol) - 1;
    }
    if (cagr === null) {
      return Array(nScore).fill(null);
    }

    const forecastData = [];
    let pastGrowth = cagr;
    let prevVolume = finalVol;
    for (let i = 0; i < nScore; i++) {
      const scorePct = scores[i] / 10;
      const change = pastGrowth < 0
        ? Math.abs(pastGrowth) * scorePct
        : pastGrowth * scorePct;
      const forecast = pastGrowth + change;
      const forecastVolume = prevVolume * (1 + forecast);
      forecastData.push({ forecast, change, forecastVolume });
      pastGrowth = forecast;
      prevVolume = forecastVolume;
    }

    return forecastData;
  }, [volumes, scores]);
}
