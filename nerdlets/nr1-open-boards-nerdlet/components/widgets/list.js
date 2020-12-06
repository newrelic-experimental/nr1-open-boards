export const nrqlSystems = [{ key: 'newrelic', name: 'New Relic' }];

// const builtinFunctions =
//   'apdex|average|buckets|count|eventType|filter|funnel|histogram|keyset|derivative|' +
//   'latest|max|median|min|percentage|percentile|rate|stddev|sum|uniqueCount|uniques';

// const functions = builtinFunctions.split('|');

export const nrqlCharts = [
  { type: 'newrelic', name: 'billboard', nrqlDisallow: ['TIMESERIES'] },
  { type: 'newrelic', name: 'line', nrqlRequire: ['TIMESERIES'] },
  { type: 'newrelic', name: 'area', nrqlRequire: ['TIMESERIES'] },
  {
    type: 'newrelic',
    name: 'bar',
    nrqlDisallow: ['TIMESERIES'],
    nrqlRequire: ['FACET']
  },
  {
    type: 'newrelic',
    name: 'table',
    nrqlDisallow: ['TIMESERIES']
  },
  {
    type: 'newrelic',
    name: 'pie',
    nrqlDisallow: ['TIMESERIES'],
    nrqlRequire: ['FACET']
  },
  {
    type: 'semantic',
    name: 'table',
    nrqlDisallow: ['TIMESERIES'],
    props: [
      { name: 'singleLine', options: ['true', 'false'] },
      { name: 'compact', options: ['true', 'false'] },
      { name: 'fixed', options: ['true', 'false'] },
      { name: 'striped', options: ['true', 'false'] }
    ]
  },
  {
    type: 'open',
    name: 'html',
    nrqlDisallow: ['TIMESERIES', 'FACET']
  },
  {
    type: 'open',
    name: 'react-heatmap-grid',
    nrqlDisallow: ['TIMESERIES'],
    messages: [
      'Two FACETs are required, the first being the Y axis and the second the X axis.',
      'ORDER BY is recommended for sorting time based information.'
    ],
    examples: [
      `FROM Transaction SELECT count(*) FACET appName, hourOf(timestamp) ORDER BY timestamp LIMIT MAX`
    ]
  },
  {
    type: 'open',
    name: 'svg-radar-chart',
    nrqlDisallow: ['TIMESERIES'],
    messages: [
      `At least 3 queries should be used for best visual.`,
      `Values, SLOs, SLAs should be normalized between a range of 0.0 to 1.0.`,
      `Set your SLO & SLA by adding the following into your NRQL query: ", 0.5 as 'SLO', 0.8 as 'SLA'".`
    ],
    examples: [
      `FROM SystemSample SELECT average(cpuPercent) / 100, 0.5 as 'SLO', 0.8 as 'SLA'`,
      `FROM SystemSample SELECT average(memoryUsedPercent) /100, 0.5 as 'SLO', 0.8 as 'SLA'`,
      `FROM StorageSample SELECT latest(diskUsedPercent) / 100 as 'disk', 0.5 as 'SLO', 0.8 as 'SLA'`
    ]
  }
];
