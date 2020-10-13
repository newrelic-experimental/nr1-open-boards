import React from 'react';
import { TimelineEvent } from 'react-event-timeline';
// import { Icon } from 'semantic-ui-react';
import { navigation } from 'nr1';

const renderMessage = event => {
  switch (event.type) {
    case 'nrqlEvent': {
      return nrqlEventMessage(event);
    }
    case 'alert': {
      return alertMessage(event);
    }
    case 'deployment': {
      return deployMessage(event);
    }
  }
};

const nrqlEventMessage = event => {
  switch (event.data.category) {
    // InfrastructureEvent is hopelessly overloaded, so we need to handle differently by category
    case 'kubernetes':
      return (
        <div>
          {event.data['event.involvedObject.name'] && event.data.entityGuid ? (
            <span
              onClick={() =>
                // TODO: This doesn't work for k8s guids - need to look up the cluster guid
                navigation.openStackedEntity(event.data.entityGuid)
              }
            >
              {event.data['event.involvedObject.name']}
            </span>
          ) : (
            ''
          )}
          {event.data['event.message'] ? (
            <>
              <br />
              {event.data['event.message']}
            </>
          ) : (
            ''
          )}
        </div>
      );
    default:
      return (
        <div>
          {event.data.entityName && event.data.entityGuid ? (
            <span
              onClick={() =>
                navigation.openStackedEntity(event.data.entityGuid)
              }
            >
              {event.data.entityName}
            </span>
          ) : (
            ''
          )}
          {event.data.message ? (
            <>
              <br />
              {event.data.message}
            </>
          ) : (
            ''
          )}
        </div>
      );
  }
};

const alertMessage = event => {
  return (
    <div
      style={{ cursor: event.violationUrl ? 'pointer' : '' }}
      onClick={
        event.violationUrl
          ? () => window.open(event.violationUrl, '_blank')
          : () => navigation.openStackedEntity(event.guid)
      }
    >
      {event.label}
    </div>
  );
};

const deployMessage = event => {
  return `${event.name}: ${event.revision}`;
};

export default class Event extends React.Component {
  render() {
    const { event } = this.props;
    const createTime = new Date(event.timestamp);
    const createdAt = createTime.toLocaleString();
    let color = event.color;
    if (event.type === 'alert') {
      if (event.alertSeverity === 'WARNING') {
        color = 'orange';
      } else if (event.alertSeverity === 'CRITICAL') {
        color = 'red';
      }
    }

    return (
      <TimelineEvent title={event.name} createdAt={createdAt} iconColor={color}>
        {renderMessage(event)}
      </TimelineEvent>
    );
  }
}
