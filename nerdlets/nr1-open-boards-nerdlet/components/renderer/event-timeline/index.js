import React from 'react';
import { AutoSizer } from 'nr1';
import EventTimelineWidgetDropDown from './drop-down';
import { Timeline } from 'react-event-timeline';
import Event from './event';

const createEvents = (
  selectedEventSources,
  nrqlEventData,
  entitySearchEventData,
  limit
) => {
  const selectedNrqlData = [];
  const selectedEntityEventData = [];
  let events = [];

  // get the selected event sources
  selectedEventSources.forEach(s => {
    if (s in nrqlEventData) {
      selectedNrqlData.push(nrqlEventData[s]);
    } else if (s in entitySearchEventData) {
      selectedEntityEventData.push(entitySearchEventData[s]);
    }
  });

  selectedNrqlData.forEach(nrqlData => {
    nrqlData.forEach(d => {
      d.data.forEach(item => {
        events.push({
          data: item,
          color: d.color,
          accountId: d.accountId,
          name: d.name,
          nrqlQuery: d.nrqlQuery,
          timestamp: item.timestamp,
          type: 'nrqlEvent'
        });
      });
    });
  });

  selectedEntityEventData.forEach(entityData => {
    entityData.forEach(d => {
      d.forEach(entity => {
        if (entity.alertViolations && entity.alertViolations.length > 0) {
          entity.alertViolations.forEach(a => {
            events.push({
              type: 'alert',
              timestamp: a.openedAt,
              ...entity,
              ...a
            });
          });
        }

        if (entity.deployments && entity.deployments.length > 0) {
          //
          entity.deployments.forEach(deploy => {
            events.push({
              type: 'deployment',
              ...entity,
              ...deploy
            });
          });
        }
      });
    });
  });

  events = events.sort((a, b) => b.timestamp - a.timestamp);
  if (limit > 0) {
    events = events.slice(0, limit);
  }

  return events;
};

export default class EventTimeline extends React.Component {
  render() {
    const { widget, i, nrqlEventData, entitySearchEventData } = this.props;
    const hdrStyle = widget.headerStyle || {};
    const selectedEventSources = widget.value || [];
    const events = createEvents(
      selectedEventSources,
      nrqlEventData,
      entitySearchEventData,
      widget.limit
    );

    return (
      <div style={{ width: '100%', height: '100%' }}>
        <AutoSizer>
          {({ width, height }) => {
            const headerHeight = hdrStyle.height
              ? hdrStyle.height.replace(/\D/g, '')
              : 30;

            const maxWidgetHeight = height - headerHeight - 10;
            const paddingTop = '5px';
            const paddingLeft = '9px';
            const paddingRight = '5px';
            const paddingBottom = '5px';

            hdrStyle.fontSize = hdrStyle.fontSize || '14px';
            hdrStyle.fontWeight = hdrStyle.fontWeight || 'bold';
            // hdrStyle.fontFamily = hdrStyle.fontFamily || 'Fira Code';
            hdrStyle.paddingLeft = hdrStyle.paddingLeft || '9px';
            hdrStyle.paddingLeft = hdrStyle.paddingRight || '5px';
            hdrStyle.float = hdrStyle.float || 'left';
            hdrStyle.verticalAlign = hdrStyle.verticalAlign || 'middle';

            return (
              <div style={{ paddingTop }}>
                <div style={{ height: `${headerHeight}px` }}>
                  <div
                    style={{
                      ...hdrStyle
                    }}
                  >
                    {widget.name || 'some widget'}
                  </div>

                  <div
                    style={{
                      float: 'right',
                      maxHeight: `${headerHeight}px`
                    }}
                  >
                    <EventTimelineWidgetDropDown
                      i={i}
                      height={`${headerHeight}px`}
                    />{' '}
                  </div>
                </div>

                <div
                  style={{
                    paddingLeft,
                    paddingRight,
                    paddingBottom,
                    height: maxWidgetHeight,
                    width: width - 5,
                    overflow: 'auto'
                  }}
                >
                  <Timeline
                    style={{ fontSize: '13px', fontFamily: 'monospace' }}
                  >
                    {events.map((e, i) => {
                      return <Event key={i} event={e} />;
                    })}
                  </Timeline>
                </div>
              </div>
            );
          }}
        </AutoSizer>
      </div>
    );
  }
}
