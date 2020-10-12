import React from 'react';
import { Modal, Icon, Button, Popup, Form, Divider } from 'semantic-ui-react';
import { writeUserDocument, writeAccountDocument } from '../../../lib/utils';
import { DataConsumer } from '../../../context/data';

export default class ManageTimelineWidgets extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      timelineOpen: false,
      timelineName: '',
      eventStreams: [],
      timelineWidgets: []
    };
  }

  componentDidMount() {
    if (this.props.timelineWidgets) {
      this.setState({ timelineWidgets: this.props.timelineWidgets });
    }
  }

  handleOpen = () => this.setState({ timelineOpen: true });

  handleClose = () => this.setState({ timelineOpen: false });

  filterUpdate = async (selectedBoard, storageLocation, updateBoard) => {
    const { timelineWidgets } = this.state;
    const { document } = selectedBoard;
    document.timelineWidgets = timelineWidgets;

    switch (storageLocation.type) {
      case 'user': {
        const result = await writeUserDocument(
          'OpenBoards',
          selectedBoard.value,
          document
        );
        if (result && result.data) {
          updateBoard(document);
        }
        break;
      }
      case 'account': {
        const result = await writeAccountDocument(
          storageLocation.value,
          'OpenBoards',
          selectedBoard.value,
          document
        );
        if (result && result.data) {
          updateBoard(document);
        }
        break;
      }
    }
  };

  addFilter = (selectedBoard, storageLocation, updateBoard) => {
    const { timelineWidgets, timelineName, eventStreams } = this.state;
    const timelineValue = { name: timelineName, value: eventStreams };
    timelineWidgets.push(timelineValue);

    this.setState(
      { timelineName: '', eventStreams: '<div>\n     Hello World\n</div>' },
      () => {
        this.filterUpdate(selectedBoard, storageLocation, updateBoard);
      }
    );
  };

  editFilter = (index, key, value) => {
    const { timelineWidgets } = this.state;
    timelineWidgets[index][key] = value;
    this.setState({ timelineWidgets });
  };

  deleteFilter = (selectedBoard, storageLocation, updateBoard, index) => {
    const { timelineWidgets } = this.state;
    timelineWidgets.splice(index, 1);
    this.filterUpdate(selectedBoard, storageLocation, updateBoard);
  };

  render() {
    return (
      <DataConsumer>
        {({
          selectedBoard,
          storageLocation,
          updateBoard,
          updateDataStateContext
        }) => {
          const {
            timelineWidgets,
            timelineOpen,
            timelineName,
            eventStreams
          } = this.state;

          return (
            <Modal
              dimmer="inverted"
              closeIcon
              open={timelineOpen}
              onUnmount={() => updateDataStateContext({ closeCharts: false })}
              onMount={() => updateDataStateContext({ closeCharts: true })}
              onClose={this.handleClose}
              size="fullscreen"
              trigger={
                <Popup
                  basic
                  content="Manage Event Timeline Widgets"
                  trigger={
                    <Button
                      onClick={this.handleOpen}
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
              <Modal.Header>Manage Event Timeline Widgets</Modal.Header>

              <Modal.Content>
                <Form>
                  <Form.Group>
                    <Form.Input
                      width="4"
                      label="New name"
                      value={timelineName}
                      onChange={(e, d) =>
                        this.setState({ timelineName: d.value })
                      }
                    />

                    <Form.Field width="8">
                      {/* <AceEditor
                        height="175px"
                        width="100%"
                        mode="html"
                        theme="tomorrow"
                        name="editorMain"
                        editorProps={{ $blockScrolling: false }}
                        fontFamily="monospace"
                        fontSize={14}
                        showGutter={false}
                        value={eventStreams}
                        onChange={d => this.setState({ eventStreams: d })}
                        setOptions={{
                          enableBasicAutocompletion: true,
                          enableLiveAutocompletion: true
                        }}
                      /> */}
                    </Form.Field>

                    <Form.Button
                      width="4"
                      label="&nbsp;"
                      disabled={!timelineName || !eventStreams}
                      content="Add Widget"
                      icon="plus"
                      onClick={() =>
                        this.addFilter(
                          selectedBoard,
                          storageLocation,
                          updateBoard
                        )
                      }
                    />
                  </Form.Group>
                </Form>

                <Divider />

                {timelineWidgets.length === 0 ? 'No widgets defined.' : ''}

                {timelineWidgets.map((s, i) => {
                  return (
                    <div key={i}>
                      <Form>
                        <Form.Group>
                          <Form.Input
                            width="4"
                            label="Name"
                            value={s.name}
                            onChange={(e, d) =>
                              this.editFilter(i, 'name', d.value)
                            }
                          />

                          <Form.Field width="8">
                            {/* <AceEditor
                              height="175px"
                              width="100%"
                              mode="html"
                              theme="tomorrow"
                              name={`aceEditorMain.${i}`}
                              editorProps={{ $blockScrolling: false }}
                              fontFamily="monospace"
                              fontSize={14}
                              showGutter={false}
                              value={s.value}
                              onChange={d => this.editFilter(i, 'value', d)}
                              setOptions={{
                                enableBasicAutocompletion: true,
                                enableLiveAutocompletion: true
                              }}
                            /> */}
                          </Form.Field>

                          <Form.Button
                            width="2"
                            label="&nbsp;"
                            content="Update"
                            onClick={() =>
                              this.filterUpdate(
                                selectedBoard,
                                storageLocation,
                                updateBoard
                              )
                            }
                          />
                          <Form.Button
                            width="2"
                            label="&nbsp;"
                            content="Delete"
                            onClick={() =>
                              this.deleteFilter(
                                selectedBoard,
                                storageLocation,
                                updateBoard,
                                i
                              )
                            }
                          />
                        </Form.Group>
                      </Form>
                    </div>
                  );
                })}
              </Modal.Content>
            </Modal>
          );
        }}
      </DataConsumer>
    );
  }
}
