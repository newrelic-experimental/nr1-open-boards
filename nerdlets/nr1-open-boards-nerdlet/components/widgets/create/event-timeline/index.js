import React from 'react';
import { Modal, Button, Popup, Icon } from 'semantic-ui-react';
import { DataConsumer } from '../../../../context/data';
import EventTimelineBody from './modal-body';

export default class CreateEventTimelineWidget extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  handleOpen = updateDataStateContext => {
    updateDataStateContext({ eventTimelineWidgetOpen: true });
  };

  handleClose = updateDataStateContext => {
    updateDataStateContext({
      eventTimelineWidgetOpen: false,
      selectedWidget: null
    });
  };

  render() {
    const { selectedChart } = this.state;

    return (
      <DataConsumer>
        {({
          eventTimelineWidgetOpen,
          updateDataStateContext,
          selectedBoard,
          selectedWidget
        }) => {
          const title = selectedWidget
            ? 'Edit Event Timeline Widget'
            : 'Create Event Timeline Widget';

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
              open={eventTimelineWidgetOpen}
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
                        <Icon name="tasks" />
                        <Icon corner="bottom right" name="add" />
                      </Icon.Group>
                    </Button>
                  }
                />
              }
            >
              <Modal.Header id="eventtimeline-create-title">
                Event Timeline Widget
              </Modal.Header>

              <Modal.Content>
                <EventTimelineBody
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
