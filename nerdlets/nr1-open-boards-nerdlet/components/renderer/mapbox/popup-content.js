import React from 'react';
import { Button, Icon, Form } from 'semantic-ui-react';

export default class PopupContent extends React.Component {
  render() {
    const { popupData } = this.props;
    const { properties } = popupData;

    if (properties) {
      let alertColor = '#a8a8a8';

      switch (properties.alertHighest) {
        case 'NOT_ALERTING': {
          alertColor = '#70e65c';
          break;
        }
        case 'WARNING': {
          alertColor = '#fa9a2d';
          break;
        }
        case 'CRITICAL': {
          alertColor = '#d94545';
          break;
        }
      }

      return (
        <div style={{ fontSize: '14px', display: 'inline' }}>
          <div>
            <span
              style={{
                color: alertColor,
                fontSize: '20px'
              }}
            >
              ●
            </span>
            &nbsp;
            {properties.name}
          </div>
        </div>
      );
    }

    return <div>No content</div>;
  }
}
