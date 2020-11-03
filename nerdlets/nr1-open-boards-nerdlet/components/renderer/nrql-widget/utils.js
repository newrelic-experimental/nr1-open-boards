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
