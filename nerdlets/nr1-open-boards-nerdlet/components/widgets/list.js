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
  }
];
