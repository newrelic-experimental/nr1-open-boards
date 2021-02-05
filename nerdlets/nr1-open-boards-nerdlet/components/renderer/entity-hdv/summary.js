import React from 'react';
import { Icon } from 'semantic-ui-react';

const severityColor = alertSeverity => {
  switch (alertSeverity) {
    case 'CRITICAL':
      return '#BF0016';
    case 'WARNING':
      return '#9C5400';
    case 'NOT_ALERTING':
      return '#3CA653';
    case 'NOT_CONFIGURED':
      return '#464e4e';
    default:
      return '#464e4e';
  }
};

export default class EntityHdvSummary extends React.Component {
  render() {
    const {
      summarizedHealthStatus,
      summaryLabel,
      width,
      height,
      toggleSummary,
      isFetching,
      summaryLabelFontSize
    } = this.props;
    const backgroundColor = severityColor(summarizedHealthStatus);
    const msg = isFetching ? (
      <Icon loading name="spinner" />
    ) : (
      'No entities found'
    );

    return (
      <div
        onClick={isFetching ? undefined : toggleSummary}
        style={{
          cursor: isFetching ? '' : 'pointer',
          width,
          height,
          backgroundColor
        }}
      >
        <div
          style={{
            cursor: 'pointer',
            margin: 0,
            position: 'absolute',
            top: '50%',
            fontWeight: 'bold',
            color: 'white',
            transform: 'translate(-50%, -50%)',
            left: '50%',
            fontSize: summaryLabelFontSize || 12
          }}
        >
          {isFetching ? msg : (summaryLabel || summarizedHealthStatus)}
        </div>
      </div>
    );
  }
}
