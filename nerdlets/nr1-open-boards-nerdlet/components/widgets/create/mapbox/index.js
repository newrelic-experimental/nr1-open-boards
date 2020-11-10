import React from 'react';
import { Modal, Button, Popup, Icon } from 'semantic-ui-react';
import { DataConsumer } from '../../../../context/data';
import MapboxModalBody from './modal-body';

export default class CreateMapboxWidget extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleOpen = updateDataStateContext => {
    updateDataStateContext({ mapboxWidgetOpen: true });
  };

  handleClose = updateDataStateContext => {
    updateDataStateContext({
      mapboxWidgetOpen: false,
      selectedWidget: null
    });
  };

  render() {
    const { selectedChart } = this.state;

    return (
      <DataConsumer>
        {({
          mapboxWidgetOpen,
          updateDataStateContext,
          storageOptions,
          selectedBoard,
          selectedWidget
        }) => {
          const accounts = storageOptions.map(
            ({ label, ...keepAttrs }) => keepAttrs
          );
          accounts.shift();

          const title = `${selectedWidget ? 'Edit' : 'Create'} Mapbox Widget`;

          let widget = null;
          let widgetSplit = null;
          if (selectedWidget && !selectedChart) {
            const { document } = selectedBoard;
            widgetSplit = selectedWidget.split('_');
            widget = document.widgets[widgetSplit[1]];
          }

          return (
            <Modal
              dimmer="inverted"
              closeIcon
              open={mapboxWidgetOpen}
              onUnmount={() =>
                updateDataStateContext({
                  closeCharts: false,
                  selectedWidget: null
                })
              }
              onMount={() => updateDataStateContext({ closeCharts: true })}
              onClose={() => this.handleClose(updateDataStateContext)}
              size="fullscreen"
              trigger={
                <Popup
                  basic
                  content={title}
                  trigger={
                    <Button
                      onClick={() => this.handleOpen(updateDataStateContext)}
                      style={{ height: '45px' }}
                      className="filter-button"
                    >
                      <Icon.Group
                        size="large"
                        style={{
                          marginTop: '5px',
                          marginLeft: '8px',
                          marginRight: '-10px'
                        }}
                      >
                        <Icon name="map" />
                        <Icon corner="bottom right" name="add" />
                      </Icon.Group>
                    </Button>
                  }
                />
              }
            >
              <Modal.Header id="mapbox-create-title">
                Mapbox Widget
              </Modal.Header>

              <Modal.Content>
                <MapboxModalBody
                  widget={widget}
                  widgetNo={widgetSplit ? widgetSplit[1] : null}
                />
              </Modal.Content>
            </Modal>
          );
        }}
      </DataConsumer>
    );
  }
}
