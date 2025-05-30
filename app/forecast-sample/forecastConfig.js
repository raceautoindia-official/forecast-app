// File: app/forecast/forecastConfig.js

// ─── 1) Regions & Groups ─────────────────────────────────────────
export const allRegions = [
  'PERU','ASEAN','CHILE','CHINA','EGYPT','INDIA','ITALY','JAPAN','SPAIN',
  'BRAZIL','CANADA','FRANCE','GREECE','ISRAEL','KUWAIT','MEXICO','NORWAY',
  'POLAND','RUSSIA','SWEDEN','TAIWAN','TURKEY','AUSTRIA','BELGIUM','CROATIA',
  'DENMARK','ECUADOR','FINLAND','GERMANY','HUNGARY','IRELAND','MOROCCO',
  'ROMANIA','UKRAINE','VIETNAM','BULGARIA','COLOMBIA','MALAYSIA','PAKISTAN',
  'PORTUGAL','SLOVAKIA','THAILAND','ARGENTINA','AUSTRALIA','INDONESIA',
  'KAZAKHSTAN','UZBEKIZTAN','NETHERLANDS','NEW ZEALAND','PHILIPPINES',
  'PUERTO RICO','SOUTH KOREA','SWITZERLAND','SAUDI ARABIA','SOUTH AFRICA',
  'CZECH REPUBLIC','UNITED KINGDOM','OTHER COUNTRIES ASIA',
  'UNITED ARAB EMIRATES','OTHER COUNTRIES AFRICA',
  'OTHER COUNTRIES EUROPE','OTHER COUNTRIES AMERICA',
  'UNITED STATES OF AMERICA'
];

export const regionGroups = {
  Americas: [
    'PERU','CHILE','BRAZIL','CANADA','MEXICO','UNITED STATES OF AMERICA',
    'ARGENTINA','COLOMBIA','PUERTO RICO','ECUADOR','OTHER COUNTRIES AMERICA'
  ],
  Europe: [
    'FRANCE','GREECE','ITALY','SPAIN','NORWAY','POLAND','RUSSIA','SWEDEN',
    'AUSTRIA','BELGIUM','BULGARIA','CROATIA','CZECH REPUBLIC','DENMARK',
    'FINLAND','GERMANY','HUNGARY','IRELAND','NETHERLANDS','PORTUGAL',
    'ROMANIA','SLOVAKIA','SWITZERLAND','UKRAINE','UNITED KINGDOM',
    'OTHER COUNTRIES EUROPE'
  ],
  Asia: [
    'ASEAN','CHINA','INDIA','JAPAN','TAIWAN','TURKEY','ISRAEL','KUWAIT',
    'MALAYSIA','PAKISTAN','THAILAND','VIETNAM','PHILIPPINES','INDONESIA',
    'KAZAKHSTAN','UZBEKIZTAN','SAUDI ARABIA','UNITED ARAB EMIRATES',
    'SOUTH KOREA','OTHER COUNTRIES ASIA'
  ],
  Africa: [
    'EGYPT','MOROCCO','SOUTH AFRICA','OTHER COUNTRIES AFRICA'
  ],
  Oceania: [
    'AUSTRALIA','NEW ZEALAND'
  ]
};

// ─── 2) Dataset Definitions ────────────────────────────────────────
export const datasets = [
  {
    id: 'd1',
    label: 'Trucks',
    regions: allRegions,
    graphIds: ['g1']
  },
  {
    id: 'd2',
    label: 'Buses & Coaches',
    regions: allRegions,
    graphIds: ['g2']
  },
  {
    id: 'd3',
    label: 'Passenger Car',
    regions: allRegions,
    graphIds: ['g3']
  },
  {
    id: 'd4',
    label: 'Tractor Trailers',
    regions: allRegions,
    graphIds: ['g1']
  },
  {
    id: 'd5',
    label: 'Agri Tractors',
    regions: allRegions,
    graphIds: ['g1']
  },
  {
    id: 'd6',
    label: 'Mining Equipments',
    regions: allRegions,
    graphIds: ['g1']
  },
  {
    id: 'd7',
    label: 'Engines',
    regions: allRegions,
    graphIds: ['g1']
  },
  {
    id: 'd8',
    label: 'Motorcycles',
    regions: allRegions,
    graphIds: ['g1']
  },
  {
    id: 'd9',
    label: 'Trio - Motorised Three Wheelers',
    regions: allRegions,
    graphIds: ['g1']
  },
  {
    id: 'd10',
    label: 'Components and Accessories',
    regions: allRegions,
    graphIds: ['g1']
  },
  
];

// Quick lookup
export const datasetMap = Object.fromEntries(
  datasets.map(ds => [
    ds.id,
    { label: ds.label, regions: ds.regions, graphIds: ds.graphIds }
  ])
);

