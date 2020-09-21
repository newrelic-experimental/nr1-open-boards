import React from 'react';
import { DataConsumer } from '../../../../context/data';
import { Table, Icon, Button } from 'semantic-ui-react';
import { navigation } from 'nr1';
import _ from 'lodash';

export default class WidgetChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      columns: {},
      column: '',
      direction: null,
      accountId: '',
      nrqlQuery: '',
      isLogs: '',
      hasFacet: '',
      rowData: [],
      trackTimestamp: 0
    };
  }

  componentDidUpdate() {
    const { trackTimestamp } = this.state;
    const { data } = this.props;

    if (
      data &&
      data[0] &&
      trackTimestamp !==
        (data[0].data[0].begin_time || data[0].data[0].timestamp)
    ) {
      let accountId = null;
      let nrqlQuery = null;
      let isLogs = false;
      let hasFacet = false;
      if (data[0]) {
        accountId = data[0].accountId;
        nrqlQuery = data[0].nrqlQuery;
        if (nrqlQuery.includes('FROM Log') || nrqlQuery.includes('from Log')) {
          isLogs = true;
        }
        if (nrqlQuery.includes('facet') || nrqlQuery.includes('FACET')) {
          hasFacet = true;
        }
      }
      const { rowData, columns } = this.generateRowData(data, hasFacet);
      this.setState({
        data,
        accountId,
        nrqlQuery,
        isLogs,
        hasFacet,
        rowData,
        columns,
        trackTimestamp: data[0].data[0].begin_time || data[0].data[0].timestamp
      });
    }
  }

  generateRowData = (data, hasFacet) => {
    const columns = {};
    let availableColumns = [];
    let rowData = [];
    if (hasFacet || data[0].data[0].begin_time) {
      const facetData = {};
      data.forEach(d => {
        const { metadata } = d;
        const { groups } = metadata;
        const metricKey = groups[0].value;
        const metricValue = d.data[0][metricKey];

        let facetKey = '';

        groups.forEach(g => {
          if (g.type === 'facet') {
            facetKey += `${g.name}:#:${g.value}|||`;
          }
        });
        facetKey = facetKey.substring(0, facetKey.length - 3);

        if (!(facetKey in facetData)) {
          facetData[facetKey] = {};
          const keys = facetKey.split('|||');
          keys.forEach(k => {
            const keySplit = k.split(':#:');
            facetData[facetKey][keySplit[0]] = keySplit[1];
            columns[keySplit[0]] = true;
          });
        }
        columns[metricKey] = true;
        facetData[facetKey][metricKey] = metricValue;
      });

      rowData = Object.keys(facetData).map(key => {
        return facetData[key];
      });
    } else {
      availableColumns = data.map(d => d.metadata.units_data);
      availableColumns.forEach(d => {
        Object.keys(d).forEach(key => {
          const value = d[key];
          columns[key] = value;
        });
      });

      rowData = data.map(d => d.data).flat();
    }

    return { rowData, columns };
  };

  buildQueryMessage = (dbFilters, filters) => {
    let queryMessage = '';

    Object.keys(filters).forEach(filterKey => {
      const key = filterKey.replace('filter_', '');

      for (let z = 0; z < dbFilters.length; z++) {
        if (dbFilters[z].name === key) {
          const customFilter = filters[`filter_${key}`];
          const { operator } = dbFilters[z];
          let filterValue = customFilter
            ? customFilter.value
            : dbFilters[z].default;

          if (filterValue !== '*') {
            if (operator === 'LIKE') {
              filterValue = filterValue.replace(/%/g, '*');
              filterValue = `*${filterValue}*`;
            } else if (operator === '=') {
              filterValue = `"${filterValue}"`;
            }

            filterValue = filterValue.replace(/ /g, '\\ ');

            queryMessage += `${key}:${filterValue} and `;
          }
        }
      }
    });

    if (queryMessage.length > 3) {
      queryMessage = queryMessage.slice(0, -4);
    }

    return queryMessage;
  };

  toggle = header => {
    const { direction } = this.state;
    const newDirection = direction === 'ascending' ? 'descending' : 'ascending';

    this.setState({
      direction: newDirection,
      column: header
    });
  };

  render() {
    const { columns, column, direction, isLogs, accountId } = this.state;
    const { width, height, onClickTable, widgetProps } = this.props;
    let rowData = this.state.rowData;

    return (
      <DataConsumer>
        {({ updateDataStateContext, selectedBoard, filters }) => {
          const dbFilters = selectedBoard.document.filters || [];

          const hasFilter = key => {
            for (let z = 0; z < dbFilters.length; z++) {
              if (dbFilters[z].name === key) {
                return true;
              }
            }
            return false;
          };

          const parseBool = val => (val === 'true' ? true : false);

          const viewLogs = () => {
            const logs = {
              id: 'logger.log-tailer',
              urlState: {
                query: this.buildQueryMessage(dbFilters, filters),
                accountId
              }
            };
            navigation.openStackedNerdlet(logs);
          };

          if (column) {
            if (direction === 'ascending') {
              rowData = _.sortBy(rowData, column);
            } else {
              rowData = _.sortBy(rowData, column).reverse();
            }
          }

          return (
            <div
              style={{
                maxHeight: height,
                maxWidth: width,
                overflow: 'auto'
              }}
              className="force-select"
            >
              {isLogs ? (
                <div style={{ float: 'right', paddingBottom: '3px' }}>
                  <Button content="View in Logs UI" onClick={viewLogs} />
                </div>
              ) : (
                ''
              )}

              <Table
                compact={parseBool(widgetProps.compact)}
                singleLine={parseBool(widgetProps.singleLine)}
                fixed={parseBool(widgetProps.fixed)}
                striped={parseBool(widgetProps.striped)}
                sortable
                className="force-select"
              >
                <Table.Header>
                  <Table.Row>
                    {Object.keys(columns).map(header => {
                      return (
                        <Table.HeaderCell
                          sorted={column === header ? direction : null}
                          onClick={() => {
                            this.toggle(header);
                          }}
                          key={header}
                        >
                          {hasFilter(header) ? (
                            <span
                              style={{
                                float: 'left',
                                maxHeight: '16px'
                              }}
                            >
                              {header}&nbsp;
                              <Icon
                                style={{
                                  padding: '0px',
                                  margin: '0px',
                                  maxHeight: '16px'
                                }}
                                name="filter"
                              />
                            </span>
                          ) : (
                            <span style={{ float: 'left', maxHeight: '16px' }}>
                              {header}
                            </span>
                          )}
                        </Table.HeaderCell>
                      );
                    })}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {rowData.map((r, i) => {
                    return (
                      <Table.Row key={i}>
                        {Object.keys(r).map((c, z) => {
                          let cellValue =
                            r[c] !== null && r[c] !== undefined ? r[c] : '';

                          if (c === 'timestamp') {
                            const date = new Date(cellValue);
                            cellValue = date.toLocaleString();
                          }

                          return (
                            <Table.Cell
                              key={z}
                              onClick={() => onClickTable(c, r)}
                              className={hasFilter(c) ? 'cell-hover' : ''}
                            >
                              <>{cellValue}</>
                            </Table.Cell>
                          );
                        })}
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>
            </div>
          );
        }}
      </DataConsumer>
    );
  }
}
