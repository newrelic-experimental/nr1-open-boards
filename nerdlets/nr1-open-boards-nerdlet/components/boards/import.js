import React from 'react';
import { Modal, Button, Form, TextArea, Label, Popup } from 'semantic-ui-react';
import {
  writeUserDocument,
  writeAccountDocument,
  getAccountCollection,
  getUserCollection
} from '../../lib/utils';
import { DataConsumer } from '../../context/data';
import { buildBoardOptions } from '../../context/utils';

function isValidJson(json) {
  try {
    JSON.parse(json);
    return true;
  } catch (e) {
    return false;
  }
}

export default class ImportBoard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      boardImport: 'Paste board config here!',
      boardName: '',
      importOpen: false
    };
  }

  handleOpen = () => this.setState({ importOpen: true });
  handleClose = () => this.setState({ importOpen: false });

  saveBoard = async (updateDataStateContext, storageLocation) => {
    const { boardName, boardImport } = this.state;

    let boards = [];
    const selectedBoard = {
      key: boardName,
      label: boardName,
      value: boardName,
      type: storageLocation,
      document: JSON.parse(boardImport)
    };

    switch (storageLocation.type) {
      case 'user': {
        await writeUserDocument(
          'OpenBoards',
          boardName,
          selectedBoard.document
        );
        boards = await getUserCollection('OpenBoards');
        storageLocation = {
          key: 'User',
          label: 'User (Personal)',
          value: 'user',
          type: 'user'
        };
        break;
      }
      case 'account': {
        await writeAccountDocument(
          storageLocation.value,
          'OpenBoards',
          boardName,
          selectedBoard.document
        );
        boards = await getAccountCollection(
          storageLocation.value,
          'OpenBoards'
        );
        break;
      }
    }

    await updateDataStateContext({
      boards: buildBoardOptions(boards),
      locked: false,
      selectedBoard
    });
    this.handleClose();
  };

  render() {
    const { boardImport, boardName, importOpen } = this.state;

    return (
      <DataConsumer>
        {({ updateDataStateContext, boards, storageLocation }) => {
          let boardNameError = false;
          const boardNameErrorContent = {
            content: '',
            pointing: 'above'
          };
          const existingBoard = [...boards].filter(
            board =>
              board.id.replace(/\+/g, ' ') === boardName ||
              board.id === boardName
          );
          if (existingBoard.length > 0) {
            boardNameErrorContent.content = 'This board name already exists';
            boardNameError = true;
          } else if (boardName.length === 0) {
            boardNameErrorContent.content = 'Please enter a board name';
            boardNameError = true;
          } else {
            boardNameError = false;
          }

          return (
            <Modal
              dimmer="inverted"
              closeIcon
              size="large"
              open={importOpen}
              onClose={this.handleClose}
              onUnmount={() => updateDataStateContext({ closeCharts: false })}
              onMount={() => updateDataStateContext({ closeCharts: true })}
              trigger={
                <Popup
                  content="Import"
                  trigger={
                    <Button
                      onClick={this.handleOpen}
                      icon="upload"
                      style={{ height: '45px' }}
                      className="filter-button"
                    />
                  }
                />
              }
            >
              <Modal.Header>Import Board</Modal.Header>
              <Modal.Content>
                <Form>
                  <Form.Input
                    error={boardNameError ? boardNameErrorContent : false}
                    fluid
                    value={boardName}
                    onChange={e => this.setState({ boardName: e.target.value })}
                    placeholder="Enter Board Name..."
                    color="red"
                  />
                </Form>
                <br />
                <br />
                <Form>
                  <Form.Field>
                    <TextArea
                      name="importBoardConfig"
                      style={{ width: '100%', height: '500px' }}
                      value={boardImport}
                      onChange={e =>
                        this.setState({ boardImport: e.target.value })
                      }
                      className="txtarea"
                    />
                    <Label
                      style={{
                        display: isValidJson(boardImport) ? 'none' : ''
                      }}
                      pointing
                      prompt
                    >
                      Please enter valid json board configuration
                    </Label>
                  </Form.Field>
                </Form>
                <br />
                <br />
                <Button
                  icon="download"
                  disabled={
                    isValidJson(boardImport) === false || boardNameError
                  }
                  positive
                  content="Add Board"
                  style={{ float: 'right' }}
                  onClick={() =>
                    this.saveBoard(updateDataStateContext, storageLocation)
                  }
                />
                <br /> <br />
              </Modal.Content>
            </Modal>
          );
        }}
      </DataConsumer>
    );
  }
}
