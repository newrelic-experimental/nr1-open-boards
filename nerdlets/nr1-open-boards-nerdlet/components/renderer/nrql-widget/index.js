/* eslint 
no-eval: 0
*/

import React from 'react';
import { AutoSizer, NrqlQuery } from 'nr1';
import WidgetDropDown from './drop-down';
import WidgetChart from './chart';
import wcm from 'wildcard-match';
import { randomColor } from './utils';
// import { stripQueryTime } from '../../chart-grid/utils';
// import { DataConsumer } from '../../context/data';

export default class NrqlWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isFetching: false,
      filterClause: '',
      sinceClause: '',
      rawData: [],
      color: '',
      pollInterval: 2000
    };
  }

  componentDidMount() {
    const {
      widget,
      filterClause,
      sinceClause,
      timeRange,
      begin_time,
      end_time
    } = this.props;
    const pollInterval = this.getPollInterval(timeRange, widget);

    // fetch data on mount
    this.setState(
      {
        widgetStr: JSON.stringify(widget),
        filterClause,
        sinceClause,
        color: randomColor(),
        pollInterval,
        begin_time,
        end_time
      },
      () => {
        this.fetchData(widget);
        this.widgetPoll = setInterval(() => {
          this.fetchData(widget);
        }, pollInterval);
      }
    );
  }

  componentDidUpdate() {
    const {
      filterClause,
      sinceClause,
      widget,
      timeRange,
      begin_time,
      end_time
    } = this.props;
    const pollInterval = this.getPollInterval(timeRange, widget);
    const widgetStr = JSON.stringify(widget);

    if (
      filterClause !== this.state.filterClause ||
      sinceClause !== this.state.sinceClause ||
      pollInterval !== this.state.pollInterval ||
      widgetStr !== this.state.widgetStr
    ) {
      const updateFilter =
        filterClause !== this.state.filterClause
          ? filterClause
          : this.state.filterClause;
      const updateSince =
        sinceClause !== this.state.sinceClause
          ? sinceClause
          : this.state.sinceClause;

      this.updateFilter(
        widgetStr,
        widget,
        updateFilter,
        updateSince,
        pollInterval,
        begin_time,
        end_time
      );
    }
  }

  componentWillUnmount() {
    if (this.widgetPoll) {
      clearInterval(this.widgetPoll);
    }
  }

  updateFilter = (
    widgetStr,
    widget,
    filterClause,
    sinceClause,
    pollInterval,
    begin_time,
    end_time
  ) => {
    const stateUpdate = {
      filterClause,
      sinceClause,
      pollInterval,
      begin_time,
      end_time,
      widgetStr
    };
    this.setState(stateUpdate, () => {
      if (this.widgetPoll) {
        clearInterval(this.widgetPoll);
      }
      this.fetchData(widget);
      this.widgetPoll = setInterval(() => {
        this.fetchData(widget);
      }, pollInterval);
    });
  };

  getPollInterval = (timeRange, widget) => {
    if (widget.ms) return widget.ms;

    let pollInterval = this.state.pollInterval;

    if (timeRange) {
      if (timeRange.duration) {
        pollInterval = timeRange.duration / 60;
      } else if (timeRange.begin_time && timeRange.end_time) {
        pollInterval = (timeRange.end_time - timeRange.begin_time) / 60;
      }
    }

    if (pollInterval >= 2500) {
      return pollInterval;
    }

    return this.state.pollInterval;
  };

  fetchData = widget => {
    const { isFetching, filterClause, sinceClause, color } = this.state;
    if (!isFetching) {
      const queryPromises = [];
      const rawData = [];

      this.setState({ isFetching: true }, async () => {
        widget.sources.forEach((s, sourceIndex) => {
          s.accounts.forEach(accountId => {
            // handle nrdb queries
            if (s.nrqlQuery) {
              const lowerNrqlQuery = s.nrqlQuery.toLowerCase();
              const nrqlQuery =
                lowerNrqlQuery.includes('until') ||
                lowerNrqlQuery.includes('since')
                  ? s.nrqlQuery
                  : `${s.nrqlQuery} ${sinceClause}`;

              queryPromises.push(
                this.nrqlQuery(
                  `${nrqlQuery} ${filterClause}`,
                  accountId,
                  sourceIndex
                )
              );
            }
          });
        });

        const queryData = await Promise.all(queryPromises);
        queryData.forEach((result, i) => {
          if (!result.error) {
            const { accountId, sourceIndex } = result;
            const chartData = ((result || {}).data || {}).chart || [];
            chartData.forEach(c => {
              const finalResult = {
                ...c,
                accountId,
                sourceIndex,
                nrqlQuery: widget.sources[i].nrqlQuery || ''
              };
              rawData.push(finalResult);
            });
          }
        });

        const eventPromises = [];

        widget.events.forEach((e, sourceIndex) => {
          // handle nrdb queries
          if (e.nrqlQuery) {
            (e.accounts || []).forEach(accountId => {
              const lowerNrqlQuery = e.nrqlQuery.toLowerCase();
              const nrqlQuery =
                lowerNrqlQuery.includes('until') ||
                lowerNrqlQuery.includes('since')
                  ? e.nrqlQuery
                  : `${e.nrqlQuery} ${sinceClause}`;

              const ignoreFilters =
                e.ignoreFilters && e.ignoreFilters === 'true' ? true : false;

              eventPromises.push(
                this.nrqlQuery(
                  `${nrqlQuery} ${ignoreFilters ? '' : filterClause}`,
                  accountId,
                  sourceIndex,
                  e.color || color
                )
              );
            });
          }
        });

        this.setState({
          isFetching: false,
          rawData: [...rawData]
        });
      });
    }
  };

  // wrap NrqlQuery so we can stitch additional data
  nrqlQuery = (nrqlQuery, accountId, sourceIndex, color) => {
    return new Promise(resolve => {
      // where clause with timestamp is used to forceably break cache
      const time = Date.now();
      NrqlQuery.query({
        query: `${nrqlQuery} WHERE ${time}=${time}`,
        accountId
      }).then(value => {
        value.accountId = accountId;
        value.sourceIndex = sourceIndex;
        if (color) value.color = color;
        resolve(value);
      });
    });
  };

  render() {
    const { widget, i, eventData } = this.props;
    const { rawData } = this.state;
    const hdrStyle = widget.headerStyle || {};

    const firstRawData = rawData[0] || null;
    const styleConditions = (widget.styleConditions || []).sort(
      (a, b) => (a.priority || 0) - (b.priority || 0)
    );
    let dynamicClass = '';

    if (firstRawData) {
      const groups = firstRawData.metadata.groups || [];
      const data = firstRawData.data || [];

      for (let i = 0; i < styleConditions.length; i++) {
        const { attr, operator, value } = styleConditions[i];
        const className = styleConditions[i].class;

        for (let z = 0; z < groups.length; z++) {
          const valueName = groups[z].value;
          const displayName = groups[z].displayName;
          if (valueName === attr || displayName === attr) {
            for (let x = 0; x < data.length; x++) {
              const dataValue = data[x][valueName];
              if (dataValue !== undefined && dataValue !== null) {
                if (operator === 'LIKE') {
                  if (wcm(value).test(dataValue)) {
                    dynamicClass = className;
                    break;
                  }
                } else if (operator === 'NOT LIKE') {
                  if (!wcm(value).test(dataValue)) {
                    dynamicClass = className;
                    break;
                  }
                } else if (
                  !operator.includes('LIKE') &&
                  eval(`${dataValue} ${operator} ${value}`)
                ) {
                  dynamicClass = className;
                  break;
                }
              }
            }
          }
        }
      }
    }

    // return (
    //   <DataConsumer>
    //     {({ selectedBoard }) => {
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
              <div style={{ paddingTop }} className={dynamicClass}>
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
                    <WidgetDropDown i={i} height={`${headerHeight}px`} />
                  </div>
                </div>

                <div style={{ paddingLeft, paddingRight, paddingBottom }}>
                  <WidgetChart
                    widget={widget}
                    rawData={rawData}
                    eventData={eventData}
                    width={width}
                    height={maxWidgetHeight}
                  />
                </div>
              </div>
            );
          }}
        </AutoSizer>
      </div>
    );
    //     }}
    //   </DataConsumer>
    // );
  }
}
