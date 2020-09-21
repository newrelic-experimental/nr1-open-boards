import React from 'react';
import { Modal, Button, Popup, Icon } from 'semantic-ui-react';
import {
  deleteAccountDocument,
  deleteUserDocument,
  getAccountCollection,
  getUserCollection
} from '../../lib/utils';
import { DataConsumer } from '../../context/data';
import { buildBoardOptions } from '../../context/utils';

export default class DeleteBoard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { deleteOpen: false };
  }

  handleOpen = () => this.setState({ deleteOpen: true });
  handleClose = () => this.setState({ deleteOpen: false });

  save = (selectedBoard, updateDataStateContext, storageLocation) => {
    this.setState({ deleteOpen: false }, async () => {
      switch (storageLocation.type) {
        case 'account': {
          deleteAccountDocument(
            storageLocation.value,
            'OpenBoards',
            selectedBoard.value
          );

          const boards = await getAccountCollection(
            storageLocation.value,
            'OpenBoards'
          );

          await updateDataStateContext({
            boards: buildBoardOptions(boards),
            selectedBoard: null
          });

          break;
        }
        case 'user':
          deleteUserDocument('OpenBoards', selectedBoard.value);

          const boards = await getUserCollection('OpenBoards');

          await updateDataStateContext({
            boards: buildBoardOptions(boards),
            selectedBoard: null
          });

          break;
      }
    });
  };

  render() {
    const { deleteOpen } = this.state;
    return (
      <DataConsumer>
        {({ selectedBoard, updateDataStateContext, storageLocation }) => {
          return (
            <Modal
              dimmer="inverted"
              onUnmount={() => updateDataStateContext({ closeCharts: false })}
              onMount={() => updateDataStateContext({ closeCharts: true })}
              onClose={this.handleClose}
              open={deleteOpen}
              size="tiny"
              trigger={
                <Popup
                  content="Delete Board"
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
                        <Icon name="chart bar" color="red" />
                        <Icon name="minus" color="red" corner="bottom right" />
                      </Icon.Group>
                    </Button>
                  }
                />
              }
            >
              <Modal.Header>Delete Board</Modal.Header>
              <Modal.Content>
                Are you sure you want to delete "{selectedBoard.label}" board?
              </Modal.Content>
              <Modal.Actions>
                <Button
                  style={{ float: 'left' }}
                  positive
                  onClick={this.handleClose}
                >
                  Don't Delete
                </Button>

                <Button
                  negative
                  onClick={() =>
                    this.save(
                      selectedBoard,
                      updateDataStateContext,
                      storageLocation
                    )
                  }
                >
                  Delete!
                </Button>
              </Modal.Actions>
            </Modal>
          );
        }}
      </DataConsumer>
    );
  }
}
