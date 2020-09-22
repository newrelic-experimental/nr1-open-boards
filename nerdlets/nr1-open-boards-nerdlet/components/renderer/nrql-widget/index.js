import React from 'react';
import { AutoSizer, NrqlQuery } from 'nr1';
import WidgetDropDown from './drop-down';
import WidgetChart from './chart';
import wcm from 'wildcard-match';

// import { DataConsumer } from '../../context/data';

const stripQueryTime = nrqlQuery => {
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

export default class NrqlWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      init: null,
      isFetching: false,
      filterClause: '',
      sinceClause: '',
      rawData: []
    };
  }

  componentDidMount() {
    const { widget, filterClause, sinceClause } = this.props;
    // fetch data on mount
    this.setState({ filterClause, sinceClause, init: true }, () => {
      this.fetchData(widget);
      // fetch data on poll
      let pollInterval = widget.ms || 15000;
      // do not allow poll intervals to be faster than 2.5 seconds
      pollInterval = pollInterval < 2500 ? 2500 : pollInterval;

      this.widgetPoll = setInterval(() => {
        this.fetchData(widget);
      }, pollInterval);
    });
  }

  componentDidUpdate() {
    const { filterClause, sinceClause, widget } = this.props;

    if (
      filterClause !== this.state.filterClause ||
      sinceClause !== this.state.sinceClause
    ) {
      const updateFilter =
        filterClause !== this.state.filterClause
          ? filterClause
          : this.state.filterClause;
      const updateSince =
        sinceClause !== this.state.sinceClause
          ? sinceClause
          : this.state.sinceClause;
      this.updateFilter(widget, updateFilter, updateSince);
    }
  }

  componentWillUnmount() {
    if (this.widgetPoll) {
      clearInterval(this.widgetPoll);
    }
  }

  updateFilter = (widget, filterClause, sinceClause) => {
    const stateUpdate = { init: false, filterClause, sinceClause };
    this.setState(stateUpdate, () => this.fetchData(widget));
  };

  fetchData = widget => {
    const { isFetching, filterClause, sinceClause, init } = this.state;
    if (!isFetching) {
      const queryPromises = [];
      const rawData = [];
      const useSince = init === false ? sinceClause : '';

      this.setState({ isFetching: true }, async () => {
        widget.sources.forEach((s, sourceIndex) => {
          s.accounts.forEach(accountId => {
            // handle nrdb queries
            if (s.nrqlQuery) {
              const nrqlQuery = useSince
                ? stripQueryTime(s.nrqlQuery)
                : s.nrqlQuery;

              queryPromises.push(
                this.nrqlQuery(
                  `${nrqlQuery} ${filterClause} ${useSince}`,
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

        this.setState({ isFetching: false, rawData: [...rawData] });
      });
    }
  };

  // wrap NrqlQuery so we can stitch additional data
  nrqlQuery = (nrqlQuery, accountId, sourceIndex) => {
    return new Promise(resolve => {
      // where clause with timestamp is used to forceably break cache
      NrqlQuery.query({
        query: `${nrqlQuery} WHERE ${Date.now()}=${Date.now()}`,
        accountId
      }).then(value => {
        value.accountId = accountId;
        value.sourceIndex = sourceIndex;
        resolve(value);
      });
    });
  };

  render() {
    const { widget, i } = this.props;
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
