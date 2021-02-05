import React from 'react';
import { AutoSizer } from 'nr1';
import EventTimelineWidgetDropDown from './drop-down';
import { Timeline } from 'react-event-timeline';
import Event from './event';
import { Icon, Input } from 'semantic-ui-react';

const createEvents = (
  sort,
  selectedEventSources,
  nrqlEventData,
  entitySearchEventData,
  limit,
  begin_time
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
          entityName: item.entityName,
          entityGuid: item.entityGuid,
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

  events = events
    .filter(e => e.timestamp > begin_time)
    .sort((a, b) => b.entityName || b.name - a.entityName || a.name)
    .sort((a, b) =>
      sort === 'asc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
    );
  if (limit > 0) {
    events = events.slice(0, limit);
  }

  return events;
};

export default class EventTimeline extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sort: 'asc',
      searchText: ''
    };
  }

  render() {
    const {
      widget,
      i,
      nrqlEventData,
      entitySearchEventData,
      begin_time
    } = this.props;
    const { sort, searchText } = this.state;

    const hdrStyle = widget.headerStyle || {};
    const selectedEventSources = widget.value || [];
    const events = createEvents(
      sort,
      selectedEventSources,
      nrqlEventData,
      entitySearchEventData,
      widget.limit,
      begin_time
    );

    const searchedEvents = events.filter(e => {
      if (searchText) {
        const searchTxt = searchText.toLowerCase();
        if (e.entityName) {
          if (e.entityName.toLowerCase().includes(searchTxt)) {
            return true;
          }
        }
        if (e.type === 'alert') {
          if (
            e.label.toLowerCase().includes(searchTxt) ||
            e.name.toLowerCase().includes(searchTxt)
          ) {
            return true;
          }
        }

        if (e.data) {
          const keys = Object.keys(e.data);
          for (let z = 0; z < keys.length; z++) {
            if (
              typeof e.data[keys[z]] === 'string' ||
              e.data[keys[z]] instanceof String
            ) {
              if (e.data[keys[z]].toLowerCase().includes(searchTxt)) {
                return true;
              }
            }
          }
        }

        return false;
      }
      return true;
    });

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
                    />
                  </div>
                </div>

                <div
                  style={{
                    paddingLeft,
                    paddingBottom,
                    height: maxWidgetHeight,
                    width
                  }}
                >
                  {events.length === 0 ? (
                    <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                      No events for this period...
                    </span>
                  ) : (
                    <>
                      <div style={{ paddingRight }}>
                        <Input
                          placeholder="Search Events"
                          onChange={e =>
                            this.setState({ searchText: e.target.value })
                          }
                        />
                        <Icon
                          style={{
                            cursor: 'pointer',
                            float: 'right',
                            marginTop: '5px'
                          }}
                          size="large"
                          name={
                            sort === 'asc'
                              ? 'sort content ascending'
                              : 'sort content descending'
                          }
                          onClick={() =>
                            this.setState({
                              sort: sort === 'asc' ? 'desc' : 'asc'
                            })
                          }
                        />
                      </div>
                      <Timeline
                        style={{
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          overflow: 'auto',
                          height: maxWidgetHeight - 35
                        }}
                      >
                        {searchedEvents.map((e, i) => {
                          return <Event key={i} event={e} />;
                        })}
                      </Timeline>
                    </>
                  )}
                </div>
              </div>
            );
          }}
        </AutoSizer>
      </div>
    );
  }
}
