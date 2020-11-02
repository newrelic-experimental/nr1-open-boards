import React from 'react';
import { Modal, Icon, Button, Popup, Input } from 'semantic-ui-react';
import { writeUserDocument, writeAccountDocument } from '../../../../lib/utils';
import BasicHTMLModalBody from './modal-body';
import { DataConsumer } from '../../../../context/data';

export default class BasicHTMLWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleOpen = updateDataStateContext => {
    updateDataStateContext({ basicHtmlWidgetOpen: true });
  };

  handleClose = updateDataStateContext => {
    updateDataStateContext({
      basicHtmlWidgetOpen: false,
      selectedWidget: null
    });
  };

  render() {
    return (
      <DataConsumer>
        {({
          basicHtmlWidgetOpen,
          selectedBoard,
          updateDataStateContext,
          selectedWidget
        }) => {
          let widget = null;
          let widgetSplit = null;
          if (selectedWidget) {
            const { document } = selectedBoard;
            widgetSplit = selectedWidget.split('_');
            widget = document.widgets[widgetSplit[1]];
          }

          return (
            <Modal
              dimmer="inverted"
              closeIcon
              open={basicHtmlWidgetOpen}
              onUnmount={() =>
                updateDataStateContext({
                  selectedWidget: null
                })
              }
              onClose={() => this.handleClose(updateDataStateContext)}
              size="fullscreen"
              trigger={
                <Popup
                  basic
                  content="Create basic HTML widget"
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
                        <Icon name="image" />
                        <Icon corner="bottom right" name="add" />
                      </Icon.Group>
                    </Button>
                  }
                />
              }
            >
              <Modal.Header id="basic-create-title">HTML Widget</Modal.Header>

              <Modal.Content>
                <BasicHTMLModalBody
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
