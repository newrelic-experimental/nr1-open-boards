import React from 'react';
import GridLayout from 'react-grid-layout';
import { writeUserDocument, writeAccountDocument } from '../../lib/utils';
import { DataConsumer } from '../../context/data';
import NrqlWidget from '../renderer/nrql-widget';
import BasicHTML from '../renderer/html-widget';
import {
  writeStyle,
  stripQueryTime,
  deriveEvents,
  deriveAccounts,
  getGuidsQuery,
  getAlertsDeploysQuery,
  buildTagFilterQuery
} from './utils';
import EntityHdv from '../renderer/entity-hdv';
import { NrqlQuery, NerdGraphQuery } from 'nr1';
import { chunk } from '../../lib/helper';
import queue from 'async/queue';
import EventTimeline from '../renderer/event-timeline';

export default class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      eventStreamsStr: '',
      init: true,
      nrqlEventData: {},
      entitySearchEventData: {},
      timeRangeStr: '',
      accounts: []
    };
  }

  componentDidMount() {
    const {
      selectedBoard,
      timeRange,
      sinceClause,
      filterClause,
      filters,
      begin_time,
      end_time
    } = this.props;
    this.handleEventStreams(
      selectedBoard,
      timeRange,
      sinceClause,
      filterClause,
      filters,
      begin_time,
      end_time
    );
  }

  componentDidUpdate() {
    const {
      selectedBoard,
      timeRange,
      sinceClause,
      filterClause,
      filters,
      begin_time,
      end_time
    } = this.props;
    this.handleEventStreams(
      selectedBoard,
      timeRange,
      sinceClause,
      filterClause,
      filters,
      begin_time,
      end_time
    );
  }

  componentWillUnmount() {
    Object.keys(this).forEach(key => {
      if (key.startsWith('eventStream_')) {
        clearInterval(this[key]);
      }
    });
  }

  handleEventStreams = (
    selectedBoard,
    timeRange,
    sinceClause,
    filterClause,
    filters,
    begin_time,
    end_time
  ) => {
    const { document } = selectedBoard;
    const eventStreams = document.eventStreams || [];
    const dbFilters = document.filters || [];
    const eventStreamsStr = JSON.stringify(eventStreams);
    const prevEventStreamsStr = this.state.eventStreamsStr;
    const timeRangeStr = JSON.stringify(timeRange);
    const prevTimeRangeStr = this.state.timeRangeStr;
    const accounts = deriveAccounts(document);

    if (
      eventStreamsStr !== prevEventStreamsStr ||
      prevTimeRangeStr !== timeRangeStr ||
      filterClause !== this.state.filterClause ||
      sinceClause !== this.state.sinceClause
    ) {
      this.setState(
        {
          eventStreamsStr,
          timeRangeStr,
          sinceClause,
          filterClause,
          filters,
          dbFilters,
          begin_time,
          end_time,
          init: false,
          accounts
        },
        () => {
          Object.keys(this).forEach(key => {
            if (key.startsWith('eventStream_')) {
              clearInterval(this[key]);
            }
          });

          eventStreams.forEach((e, i) => {
            this.fetchData(i, e);
            this[`eventStream_${i}`] = setInterval(() => {
              this.fetchData(i, e);
            }, e.ms || 30000);
          });
        }
      );
    }
  };

  fetchData = async (i, eventStream) => {
    const {
      init,
      sinceClause,
      filterClause,
      begin_time,
      end_time
    } = this.state;
    const useSince = init === false ? sinceClause : '';

    const nrqlQueryPromises = [];
    const entitySearchPromises = [];
    if (eventStream.type === 'nrql') {
      eventStream.accounts.forEach(accountId => {
        const ignoreFilters =
          eventStream.ignoreFilters === 'true' ? true : false;

        const nrqlQuery = useSince
          ? stripQueryTime(eventStream.query)
          : eventStream.query;

        nrqlQueryPromises.push(
          this.nrqlQuery(
            `${nrqlQuery} ${ignoreFilters ? '' : filterClause} ${useSince}`,
            accountId,
            eventStream.color
          )
        );
      });
    } else if (eventStream.type === 'entitySearch') {
      entitySearchPromises.push(
        this.entitySearchQuery(eventStream, begin_time, end_time)
      );
    }

    const queryData = await Promise.all(nrqlQueryPromises);
    const rawData = [];
    queryData.forEach(result => {
      if (!result.error) {
        const { accountId, color } = result;
        const chartData = ((result || {}).data || {}).chart || [];
        chartData.forEach(c => {
          const finalResult = {
            ...c,
            accountId,
            color,
            name: eventStream.name,
            nrqlQuery: eventStream.query || ''
          };
          rawData.push(finalResult);
        });
      }
    });

    const entitySearchResults = await Promise.all(entitySearchPromises);

    const { nrqlEventData, entitySearchEventData } = this.state;
    if (eventStream.type === 'nrql') {
      nrqlEventData[eventStream.name] = rawData;
    } else if (eventStream.type === 'entitySearch') {
      entitySearchEventData[eventStream.name] = entitySearchResults;
    }

    this.setState({ nrqlEventData, entitySearchEventData });
  };

  // wrap NrqlQuery so we can stitch additional data
  nrqlQuery = (nrqlQuery, accountId, color) => {
    return new Promise(resolve => {
      // where clause with timestamp is used to forceably break cache
      const time = Date.now();
      NrqlQuery.query({
        query: `${nrqlQuery} WHERE ${time}=${time}`,
        accountId
      }).then(value => {
        value.accountId = accountId;
        if (color) value.color = color;
        resolve(value);
      });
    });
  };

  entitySearchQuery = (eventStream, begin_time, end_time) => {
    let { query } = eventStream;
    const { accounts, filters, dbFilters } = this.state;

    if (eventStream.tagFilters) {
      let appendedTags = '';

      eventStream.tagFilters.forEach(t => {
        if (t === 'accountId') {
          const accountsStr = accounts.map(a => `'${a}'`).join(',');
          const accountTagsQuery = ` AND tags.accountId IN (${accountsStr})`;
          appendedTags += accountTagsQuery;
        } else if (t === 'name') {
          let operator = '';
          let value = '';

          for (let z = 0; z < dbFilters.length; z++) {
            const { name } = dbFilters[z];
            const names = name.split(',');

            for (let x = 0; x < names.length; x++) {
              if (names[x] === 'name' || names[x] === 'appName') {
                operator = dbFilters[z].operator;
                value = dbFilters[z].default;
                if (`filter_${name}` in filters) {
                  value = filters[`filter_${name}`].value;
                }
              }

              if (operator && value) {
                break;
              }
            }
          }

          value = value.replace(/\*/g, '%');

          if (operator && operator !== '>' && operator !== '<') {
            appendedTags += ` AND name ${operator} '${value}'`;
          }
        } else {
          // console.log(t);
        }
      });

      query += appendedTags;
    }

    // console.log(`Event Stream Entity Search Query: ${query}`);

    return new Promise(async resolve => {
      const entityGuids = await this.recursiveGuidFetch(query);
      const entityChunks = chunk(entityGuids, 25);

      const entityPromises = entityChunks.map(chunk => {
        return new Promise(async resolve => {
          const guids = `"${chunk.join(`","`)}"`;
          const nerdGraphResult = await NerdGraphQuery.query({
            query: getAlertsDeploysQuery(guids, end_time, begin_time)
          });
          resolve(nerdGraphResult);
        });
      });

      let nerdgraphEventData = [];
      await Promise.all(entityPromises).then(values => {
        values.forEach(v => {
          const entities = (((v || {}).data || {}).actor || {}).entities || [];
          nerdgraphEventData = [...nerdgraphEventData, ...entities];
        });
      });

      nerdgraphEventData = nerdgraphEventData.filter(
        e =>
          (e.alertViolations || []).length > 0 ||
          (e.deployments || []).length > 0
      );

      resolve(nerdgraphEventData);
    });
  };

  recursiveGuidFetch = async query => {
    return new Promise(async resolve => {
      const guidData = [];

      const q = queue((task, callback) => {
        NerdGraphQuery.query({
          query: getGuidsQuery(task.query, task.cursor)
        }).then(value => {
          const results =
            ((((value || {}).data || {}).actor || {}).entitySearch || {})
              .results || null;

          if (results) {
            if (results.entities.length > 0) {
              guidData.push(results.entities);
            }

            if (results.nextCursor) {
              q.push({ query, cursor: results.nextCursor });
            }
          }

          callback();
        });
      }, 1);

      q.push({ query, cursor: null });

      await q.drain();

      resolve(guidData.flat().map(g => g.guid));
    });
  };

  layoutUpdate = async (
    layout,
    selectedBoard,
    storageLocation,
    updateBoard
  ) => {
    const { document } = selectedBoard;
    // stitch new coordinates
    layout.forEach(w => {
      const id = w.i.split('_')[1];
      document.widgets[id].x = w.x || 0;
      document.widgets[id].y = w.y || 0;
      document.widgets[id].w = w.w || 6;
      document.widgets[id].h = w.h || 4;
    });

    switch (storageLocation.type) {
      case 'user': {
        const result = await writeUserDocument(
          'OpenBoards',
          selectedBoard.value,
          document
        );
        if (result && result.data) {
          updateBoard(document);
        }
        break;
      }
      case 'account': {
        const result = await writeAccountDocument(
          storageLocation.value,
          'OpenBoards',
          selectedBoard.value,
          document
        );
        if (result && result.data) {
          updateBoard(document);
        }
        break;
      }
    }
  };

  render() {
    const {
      height,
      width,
      selectedBoard,
      filterClause,
      timeRange,
      sinceClause,
      begin_time,
      end_time
    } = this.props;
    const {
      nrqlEventData,
      entitySearchEventData,
      accounts,
      filters,
      dbFilters
    } = this.state;

    return (
      <DataConsumer>
        {({ storageLocation, updateBoard }) => {
          const { document } = selectedBoard;

          const styles = document.styles || [];
          styles.forEach(s => {
            writeStyle(s.name, `.${s.name} * ${s.value}`);
          });

          const layout = (document.widgets || []).map((w, i) => {
            return {
              i: `w_${i}_${w.name}`,
              x: w.x || 0,
              y: w.y || 0,
              w: w.w || 7,
              h: w.h || 6,
              type: w.type,
              widget: w
            };
          });

          const renderWidget = w => {
            switch (w.type) {
              case 'nrql': {
                const derivedEvents = deriveEvents(
                  w.widget.events,
                  nrqlEventData,
                  entitySearchEventData,
                  begin_time
                );

                return (
                  <NrqlWidget
                    i={w.i}
                    eventData={derivedEvents}
                    widget={w.widget}
                    filterClause={filterClause}
                    sinceClause={sinceClause}
                    timeRange={timeRange}
                    begin_time={begin_time}
                    end_time={end_time}
                  />
                );
              }
              case 'html': {
                return <BasicHTML i={w.i} widget={w.widget} />;
              }
              case 'entityhdv': {
                const tagFilterQuery = buildTagFilterQuery(
                  w.widget.tagFilters || [],
                  accounts,
                  filters,
                  dbFilters
                );
                return (
                  <EntityHdv
                    i={w.i}
                    widget={w.widget}
                    tagFilterQuery={tagFilterQuery}
                  />
                );
              }
              case 'eventtimeline': {
                return (
                  <EventTimeline
                    i={w.i}
                    widget={w.widget}
                    nrqlEventData={nrqlEventData}
                    entitySearchEventData={entitySearchEventData}
                    begin_time={begin_time}
                  />
                );
              }
              default:
                return 'unknown widget type';
            }
          };

          return (
            <div style={{ height: height - 61 }}>
              <GridLayout
                className="layout"
                layout={layout}
                cols={30}
                rowHeight={30}
                width={width}
                onLayoutChange={l =>
                  this.layoutUpdate(
                    l,
                    selectedBoard,
                    storageLocation,
                    updateBoard
                  )
                }
              >
                {layout.map(w => {
                  return (
                    <div
                      key={w.i}
                      style={{ backgroundColor: 'white' }}
                      // style={{ backgroundColor: 'rgb(240, 240, 240)' }}
                    >
                      {renderWidget(w)}
                    </div>
                  );
                })}
              </GridLayout>
            </div>
          );
        }}
      </DataConsumer>
    );
  }
}
// layout example
// const layout = [
//   {
//     i: 'a',
//     x: 0,
//     y: 0,
//     w: 1,
//     h: 2,
//     static: true
//   },
//   { i: 'b', x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4 },
//   { i: 'c', x: 4, y: 0, w: 1, h: 2 },
//   { i: 'd', x: 4, y: 0, w: 1, h: 2 }
// ];
