import gql from 'graphql-tag';

export const writeStyle = (styleName, cssText) => {
  let styleElement = document.getElementById(styleName);
  if (styleElement)
    document.getElementsByTagName('head')[0].removeChild(styleElement);
  styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.id = styleName;
  styleElement.innerHTML = cssText;
  document.getElementsByTagName('head')[0].appendChild(styleElement);
};

export const stripQueryTime = nrqlQuery => {
  nrqlQuery = nrqlQuery
    .replace(/(SINCE|since) \d+\s+\w+\s+ago+/, '')
    .replace(/(UNTIL|until) \d+\s+\w+\s+ago+/, '')
    .replace(/(SINCE|since) \d+/, '')
    .replace(/(UNTIL|until) \d+/, '');

  const restricted = [
    'today',
    'yesterday',
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'last week',
    'this quarter'
  ];

  restricted.forEach(r => {
    nrqlQuery = nrqlQuery.replace(r, '').replace(r.toUpperCase(), '');
  });

  return nrqlQuery;
};

export const deriveAccounts = doc => {
  const foundAccounts = (doc.widgets || [])
    .map(w => w.sources || [])
    .flat()
    .map(s => s.accounts || [])
    .flat();

  return [...new Set(foundAccounts)];
};

export const deriveEvents = (
  events,
  nrqlEventData,
  entitySearchEventData,
  begin_time
) => {
  let newEventData = [];
  const selectedNrqlEvents = [];
  const selectedEntitySearchEvents = [];

  events.forEach(e => {
    if (nrqlEventData && e in nrqlEventData) {
      selectedNrqlEvents.push(nrqlEventData[e]);
    }
    if (entitySearchEventData && e in entitySearchEventData) {
      selectedEntitySearchEvents.push(entitySearchEventData[e]);
    }
  });

  selectedNrqlEvents.forEach(nrql => {
    nrql.forEach(n => {
      const formattedEvents = {
        metadata: {
          id: `events_${n.name}`,
          name: n.name.replace(/Kubernetes/g, 'K8s'),
          color: n.color || '#000000',
          viz: 'event'
        },
        data: n.data.map(d => ({
          x0: d.timestamp,
          x1: d.timestamp + 1
        }))
      };

      newEventData = [...newEventData, formattedEvents];
    });
  });

  selectedEntitySearchEvents.forEach(e => {
    e.forEach(entity => {
      entity.forEach(r => {
        if ((r.alertViolations || []).length > 0) {
          const warningAlerts = r.alertViolations.filter(
            a => a.alertSeverity === 'WARNING' && a.openedAt >= begin_time
          );
          const criticalAlerts = r.alertViolations.filter(
            a => a.alertSeverity === 'CRITICAL' && a.openedAt >= begin_time
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

          newEventData = [...newEventData, warningEvents, criticalEvents];
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
          newEventData = [...newEventData, deployEvents];
        }
      });
    });
  });

  return newEventData;
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
