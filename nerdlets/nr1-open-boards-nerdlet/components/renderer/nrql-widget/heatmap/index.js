import React from 'react';
import HeatMap from 'react-heatmap-grid';
import HRNumbers from 'human-readable-numbers';

export default class HeatMapWidget extends React.Component {
  render() {
    const { width, height, data } = this.props;

    let xLabels = [];
    const unorderedHeatMapData = {};
    let query = '';

    data.forEach(d => {
      query = d.nrqlQuery;
      const metricName =
        ((((d || {}).metadata || {}).groups || {})[0] || {}).value || null;

      if (metricName) {
        const value = (((d || {}).data || {})[0] || {})[metricName] || 0;

        const y = d.metadata.groups[1].value;
        const x = d.metadata.groups[2].value;
        xLabels.push(x);

        if (y in unorderedHeatMapData) {
          unorderedHeatMapData[y][x] = value;
        } else {
          unorderedHeatMapData[y] = { [x]: value };
        }
      }
    });

    xLabels = [...new Set(xLabels)];

    // allow additional sorting for hourOf and dateOf
    if (query) {
      if (query.includes('hourOf(')) {
        xLabels = xLabels.sort((a, b) => a.split(':')[0] - b.split(':')[0]);
      } else if (query.includes('dateOf(')) {
        xLabels = xLabels.sort(
          (a, b) => new Date(a).getTime() - new Date(b).getTime()
        );
      }
    }

    const orderedHeatMapData = {};
    Object.keys(unorderedHeatMapData)
      .sort()
      .forEach(key => {
        orderedHeatMapData[key] = unorderedHeatMapData[key];
      });

    const heatmapData = [];
    const yLabels = [];

    Object.keys(orderedHeatMapData).forEach(key => {
      yLabels.push(key);
      const metricData = orderedHeatMapData[key];
      const dataArr = [];
      xLabels.forEach(label => {
        if (label in metricData) {
          dataArr.push(metricData[label]);
        } else {
          dataArr.push(0);
        }
      });
      heatmapData.push(dataArr);
    });

    return (
      <div
        style={{
          overflow: 'auto'
        }}
        className="force-select"
      >
        <div
          style={{
            height: `${height}px`,
            width: `${width - 15}px`,
            overflow: 'auto'
          }}
        >
          <div style={{ fontSize: '13px', display: 'relative' }}>
            <HeatMap
              xLabels={xLabels}
              yLabels={yLabels}
              xLabelsLocation="bottom"
              // xLabelsVisibility={xLabelsVisibility}
              xLabelWidth={60}
              yLabelWidth={150}
              data={heatmapData}
              squares
              height={45}
              // onClick={(x, y) => window.alert(`Clicked ${x}, ${y}`)}
              cellStyle={(background, value, min, max, data, x, y) => ({
                background: `rgb(0, 151, 230, ${1 -
                  (max - value) / (max - min)})`,
                fontSize: '11.5px',
                color: '#444'
              })}
              cellRender={value =>
                value && (
                  <div>
                    {isNaN(value) ? value : HRNumbers.toHumanString(value)}
                  </div>
                )
              }
            />
          </div>
        </div>
      </div>
    );
  }
}
