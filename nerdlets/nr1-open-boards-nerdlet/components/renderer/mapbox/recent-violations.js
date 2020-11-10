import React from 'react';
import { NerdGraphQuery } from 'nr1';
import { chunk } from '../../../lib/helper';
import { recentAlertsQuery } from './utils';
import { List } from 'semantic-ui-react';

export default class RecentViolations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entities: [],
      recentAlertViolations: [],
      isFetching: false
    };
  }

  componentDidMount() {
    const { popupData } = this.props;
    const { properties } = popupData;

    const entities = properties.entities || [];

    this.setState({ entities }, () => this.getRecentAlertViolations());
  }

  componentDidUpdate() {
    const { popupData } = this.props;
    this.updateEntities(popupData);
  }

  updateEntities = popupData => {
    const { properties } = popupData;

    const entities = properties.entities || [];

    if (JSON.stringify(entities) !== JSON.stringify(this.state.entities)) {
      this.setState({ entities }, () => this.getRecentAlertViolations());
    }
  };

  getRecentAlertViolations = () => {
    this.setState({ isFetching: true }, async () => {
      const { entities } = this.state;

      const nestedEntites = [];
      entities.forEach(e => {
        if (e.relationships) {
          e.relationships.forEach(r => {
            if (r.target && r.target.entity) {
              nestedEntites.push(r.target.entity);
            }
          });
        }
      });

      const completeEntities = [...entities, ...nestedEntites];
      const guids = completeEntities.map(e => e.guid);
      const entityChunks = chunk([...new Set(guids)], 25);

      const entityPromises = entityChunks.map(chunk => {
        return new Promise(async resolve => {
          const guidsStr = `"${chunk.join(`","`)}"`;
          const nerdGraphResult = await NerdGraphQuery.query({
            query: recentAlertsQuery(guidsStr)
          });
          resolve(nerdGraphResult);
        });
      });

      let recentAlertViolations = [];

      await Promise.all(entityPromises).then(values => {
        values.forEach(v => {
          const entities = (((v || {}).data || {}).actor || {}).entities || [];
          entities.forEach(e => {
            recentAlertViolations = [
              ...recentAlertViolations,
              ...(e.recentAlertViolations || [])
            ];
          });
        });
      });

      this.setState({ recentAlertViolations, isFetching: false });
    });
  };

  render() {
    const { recentAlertViolations, isFetching } = this.state;

    if (recentAlertViolations.length > 0) {
      return (
        <List divided relaxed>
          {recentAlertViolations.map((a, i) => {
            const d = new Date(a.openedAt);

            let alertColor = 'grey';

            switch (a.alertSeverity) {
              case 'NOT_ALERTING': {
                alertColor = 'green';
                break;
              }
              case 'WARNING': {
                alertColor = 'orange';
                break;
              }
              case 'CRITICAL': {
                alertColor = 'red';
                break;
              }
            }

            return (
              <List.Item key={i}>
                <List.Icon
                  name="circle"
                  size="large"
                  verticalAlign="middle"
                  color={alertColor}
                />
                <List.Content>
                  <List.Header
                    as="a"
                    onClick={() => window.open(a.violationUrl, '_blank')}
                  >
                    {a.label}
                  </List.Header>
                  <List.Description>{d.toLocaleString()}</List.Description>
                </List.Content>
              </List.Item>
            );
          })}
        </List>
      );
    } else {
      return isFetching
        ? 'Fetching recent alert violations...'
        : 'No recent alert violations.';
    }
  }
}
