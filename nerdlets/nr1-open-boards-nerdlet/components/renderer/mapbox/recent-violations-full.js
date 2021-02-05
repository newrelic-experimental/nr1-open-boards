import React from 'react';
import { Icon, navigation, NerdGraphQuery } from 'nr1';
import { Timeline } from '@newrelic/nr1-community';
import { chunk } from '../../../lib/helper';
import { recentAlertsQuery } from './utils';

export default class RecentViolations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entities: [],
      recentAlertViolations: []
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

  getRecentAlertViolations = async () => {
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

    this.setState({ recentAlertViolations });
  };

  iconType(alertSeverity) {
    switch (alertSeverity) {
      case 'CRITICAL':
        return Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__APPLICATION__S_ERROR;
      case 'WARNING':
        return Icon.TYPE
          .HARDWARE_AND_SOFTWARE__SOFTWARE__APPLICATION__S_WARNING;
      case 'NOT_ALERTING':
        return Icon.TYPE
          .HARDWARE_AND_SOFTWARE__SOFTWARE__APPLICATION__A_CHECKED;
      case 'NOT_CONFIGURED':
        return Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__APPLICATION__S_OK;
    }
  }

  iconColor(alertSeverity) {
    switch (alertSeverity) {
      case 'CRITICAL':
        return '#BF0016';
      case 'WARNING':
        return '#9C5400';
      case 'NOT_ALERTING':
        return '#3CA653';
      case 'NOT_CONFIGURED':
        return '#464e4e';
    }
  }

  render() {
    const { recentAlertViolations } = this.state;

    if (recentAlertViolations.length > 0) {
      return (
        <Timeline
          data={recentAlertViolations}
          timestampField="openedAt"
          dateFormat="MM/dd/yyyy"
          timestampFormat="h:mm:ss a"
          labelField="label"
          iconType={data => {
            return {
              icon: this.iconType(data.event.alertSeverity),
              color: this.iconColor(data.event.alertSeverity)
            };
          }}
          eventContent={({ event }) => {
            let timeline = Object.keys(event);
            timeline = timeline.sort();
            return (
              <ul className="timeline-item-contents">
                {timeline.map((attr, i) => {
                  if (event[attr]) {
                    return (
                      <li key={i} className="timeline-item-contents-item">
                        <span className="key">{attr}: </span>
                        <span className="value">{event[attr]}</span>
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            );
          }}
        />
      );
    } else {
      return 'No recent alert violations.';
    }
  }
}
