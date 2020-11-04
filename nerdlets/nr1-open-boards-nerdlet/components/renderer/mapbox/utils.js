export const docToGeoJson = rawGeomap => {
  const items = rawGeomap.items || [];

  const geojson = {
    type: 'FeatureCollection',
    timestamp: new Date().getTime(),
    features: items.map((item, i) => {
      return {
        type: 'Feature',
        index: i,
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

export const entitySummaryQuery = guids => `
{
  actor {
    entities(guids: [${guids}]) {
      guid
      name
      type
      domain
      entityType
      ... on AlertableEntity {
        alertSeverity
        recentAlertViolations {
          alertSeverity
          agentUrl
          closedAt
          label
          level
          openedAt
          violationId
          violationUrl
        }
      }
      ... on WorkloadEntity {
        workloadStatus {
          statusSource
          statusValue
          summary
          description
        }
        relationships {
          target {
            entity {
              guid
              name
              ... on AlertableEntityOutline {
                alertSeverity
              }
              entityType
              domain
              type
            }
          }
        }
      }
    }
  }
}`;
