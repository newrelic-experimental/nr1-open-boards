import React from 'react';
import { Modal, Button, Popup, Icon } from 'semantic-ui-react';
import { DataConsumer } from '../../../../context/data';
import EntityHdvModalBody from './modal-body';

export default class CreateEntityHdvWidget extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleOpen = updateDataStateContext => {
    updateDataStateContext({ entityHdvWidgetOpen: true });
  };

  handleClose = updateDataStateContext => {
    updateDataStateContext({
      entityHdvWidgetOpen: false,
      selectedWidget: null
    });
  };

  render() {
    const { selectedChart } = this.state;

    return (
      <DataConsumer>
        {({
          entityHdvWidgetOpen,
          updateDataStateContext,
          storageOptions,
          selectedBoard,
          selectedWidget
        }) => {
          const accounts = storageOptions.map(
            ({ label, ...keepAttrs }) => keepAttrs
          );
          accounts.shift();

          const title = selectedWidget
            ? 'Edit Entity High Density View Widget'
            : 'Create Entity High Density View Widget';

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
              open={entityHdvWidgetOpen}
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
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 40 34.64101615137754"
                        style={{
                          filter:
                            'drop-shadow(rgba(255, 255, 255, 0.5) 0px 0px 10px)'
                        }}
                      >
                        <path
                          fill="#000000"
                          d="M0 17.32050807568877L10 0L30 0L40 17.32050807568877L30 34.64101615137754L10 34.64101615137754Z"
                        />
                      </svg>
                    </Button>
                  }
                />
              }
            >
              <Modal.Header id="entityhdv-create-title">
                Entity High Density View Widget
              </Modal.Header>

              <Modal.Content>
                <EntityHdvModalBody
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
