import React from 'react';
import { Label } from 'semantic-ui-react';

export default class PopupContent extends React.Component {
  render() {
    const { popupData, updateState } = this.props;
    const { properties } = popupData;

    if (properties) {
      let alertColor = 'grey';

      switch (properties.alertHighest) {
        case 'NOT_ALERTING': {
          alertColor = 'green';
          break;
        }
        case 'WARNING': {
          alertColor = 'orange';
          break;
        }
        case 'CRITICAL': {
          alertColor = 'red';
          break;
        }
      }

      return (
        <div style={{ fontSize: '14px', display: 'inline' }}>
          <div style={{ paddingTop: '5px' }}>
            <Label
              style={{ width: '100%', cursor: 'pointer' }}
              color={alertColor}
              icon="circle"
              content={properties.name}
              // detail={properties.alertHighest}
              onClick={() => updateState({ hidden: true })}
            />
            {/* <br />
            <Label
              icon="boxes"
              content="Entities"
              detail={(properties.entities || []).length}
            /> */}
          </div>
        </div>
      );
    }

    return <div>No content</div>;
  }
}
