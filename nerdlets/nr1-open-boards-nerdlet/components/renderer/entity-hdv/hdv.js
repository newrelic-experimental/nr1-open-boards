import React from 'react';
import HexagonGrid from 'react-hexagon-grid';
import { Icon } from 'semantic-ui-react';
import { navigation } from 'nr1';

export default class EntityHdvWidget extends React.Component {
  render() {
    const { limit, data, width, height } = this.props;

    const getHexProps = hexagon => {
      let fill = '';
      switch (hexagon.alertSeverity) {
        case 'CRITICAL': {
          fill = 'red';
          break;
        }
        case 'WARNING': {
          fill = 'orange';
          break;
        }
        case 'NOT_ALERTING': {
          fill = 'green';
          break;
        }
        case 'NOT_CONFIGURED': {
          fill = 'grey';
          break;
        }
      }
      return {
        style: {
          fill,
          stroke: 'white'
        },
        onMouseEnter: () => console.log('enter'),
        onClick: () => navigation.openStackedEntity(hexagon.guid)
      };
    };

    const renderHexagonContent = hexagon => {
      return (
        <text
          x="50%"
          y="50%"
          fontSize={100}
          fontWeight="lighter"
          style={{ fill: 'white' }}
          textAnchor="middle"
        />
      );
    };

    const alerts = {
      CRITICAL: [],
      WARNING: [],
      NOT_ALERTING: [],
      NOT_CONFIGURED: []
    };

    for (let z = 0; z < data.length; z++) {
      alerts[data[z].alertSeverity].push(data[z]);
    }

    let hexagons = [];

    Object.keys(alerts).forEach(a => {
      if (alerts[a].length > 0) {
        hexagons = [...hexagons, ...alerts[a]];
      }
    });

    if (limit && limit > 0) {
      hexagons = hexagons.slice(0, limit);
    }

    return (
      <div>
        {hexagons.length > 0 ? (
          <HexagonGrid
            gridWidth={width - 5}
            gridHeight={height}
            hexagons={hexagons}
            hexProps={getHexProps}
            renderHexagonContent={renderHexagonContent}
          />
        ) : (
          'No entities found'
        )}
      </div>
    );
  }
}