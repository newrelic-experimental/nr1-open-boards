import React from 'react';
import {
  Modal,
  Button,
  Form,
  Header,
  Radio,
  Popup,
  Icon,
  Checkbox
} from 'semantic-ui-react';
import {
  writeUserDocument,
  writeAccountDocument,
  getUserCollection,
  getAccountCollection
} from '../../lib/utils';
import { DataConsumer } from '../../context/data';
import Select from 'react-select';
import { buildBoardOptions } from '../../context/utils';

export default class CreateBoard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      boardName: '',
      boardConfig: {
        autoSize: true,
        width: 0,
        height: 0
      },
      storeLocation: '',
      selectedAccount: null,
      createOpen: false,
      boards: []
    };
  }

  handleOpen = () => this.setState({ createOpen: true, boardName: '' });
  handleClose = () => this.setState({ createOpen: false, boardName: '' });

  create = async updateDataStateContext => {
    const { storeLocation, selectedAccount, boardName, boardConfig } = this.state;
    let boards = [];
    let storageLocation = null;
    const selectedBoard = {
      key: boardName,
      label: boardName,
      value: boardName,
      type: storageLocation,
      document: boardConfig
    };

    switch (storeLocation) {
      case 'user': {
        await writeUserDocument('OpenBoards', boardName, boardConfig);
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
          selectedAccount.value,
          'OpenBoards',
          boardName,
          boardConfig
        );
        boards = await getAccountCollection(
          selectedAccount.value,
          'OpenBoards'
        );
        storageLocation = selectedAccount;
        break;
      }
    }

    await updateDataStateContext({
      boards: buildBoardOptions(boards),
      locked: false,
      storageLocation,
      selectedBoard
    });
    this.handleClose();
  };

  render() {
    const {
      boardName,
      selectedAccount,
      storeLocation,
      createOpen,
      boards,
      boardConfig
    } = this.state;

    return (
      <DataConsumer>
        {({ updateDataStateContext, storageOptions }) => {
          const existingBoard = boards.filter(
            b => b.id.replace(/\+/g, ' ') === boardName || b.id === boardName
          );

          let boardNameError = false;
          const boardNameErrorContent = { content: '', pointing: 'above' };

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
              open={createOpen}
              onUnmount={() => updateDataStateContext({ closeCharts: false })}
              onMount={() => updateDataStateContext({ closeCharts: true })}
              onClose={this.handleClose}
              size="small"
              trigger={
                <Popup
                  content="Create Board"
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
                        <Icon name="chart bar" />
                        <Icon corner="bottom right" name="add" />
                      </Icon.Group>
                    </Button>
                  }
                />
              }
            >
              <Modal.Header>Create Board</Modal.Header>
              <Modal.Content>
                <Form>
                  <Header>Storage Location</Header>
                  <Form.Group inline>
                    <Form.Field
                      control={Radio}
                      label="User (Personal)"
                      value="user"
                      checked={storeLocation === 'user'}
                      onChange={async () => {
                        const boards = await getUserCollection('OpenBoards');
                        this.setState({
                          storeLocation: 'user',
                          selectedAccount: null,
                          boards
                        });
                      }}
                    />

                    <Form.Field
                      control={Radio}
                      label="Account (shared)"
                      value="account"
                      checked={storeLocation === 'account'}
                      onChange={() =>
                        this.setState({ storeLocation: 'account' })
                      }
                    />

                    {storeLocation === 'account' ? (
                      <Form.Field width="8">
                        <div className="react-select-input-group">
                          <label>Account</label>
                          <Select
                            options={storageOptions.filter(
                              s => s.type !== 'user'
                            )}
                            onChange={async selectedAccount => {
                              const boards = await getAccountCollection(
                                selectedAccount.value
                              );
                              this.setState({ selectedAccount, boards });
                            }}
                            value={selectedAccount}
                            classNamePrefix="react-select"
                          />
                        </div>
                      </Form.Field>
                    ) : (
                      ''
                    )}
                  </Form.Group>

                  <Header>Name</Header>

                  <Form.Input
                    error={boardNameError ? boardNameErrorContent : false}
                    fluid
                    value={boardName}
                    onChange={e => this.setState({ boardName: e.target.value })}
                    placeholder="Name..."
                  />

                  <Header>Size</Header>
                  <Checkbox
                    label="Auto"
                    checked={boardConfig.autoSize}
                    onChange={(e => this.setState({ autoSize: !autoSize }))}
                  />
                  <Form.Group>
                    <Form.Input
                      disabled={boardConfig.autoSize}
                      label="Height (px)"
                      onChange={e => this.setState({ height: parseFloat(e.target.value)})}
                      type='number'
                      fluid
                      placeholder="Height..."
                      min={0}
                    />
                    <Form.Input
                      disabled={boardConfig.autoSize}
                      label="Width (px)"
                      onChange={e => this.setState({ width: parseFloat(e.target.value)})}
                      type='number'
                      fluid
                      placeholder="Width..."
                      min={0}
                    />
                  </Form.Group>

                </Form>
              </Modal.Content>
              <Modal.Actions>
                <Button
                  disabled={
                    boardNameError ||
                    (storeLocation === 'account' && !selectedAccount)
                  }
                  positive
                  onClick={() => this.create(updateDataStateContext)}
                >
                  Create
                </Button>
              </Modal.Actions>
            </Modal>
          );
        }}
      </DataConsumer>
    );
  }
}
