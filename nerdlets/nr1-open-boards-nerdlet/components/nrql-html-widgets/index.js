import React from 'react';
import {
  Modal,
  Icon,
  Button,
  Popup,
  Form,
  Divider,
  Message
} from 'semantic-ui-react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-tomorrow';
import { writeUserDocument, writeAccountDocument } from '../../lib/utils';
import { DataConsumer } from '../../context/data';

const example = index => {
  switch (index) {
    case 0: {
      return '${ Q1:count }';
    }
    case 1: {
      return '${ Q1:1234567:count }';
    }
    case 2: {
      return "<div style=\"background-color: ${ Q1:123:count > 0 ? 'red' : 'orange' };\">";
    }
    case 3: {
      return '<div>Name: ${ ACCOUNT_NAME } <br/> ${ Q1:ACCOUNTS:count }</div>';
    }
    case 4: {
      return '<div>Name: ${ ACCOUNT_NAME } <br/> ${ ( Q1:ACCOUNTS:count ).toFixed(2) }</div>';
    }
  }
};

export default class ManageHTMLWidgets extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      htmlOpen: false,
      htmlName: '',
      htmlValue: `<div>\n     Hello World\n</div>`,
      htmlWidgets: []
    };
  }

  componentDidMount() {
    if (this.props.htmlWidgets) {
      this.setState({ htmlWidgets: this.props.htmlWidgets });
    }
  }

  handleOpen = () => this.setState({ htmlOpen: true });

  handleClose = () => this.setState({ htmlOpen: false });

  filterUpdate = async (selectedBoard, storageLocation, updateBoard) => {
    const { htmlWidgets } = this.state;
    const { document } = selectedBoard;
    document.htmlWidgets = htmlWidgets;

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
    const { htmlWidgets, htmlName, htmlValue } = this.state;
    const cssValue = { name: htmlName, value: htmlValue };
    htmlWidgets.push(cssValue);

    this.setState(
      { htmlName: '', htmlValue: '<div>\n     Hello World\n</div>' },
      () => {
        this.filterUpdate(selectedBoard, storageLocation, updateBoard);
      }
    );
  };

  editFilter = (index, key, value) => {
    const { htmlWidgets } = this.state;
    htmlWidgets[index][key] = value;
    this.setState({ htmlWidgets });
  };

  deleteFilter = (selectedBoard, storageLocation, updateBoard, index) => {
    const { htmlWidgets } = this.state;
    htmlWidgets.splice(index, 1);
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
          const { htmlWidgets, htmlOpen, htmlName, htmlValue } = this.state;

          return (
            <Modal
              dimmer="inverted"
              closeIcon
              open={htmlOpen}
              onUnmount={() => updateDataStateContext({ closeCharts: false })}
              onMount={() => updateDataStateContext({ closeCharts: true })}
              onClose={this.handleClose}
              size="fullscreen"
              trigger={
                <Popup
                  basic
                  content="Manage Dynamic HTML Widgets"
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
                        <Icon name="code" />
                        <Icon corner="bottom right" name="add" />
                      </Icon.Group>
                    </Button>
                  }
                />
              }
            >
              <Modal.Header>Manage HTML Widgets</Modal.Header>

              <Modal.Content>
                <Message>
                  Examples:
                  <Message.List>
                    <Message.Item>
                      Accessing the value from the first query and first
                      account: {example(0)}
                    </Message.Item>
                    <Message.Item>
                      Accessing the value from the first query and specific
                      account: {example(1)}
                    </Message.Item>
                    <Message.Item>
                      Using a javascript ternary operator to dynamically set
                      styling: {example(2)}
                    </Message.Item>
                    <Message.Item>
                      If multiple accounts have been queried dynamically loop
                      through them {example(3)}
                    </Message.Item>
                    <Message.Item>
                      Using javascript functions to transform values:
                      {example(4)}
                    </Message.Item>
                  </Message.List>
                </Message>

                <Form>
                  <Form.Group>
                    <Form.Input
                      width="4"
                      label="New name"
                      value={htmlName}
                      onChange={(e, d) => this.setState({ htmlName: d.value })}
                    />

                    <Form.Field width="8">
                      <AceEditor
                        height="175px"
                        width="100%"
                        mode="html"
                        theme="tomorrow"
                        name="editorMain"
                        editorProps={{ $blockScrolling: false }}
                        fontFamily="monospace"
                        fontSize={14}
                        showGutter={false}
                        value={htmlValue}
                        onChange={d => this.setState({ htmlValue: d })}
                        setOptions={{
                          enableBasicAutocompletion: true,
                          enableLiveAutocompletion: true
                        }}
                      />
                    </Form.Field>

                    <Form.Button
                      width="4"
                      label="&nbsp;"
                      disabled={!htmlName || !htmlValue}
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

                {htmlWidgets.length === 0 ? 'No widgets defined.' : ''}

                {htmlWidgets.map((s, i) => {
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
                            <AceEditor
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
                            />
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
