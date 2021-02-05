import React from 'react';
import RadarChart from 'react-svg-radar-chart';

const getKey = (d, query) => {
  for (let z = 0; z < d.length; z++) {
    if (d[z].nrqlQuery === query) {
      const key = d[z].metadata.groups[0].value;
      if (key !== 'SLO' && key !== 'SLA') {
        return key;
      }
    }
  }
};

export default class SvgRadarChart extends React.Component {
  render() {
    const { width, height, data } = this.props;

    const summarizedData = (data || [])
      .map(d => {
        const key = d.metadata.groups[0].value;
        const value = d.data[0][key];

        if (key !== undefined && value !== undefined) {
          return {
            group:
              key !== 'SLO' && key !== 'SLA' ? key : getKey(data, d.nrqlQuery),
            key,
            value,
            query: d.nrqlQuery
          };
        } else {
          return null;
        }
      })
      .filter(d => d && d.group);

    const radarCaptions = {};
    const actuals = {};
    const slos = {};
    const slas = {};

    // key = Avg CpuPercent, SLO, SLA
    // group = Avg CpuPercent
    summarizedData.forEach(s => {
      radarCaptions[s.group] = s.group;
      if (s.key === 'SLO') {
        slos[s.group] = s.value || 0;
      } else if (s.key === 'SLA') {
        slas[s.group] = s.value || 0;
      } else {
        actuals[s.group] = s.value || 0;
      }
    });

    const radarData = [
      { data: { ...slas }, meta: { color: '#FF4E00', type: 'SLA' } },
      { data: { ...slos }, meta: { color: '#FD9E32', type: 'SLO' } },
      { data: { ...actuals }, meta: { color: '#008c99', type: 'VALUE' } }
    ];

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
          <div
            style={{
              fontSize: '13px',
              display: 'relative',
              wordWrap: 'break-word'
            }}
          >
            {radarData.length > 0 &&
            Object.keys(radarData[0].data || {}).length > 0 &&
            Object.keys(radarCaptions).length > 0 ? (
              <RadarChart
                captions={radarCaptions}
                data={radarData}
                size={height - 10}
              />
            ) : (
              ''
            )}
          </div>
        </div>
      </div>
    );
  }
}
