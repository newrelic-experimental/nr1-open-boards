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
import { writeUserDocument, writeAccountDocument } from '../../../lib/utils';
import { DataConsumer } from '../../../context/data';

const operators = [
  { key: '=', value: '=', text: '=' },
  { key: '!=', value: '!=', text: '!=' },
  { key: '>', value: '>', text: '>' },
  { key: '<', value: '<', text: '<' },
  { key: 'LIKE', value: 'LIKE', text: 'LIKE' },
  { key: 'NOT LIKE', value: 'NOT LIKE', text: 'NOT LIKE' },
  { key: 'RLIKE', value: 'RLIKE', text: 'RLIKE' },
  { key: 'NOT RLIKE', value: 'NOT RLIKE', text: 'NOT RLIKE' }
];

export default class ManageFilters extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filterOpen: false,
      filterName: '',
      filterDefault: '*',
      operator: null,
      // ignoreCase: true,
      filters: []
    };
  }

  componentDidMount() {
    if (this.props.filters) {
      this.setState({ filters: this.props.filters });
    }
  }

  handleOpen = () => this.setState({ filterOpen: true });

  handleClose = () => this.setState({ filterOpen: false });

  filterUpdate = async (selectedBoard, storageLocation, updateBoard) => {
    const { filters } = this.state;
    const { document } = selectedBoard;
    document.filters = filters;

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
    const { filters, filterName, filterDefault, operator } = this.state;
    const filterValue = { name: filterName, default: filterDefault };
    if (operator) {
      filterValue.operator = operator;
    }

    filters.push(filterValue);

    const { document } = selectedBoard;
    document.filters = filters;

    this.setState({ filterName: '', filterDefault: '*' }, () => {
      this.filterUpdate(selectedBoard, storageLocation, updateBoard);
    });
  };

  editFilter = (index, key, value) => {
    const { filters } = this.state;
    filters[index][key] = value;
    this.setState({ filters });
  };

  deleteFilter = (selectedBoard, storageLocation, updateBoard, index) => {
    const { filters } = this.state;
    filters.splice(index, 1);
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
            filters,
            filterOpen,
            filterName,
            filterDefault,
            operator
          } = this.state;

          return (
            <Modal
              dimmer="inverted"
              closeIcon
              open={filterOpen}
              onUnmount={() => updateDataStateContext({ closeCharts: false })}
              onMount={() => updateDataStateContext({ closeCharts: true })}
              onClose={this.handleClose}
              size="fullscreen"
              trigger={
                <Popup
                  basic
                  content="Manage Filters"
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
                        <Icon name="filter" />
                        <Icon corner="bottom right" name="add" />
                      </Icon.Group>
                    </Button>
                  }
                />
              }
            >
              <Modal.Header>Manage Filters</Modal.Header>
              <Modal.Content>
                <Message>
                  <Message.Header>
                    Filtering across different event types with mismatched
                    attribute names
                  </Message.Header>
                  If you have events that have different attribute naming that
                  you need to query and filter across eg. Transaction &
                  SystemSample which have host and hostname respectively. You
                  may use multiple attributes in the attribute name field by
                  comma separating them eg. "host,hostname".
                </Message>
                <Form>
                  <Form.Group>
                    <Form.Input
                      width="6"
                      label="Attribute name"
                      value={filterName}
                      onChange={(e, d) =>
                        this.setState({ filterName: d.value })
                      }
                    />

                    <Form.Select
                      width="3"
                      label="Operator"
                      options={operators}
                      value={operator}
                      onChange={(e, d) => this.setState({ operator: d.value })}
                    />
                    <Form.Input
                      width="3"
                      label="Default value"
                      value={filterDefault}
                      onChange={(e, d) =>
                        this.setState({ filterDefault: d.value })
                      }
                    />

                    <Form.Button
                      width="2"
                      label="&nbsp;"
                      disabled={!filterName || !filterDefault}
                      content="Add"
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
                {filters.length === 0 ? 'No filters defined.' : ''}
                {filters.map((f, i) => {
                  return (
                    <div key={i}>
                      <Form>
                        <Form.Group>
                          <Form.Input
                            width="6"
                            label="Name"
                            value={f.name}
                            onChange={(e, d) =>
                              this.editFilter(i, 'name', d.value)
                            }
                          />
                          <Form.Select
                            width="3"
                            label="Operator"
                            value={f.operator}
                            options={operators}
                            onChange={(e, d) =>
                              this.editFilter(i, 'operator', d.value)
                            }
                          />
                          <Form.Input
                            width="3"
                            label="Default"
                            value={f.default}
                            onChange={(e, d) =>
                              this.editFilter(i, 'default', d.value)
                            }
                          />

                          <Form.Button
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
