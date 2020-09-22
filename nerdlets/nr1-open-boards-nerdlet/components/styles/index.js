import React from 'react';
import { Modal, Icon, Button, Popup, Form, Divider } from 'semantic-ui-react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/theme-tomorrow';
import { writeUserDocument, writeAccountDocument } from '../../lib/utils';
import { DataConsumer } from '../../context/data';

export default class ManageStyles extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      styleOpen: false,
      className: '',
      classValue: `{\n\n}`,
      styles: []
    };
  }

  componentDidMount() {
    if (this.props.styles) {
      this.setState({ styles: this.props.styles });
    }
  }

  handleOpen = () => this.setState({ styleOpen: true });

  handleClose = () => this.setState({ styleOpen: false });

  filterUpdate = async (selectedBoard, storageLocation, updateBoard) => {
    const { styles } = this.state;
    const { document } = selectedBoard;
    document.styles = styles;

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
    const { styles, className, classValue } = this.state;
    const cssValue = { name: className, value: classValue };
    styles.push(cssValue);

    this.setState({ className: '', classValue: '{\n\n}' }, () => {
      this.filterUpdate(selectedBoard, storageLocation, updateBoard);
    });
  };

  editFilter = (index, key, value) => {
    const { styles } = this.state;
    styles[index][key] = value;
    this.setState({ styles });
  };

  deleteFilter = (selectedBoard, storageLocation, updateBoard, index) => {
    const { styles } = this.state;
    styles.splice(index, 1);
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
          const { styles, styleOpen, className, classValue } = this.state;

          return (
            <Modal
              dimmer="inverted"
              closeIcon
              open={styleOpen}
              onUnmount={() => updateDataStateContext({ closeCharts: false })}
              onMount={() => updateDataStateContext({ closeCharts: true })}
              onClose={this.handleClose}
              size="fullscreen"
              trigger={
                <Popup
                  basic
                  content="Manage Styles"
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
                        <Icon name="css3" />
                        <Icon corner="bottom right" name="add" />
                      </Icon.Group>
                    </Button>
                  }
                />
              }
            >
              <Modal.Header>Manage Styles</Modal.Header>

              <Modal.Content>
                <Form>
                  <Form.Group>
                    <Form.Input
                      width="4"
                      label="New class name"
                      value={className}
                      onChange={(e, d) => this.setState({ className: d.value })}
                    />

                    <Form.Field width="8">
                      <AceEditor
                        height="100px"
                        width="100%"
                        mode="css"
                        theme="tomorrow"
                        name="editorMain"
                        editorProps={{ $blockScrolling: false }}
                        fontFamily="monospace"
                        fontSize={14}
                        showGutter={false}
                        value={classValue}
                        onChange={d => this.setState({ classValue: d })}
                        setOptions={{
                          enableBasicAutocompletion: true,
                          enableLiveAutocompletion: true
                        }}
                      />
                    </Form.Field>

                    <Form.Button
                      width="4"
                      label="&nbsp;"
                      disabled={!className || !classValue}
                      content="Add Class"
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

                {styles.length === 0 ? 'No classes defined.' : ''}

                {styles.map((s, i) => {
                  return (
                    <div key={i}>
                      <Form>
                        <Form.Group>
                          <Form.Input
                            width="4"
                            label="Class name"
                            value={s.name}
                            onChange={(e, d) =>
                              this.editFilter(i, 'name', d.value)
                            }
                          />

                          <Form.Field width="8">
                            <AceEditor
                              height="75px"
                              width="100%"
                              mode="css"
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