// ─── 3) Chart Definitions ─────────────────────────────────────────
export const graphs = [
  {
    id: 'g1',
    name: 'Overall Truck sales Trend Analysis',
    forecast_types: ['linear','score','ai','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g2',
    name: `Overall Production Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g3',
    name: `Overall Exports Sales Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g4',
    name: 'Segment LCV Sales Trend Analysis',
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g5',
    name: 'Segment MCV Sales Trend Analysis',
    forecast_types: ['linear','score','ai','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g6',
    name: 'Segment HCV Sales Trend Analysis',
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d1']
  },
   {
    id: 'g7',
    name: 'Segment LCV Production Trend Analysis',
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g8',
    name: 'Segment MCV Production Trend Analysis',
    forecast_types: ['linear','score','ai','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g9',
    name: 'Segment HCV Production Trend Analysis',
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g10',
    name: 'Segmental Split Trend Analysis',
    forecast_types: ['linear','score','ai','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g11',
    name: 'Application Split Trend Analysis',
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g12',
    name: 'Alternative Fuel Penetration Trend Analysis',
    forecast_types: ['score','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g13',
    name: `OEM's Market Share Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g14',
    name: `OEM Wise Revenue/Profit Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g15',
    name: `EV-Hybrid Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g16',
    name: `Transmission Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g17',
    name: `Vehicle Ageing Report Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d1']
  },
  {
    id: 'g18',
    name: 'Overall Bus sales Trend Analysis',
    forecast_types: ['linear','score','ai','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g19',
    name: `Overall Production Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g20',
    name: `Overall Exports Sales Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g21',
    name: 'Segment LD Sales Trend Analysis',
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g22',
    name: 'Segment MD Sales Trend Analysis',
    forecast_types: ['linear','score','ai','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g23',
    name: 'Segment HD Sales Trend Analysis',
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d2']
  },
   {
    id: 'g24',
    name: 'Segment LD Production Trend Analysis',
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g25',
    name: 'Segment MD Production Trend Analysis',
    forecast_types: ['linear','score','ai','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g26',
    name: 'Segment HD Production Trend Analysis',
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g27',
    name: 'Segmental Split Trend Analysis',
    forecast_types: ['linear','score','ai','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g28',
    name: 'Application Split Trend Analysis',
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g29',
    name: 'Alternative Fuel Penetration Trend Analysis',
    forecast_types: ['score','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g30',
    name: `OEM's Market Share Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g31',
    name: `OEM Wise Revenue/Profit Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g32',
    name: `EV-Hybrid Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g33',
    name: `Transmission Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g34',
    name: `Vehicle Ageing Report Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d2']
  },
  {
    id: 'g35',
    name: `Overall Passenger Vehicle sales Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d3']
  },
  {
    id: 'g36',
    name: `Overall Export Sales Trend analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d3']
  },
   {
    id: 'g37',
    name: `Overall Production Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d3']
  },
   {
    id: 'g38',
    name: `Segmental Split Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d3']
  },
   {
    id: 'g39',
    name: `Application Split Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d3']
  },
   {
    id: 'g40',
    name: `Transmission Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d3']
  },
   {
    id: 'g41',
    name: `Alternate Fuel Penetration Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d3']
  },
   {
    id: 'g42',
    name: `OEM's Market Share Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d3']
  },
   {
    id: 'g43',
    name: `EV/Hybrid Trend Analysis `,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d3']
  },
   {
    id: 'g44',
    name: `Competive Analysis - Vehicle Sales Pricing Trend Analysis`,
    forecast_types: ['linear','ai','raceInsights'],
    dataset_ids: ['d3']
  },
  
];

// ─── 4) Data for charts ────────────────────────────────────────────
export const bothDataMap = {
  g1: [
    { year: 2020, value: 180, forecastLinear: 180, forecastScore: 180, forecastAi: 185, forecastRaceInsights: 175 },
    { year: 2021, value: 215, forecastLinear: 220, forecastScore: 210, forecastAi: 225, forecastRaceInsights: 205 },
    { year: 2022, value: 250, forecastLinear: 260, forecastScore: 240, forecastAi: 270, forecastRaceInsights: 245 },
    { year: 2023, value: null, forecastLinear: 300, forecastScore: 280, forecastAi: 320, forecastRaceInsights: 290 },
    { year: 2024, value: null, forecastLinear: 350, forecastScore: 330, forecastAi: 380, forecastRaceInsights: 340 }
  ],
  g2: [
    { year: 2020, value: 100, forecastLinear: 100, forecastScore: null, forecastAi: 110, forecastRaceInsights: null },
    { year: 2021, value: 130, forecastLinear: 140, forecastScore: null, forecastAi: 150, forecastRaceInsights: null },
    { year: 2022, value: 165, forecastLinear: 180, forecastScore: null, forecastAi: 200, forecastRaceInsights: null },
    { year: 2023, value: null, forecastLinear: 200, forecastScore: null, forecastAi: 230, forecastRaceInsights: null },
    { year: 2024, value: null, forecastLinear: 230, forecastScore: null, forecastAi: 265, forecastRaceInsights: null }
  ],
  g3: [
    { year: 2020, value:   5, forecastLinear: null, forecastScore:   5, forecastAi: null, forecastRaceInsights: 4.8 },
    { year: 2021, value: 4.5, forecastLinear: null, forecastScore: 4.2, forecastAi: null, forecastRaceInsights: 4.0 },
    { year: 2022, value: 4.1, forecastLinear: null, forecastScore: 3.8, forecastAi: null, forecastRaceInsights: 3.6 },
    { year: 2023, value: null, forecastLinear: null, forecastScore: 3.5, forecastAi: null, forecastRaceInsights: 3.3 },
    { year: 2024, value: null, forecastLinear: null, forecastScore: 3.2, forecastAi: null, forecastRaceInsights: 3.0 }
  ]
};
