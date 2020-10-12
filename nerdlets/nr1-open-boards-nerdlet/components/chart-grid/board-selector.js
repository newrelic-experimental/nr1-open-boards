import React from 'react';
import { DataConsumer } from '../../context/data';
import { Table, Input, Button } from 'semantic-ui-react';
import {
  deleteAccountDocument,
  deleteUserDocument,
  getAccountCollection,
  getUserCollection
} from '../../lib/utils';
import { buildBoardOptions } from '../../context/utils';

export default class BoardSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filterText: ''
    };
  }

  delete = async (selectedBoard, updateDataStateContext, storageLocation) => {
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
  };

  render() {
    const { filterText } = this.state;

    return (
      <DataConsumer>
        {({ boards, updateDataStateContext, storageLocation }) => {
          if (boards.length === 0) {
            return (
              <div
                style={{
                  textAlign: 'center'
                }}
              >
                <div style={{ marginTop: '15%' }}>
                  <h2>Select or create a new Open Board to begin!</h2>
                </div>
              </div>
            );
          } else {
            const openboards = !filterText
              ? boards
              : boards.filter(b =>
                  b.key.toLowerCase().includes(filterText.toLowerCase())
                );

            return (
              <div style={{ padding: '7px', paddingLeft: '16px' }}>
                <Table basic="very" celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>
                        <Input
                          id="search-boards"
                          style={{ width: '250px' }}
                          focus
                          // iconPosition="left"
                          placeholder="Search Open Boards..."
                          icon="search"
                          value={filterText}
                          onChange={e =>
                            this.setState({ filterText: e.target.value })
                          }
                        />
                      </Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {openboards.map((b, i) => {
                      return (
                        <Table.Row key={i}>
                          <Table.Cell>
                            <div
                              style={{
                                cursor: 'pointer',
                                float: 'left',
                                paddingTop: '5px'
                              }}
                              onClick={() =>
                                updateDataStateContext({ selectedBoard: b })
                              }
                            >
                              {b.key}
                            </div>
                            <div style={{ float: 'right' }}>
                              <Button
                                animated
                                color="red"
                                size="mini"
                                key={`${i}_${b.key}`}
                              >
                                <Button.Content visible>Delete</Button.Content>
                                <Button.Content
                                  hidden
                                  onClick={() =>
                                    this.delete(
                                      b,
                                      updateDataStateContext,
                                      storageLocation
                                    )
                                  }
                                >
                                  Sure?
                                </Button.Content>
                              </Button>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
              </div>
            );
          }
        }}
      </DataConsumer>
    );
  }
}
