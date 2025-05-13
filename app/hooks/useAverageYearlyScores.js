// File: app/hooks/useAverageYearlyScores.js
import { useMemo } from 'react';

export function useAverageYearlyScores(submissions) {
  return useMemo(() => {
    if (submissions.length === 0) {
      return { yearNames: [], averages: [] };
    }
    const yearNames = submissions[0].yearNames;
    const averages = yearNames.map((year, i) => {
      const total = submissions.reduce((sum, sub) => {
        let pos = 0, neg = 0;
        sub.posAttributes.forEach(a => {
          pos += (sub.posScores[a.key][i] || 0) * (sub.weights[a.key] || 0);
        });
        sub.negAttributes.forEach(a => {
          neg += (sub.negScores[a.key][i] || 0) * (sub.weights[a.key] || 0);
        });
        return sum + (pos - neg);
      }, 0);
      // round to 2 decimals:
      const raw = total / submissions.length;
      const rounded = parseFloat(raw.toFixed(2));
      return { year, avg: rounded };
    });
    return { yearNames, averages };
  }, [submissions]);
}
