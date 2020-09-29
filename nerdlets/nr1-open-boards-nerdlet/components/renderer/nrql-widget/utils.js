import gql from 'graphql-tag';

export const randomColor = () => {
  const colors = [
    '#11A893',
    '#4ACAB7',
    '#0E7365',
    '#00B3D7',
    '#3ED2F2',
    '#0189A4',
    '#FFC400',
    '#FFDD78',
    '#CE9E00',
    '#A45AC1',
    '#C07DDB',
    '#79428E',
    '#83CB4E',
    '#A2E572',
    '#63973A',
    '#FA6E37',
    '#FF9269',
    '#C6562C',
    '#C40685',
    '#E550B0',
    '#910662'
  ];

  return colors[Math.floor(Math.random() * colors.length)];
};

export const decorateWithEvents = (
  rawData,
  rawEventData,
  nerdgraphEventData
) => {
  let newEvents = rawData;

  if ((rawEventData || []).length > 0) {
    rawEventData.forEach(r => {
      const formattedEvents = {
        metadata: {
          id: 'events',
          name: r.name,
          color: r.color || '#000000',
          viz: 'event'
        },
        data: r.data.map(d => ({
          x0: d.timestamp,
          x1: d.timestamp + 1
        }))
      };

      newEvents = [...newEvents, formattedEvents];
    });
  }

  if ((nerdgraphEventData || []).length > 0) {
    nerdgraphEventData.forEach(r => {
      if ((r.alertViolations || []).length > 0) {
        const warningAlerts = r.alertViolations.filter(
          a => a.alertSeverity === 'WARNING'
        );
        const criticalAlerts = r.alertViolations.filter(
          a => a.alertSeverity === 'CRITICAL'
        );

        const warningEvents = {
          metadata: {
            id: 'axis-marker-warning',
            axisMarkersType: 'alert',
            name: `Warning ${r.name}`,
            color: r.color || 'orange',
            viz: 'event'
          },
          data: warningAlerts.map(d => ({
            x0: d.openedAt,
            x1: d.openedAt + 1
          }))
        };

        const criticalEvents = {
          metadata: {
            id: 'axis-marker-critical',
            axisMarkersType: 'alert',
            name: `Critical ${r.name}`,
            color: r.color || 'red',
            viz: 'event'
          },
          data: criticalAlerts.map(d => ({
            x0: d.openedAt,
            x1: d.openedAt + 1
          }))
        };

        newEvents = [...newEvents, warningEvents, criticalEvents];
      }

      if ((r.deployments || []).length > 0) {
        const deployEvents = {
          metadata: {
            id: 'axis-marker-deployment',
            axisMarkersType: 'alert',
            name: `Deploy: ${r.name}`,
            color: r.color || '#000000',
            viz: 'event'
          },
          data: r.deployments.map(d => ({
            x0: d.timestamp,
            x1: d.timestamp + 1
          }))
        };
        newEvents = [...newEvents, deployEvents];
      }
    });
  }

  return newEvents;
};

export const getGuidsQuery = (query, cursor) => gql`{
  actor {
    entitySearch(query: "${query}") {
      results${cursor ? `(cursor: "${cursor}")` : ''} {
        entities {
          guid
          name
        }
        nextCursor
      }
    }
  }
}`;

export const getAlertsDeploysQuery = (guids, endTime, startTime) => gql`{
  actor {
    entities(guids: [${guids}]) {
      name
      guid
      domain
      ... on AlertableEntity {
        alertSeverity
        alertViolations(endTime: ${endTime}, startTime: ${startTime}) {
          openedAt
          violationId
          violationUrl
          level
          label
          closedAt
          alertSeverity
          agentUrl
        }
      }
      ... on ApmApplicationEntity {
        deployments(timeWindow: {endTime: ${endTime}, startTime: ${startTime}}) {
          changelog
          description
          permalink
          revision
          timestamp
          user
        }
      }
      account {
        id
        name
      }
      entityType
    }
  }
}`;
