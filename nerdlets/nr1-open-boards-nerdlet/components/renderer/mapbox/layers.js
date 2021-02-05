export const clusterLayer = {
  id: 'clusters',
  type: 'circle',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      "step",
      ["get", "maxAlertLevel"],
      "#9adced",
      0, "#9adced",
      1, "#70e65c",
      2, "#fa9a2d",
      3, "#d94545"
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      20,
      100,
      30,
      700,
      40,
      1000,
      50
    ]
  }
};

export const clusterCountLayer = {
  id: 'cluster-count',
  type: 'symbol',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12
  }
};

export const unclusteredPointLayer = {
  id: 'unclustered-point',
  type: 'circle',
  filter: ['!', ['has', 'point_count']],
  paint: {
      'circle-color': [
          "step",
          ["get", "alertLevel"],
          "#000",
          0, "#000",
          1, "#70e65c",
          2, "#fa9a2d",
          3, "#d94545"
      ],
    'circle-radius': {
        'base': 8,
        'stops': [
            [12,8],
            [14, 16],
            [16, 32],
            [18, 64],
            [20, 128]
        ]
    },
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff'
  }
};
