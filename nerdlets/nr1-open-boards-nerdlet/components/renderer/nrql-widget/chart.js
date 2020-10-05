import React from 'react';
import {
  BarChart as NrBarChart,
  AreaChart as NrAreaChart,
  LineChart as NrLineChart,
  PieChart as NrPieChart,
  TableChart as NrTableChart,
  BillboardChart as NrBillboardChart
} from 'nr1';
import SemanticTable from './semantic/table';
import { nrqlToNrTable, nrqlToNrBillboard } from './transformers/newrelic';
import { DataConsumer } from '../../../context/data';
import OpenHtml from './html';

export default class WidgetChart extends React.Component {
  render() {
    return (
      <DataConsumer>
        {({ updateDataStateContext, selectedBoard, filters }) => {
          const { widget, rawData, eventData, width, height } = this.props;
          const nrDarkModeClass = 'force-select';
          const dbFilters = selectedBoard.document.filters || [];

          const handleTableFilter = (key, data) => {
            for (let z = 0; z < dbFilters.length; z++) {
              const { ignoreCase, name } = dbFilters[z];
              if (
                (ignoreCase && name.toLowerCase() === key.toLowerCase()) ||
                (!ignoreCase && name === key)
              ) {
                const value = data[key];
                filters[`filter_${key}`] = { value, label: value };
                updateDataStateContext({ filters });
                break;
              }
            }
          };

          const handleFacetFilter = data => {
            const groups = data.metadata.groups || [];
            for (let y = 0; y < groups.length; y++) {
              if (groups[y].type === 'facet') {
                const { name, value } = groups[y];

                for (let z = 0; z < dbFilters.length; z++) {
                  const dbFilterName = dbFilters[z].name;
                  if (dbFilterName === name) {
                    filters[`filter_${name}`] = { value, label: value };
                    updateDataStateContext({ filters });
                    break;
                  }
                }

                break;
              }
            }
          };

          const chart = () => {
            switch (widget.chart) {
              case 'newrelic:bar': {
                return (
                  <NrBarChart
                    style={{ width, height }}
                    className={nrDarkModeClass}
                    data={rawData}
                    onClickBar={handleFacetFilter}
                  />
                );
              }
              case 'newrelic:area': {
                return (
                  <NrAreaChart
                    style={{ width, height }}
                    className={nrDarkModeClass}
                    data={rawData}
                    onClickArea={handleFacetFilter}
                  />
                );
              }
              case 'newrelic:billboard': {
                return (
                  <NrBillboardChart
                    style={{ width, height }}
                    data={nrqlToNrBillboard(widget, rawData)}
                  />
                );
              }
              case 'newrelic:line': {
                return (
                  <NrLineChart
                    style={{ width, height }}
                    className={nrDarkModeClass}
                    data={[...rawData, ...eventData]}
                    onClickArea={handleFacetFilter}
                  />
                );
              }
              case 'newrelic:pie': {
                return (
                  <NrPieChart
                    style={{ width, height }}
                    className={nrDarkModeClass}
                    data={rawData}
                    onClickPie={handleFacetFilter}
                  />
                );
              }
              case 'newrelic:table': {
                return (
                  <NrTableChart
                    style={{ width, height }}
                    className={nrDarkModeClass}
                    data={nrqlToNrTable(widget, rawData)}
                    onClickTable={handleTableFilter}
                  />
                );
              }
              case 'semantic:table': {
                return (
                  <SemanticTable
                    width={width}
                    height={height}
                    widgetProps={widget.props || {}}
                    data={nrqlToNrTable(widget, rawData)}
                    onClickTable={handleTableFilter}
                  />
                );
              }
              case 'open:html': {
                return (
                  <OpenHtml
                    width={width}
                    height={height}
                    widget={widget}
                    data={rawData}
                  />
                );
              }
              default:
                return `Unsupported chart type: ${widget.chart}`;
            }
          };

          return <div>{chart()}</div>;
        }}
      </DataConsumer>
    );
  }
}
