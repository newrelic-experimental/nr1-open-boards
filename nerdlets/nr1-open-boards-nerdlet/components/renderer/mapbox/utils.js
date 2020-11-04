export const docToGeoJson = rawGeomap => {
  const items = rawGeomap.items || [];

  const geojson = {
    type: 'FeatureCollection',
    features: items.map((item, i) => {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            parseFloat(item.location.lng),
            parseFloat(item.location.lat)
          ]
        },
        properties: {
          index: i,
          name: item.title,
          ...item
        }
      };
    })
  };

  return geojson;
};
