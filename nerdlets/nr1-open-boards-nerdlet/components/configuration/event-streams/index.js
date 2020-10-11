import React from 'react';
import {
  Modal,
  Icon,
  Button,
  Popup,
  Form,
  Divider,
  Dropdown,
  Select,
  Menu
} from 'semantic-ui-react';
import {
  writeUserDocument,
  writeAccountDocument,
  nrdbQuery
} from '../../../lib/utils';
import { DataConsumer } from '../../../context/data';
import 'ace-builds/src-noconflict/theme-tomorrow';
import AceEditor from 'react-ace';
import CustomNrqlMode from '../../../lib/customNrqlMode';
import { addCompleter } from 'ace-builds/src-noconflict/ext-language_tools';
import { nrqlCompleter } from '../../../lib/completers';

const types = [
  { key: 'NRQL', value: 'nrql', text: 'NRQL' },
  {
    key: 'entitySearch',
    value: 'entitySearch',
    text: 'Entity Search Query'
  }
];

// additional attributes need to be lowercase so it is DOM friendly
const presetEvents = [
  {
    key: 'App Alerts & Deploys',
    text: 'App Alerts & Deploys',
    value: `type IN ('APPLICATION')`,
    type: 'entitySearch',
    color: '',
    tag_filters: ['accountId', 'name']
  },
  {
    key: 'Kubernetes HPA',
    text: 'Kubernetes HPA',
    value:
      "FROM InfrastructureEvent SELECT * WHERE `event.involvedObject.kind` = 'HorizontalPodAutoscaler'",
    type: 'nrql',
    ignore_filters: 'false',
    color: 'blue'
  },
  {
    key: 'AWS Change Events',
    text: 'AWS Change Events',
    value:
      "SELECT * FROM InfrastructureEvent WHERE changedPath LIKE 'aws/health/%' AND changeType = 'added' ",
    ignore_filters: 'true',
    type: 'nrql',
    color: 'yellow'
  }
];

const buildFilterOptions = (filters, dbFilters) => {
  const options = [
    { key: 'accountId', text: 'accountId', value: 'accountId' },
    { key: 'name', text: 'name', value: 'name' }
  ];

  // // disabling temporarily
  //
  // for (let z = 0; z < dbFilters.length; z++) {
  //   const { name } = dbFilters[z];
  //   let value = dbFilters[z].default;
  //   const key = `filter_${name}`;
  //   if (key in filters) {
  //     value = filters[key];
  //   }

  //   const filterKeys = name.split(',');
  //   filterKeys.forEach(k => {
  //     options.push({ key: k, text: k, value: k, input_value: value });
  //   });
  // }

  return options;
};

export default class ManageEventStreams extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isFetchingKeysets: false,
      keysets: [],
      keysetEventLength: 0,
      keysetAccountsLength: 0,
      eventStreamOpen: false,
      streamName: '',
      streamQuery: '',
      type: 'nrql',
      eventStreams: [],
      selectedPreset: null,
      ignoreFilters: null,
      accounts: [],
      streamColor: '',
      tagFilters: '',
      menuItem: 'new',
      ms: ''
    };
  }

  componentDidMount() {
    if (this.props.eventStreams) {
      this.setState({ eventStreams: this.props.eventStreams });
    }
  }

  handleOpen = () => this.setState({ eventStreamOpen: true });

  handleClose = () => this.setState({ eventStreamOpen: false });

  fetchKeysets = (eventTypes, accounts) => {
    const {
      isFetchingKeysets,
      keysetEventLength,
      keysetAccountsLength
    } = this.state;
    if (
      isFetchingKeysets === false ||
      keysetEventLength !== eventTypes.length ||
      keysetAccountsLength !== accounts.length
    ) {
      this.setState(
        {
          isFetchingKeysets: true,
          keysetEventLength: eventTypes.length,
          keysetAccountsLength: accounts.length
        },
        async () => {
          const keysetPromises = [];
          accounts.forEach(a => {
            keysetPromises.push(
              nrdbQuery(a, `SELECT keyset() FROM ${eventTypes.join(',')}`)
            );
          });

          await Promise.all(keysetPromises).then(values => {
            const keysets = values.flat();
            this.setState({ keysets, isFetchingKeysets: false });
          });
        }
      );
    }
  };

  queryUpdate = async (selectedBoard, storageLocation, updateBoard) => {
    const { eventStreams } = this.state;
    const { document } = selectedBoard;
    document.eventStreams = eventStreams;

    // if events have been renamed, remove them from other widgets
    document.widgets.forEach((w, i) => {
      w.events.forEach((e, z) => {
        if (!e) {
          document.widgets[i].events.splice(z, 1);
        } else {
          let found = false;
          for (let x = 0; x < eventStreams.length; x++) {
            if (eventStreams[x].key === e) {
              found = true;
              break;
            }
          }
          if (!found) {
            document.widgets[i].events.splice(z, 1);
          }
        }
      });
    });

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

  addQuery = (selectedBoard, storageLocation, updateBoard) => {
    const {
      eventStreams,
      streamName,
      streamQuery,
      type,
      accounts,
      streamColor,
      ignoreFilters,
      tagFilters,
      ms
    } = this.state;
    const filterValue = {
      name: streamName,
      query: streamQuery,
      color: streamColor,
      type,
      accounts,
      ignoreFilters,
      tagFilters,
      ms
    };
    if (type === 'entitySearch') {
      delete filterValue.accounts;
    } else if (type === 'nrql') {
      delete filterValue.tagFilters;
    }

    eventStreams.push(filterValue);

    const { document } = selectedBoard;
    document.eventStreams = eventStreams;

    this.setState(
      {
        streamName: '',
        streamQuery: '',
        streamColor: '',
        accounts: [],
        type: 'nrql',
        ms: ''
      },
      () => {
        this.queryUpdate(selectedBoard, storageLocation, updateBoard);
      }
    );
  };

  editQuery = (index, key, value) => {
    const { eventStreams } = this.state;
    eventStreams[index][key] = value;
    if (key === 'entitySearch') {
      delete eventStreams[index].accounts;
    } else if (key === 'nrql') {
      eventStreams[index].accounts = [];
    }
    this.setState({ eventStreams });
  };

  deleteQuery = (selectedBoard, storageLocation, updateBoard, index) => {
    const { eventStreams } = this.state;
    eventStreams.splice(index, 1);
    this.queryUpdate(selectedBoard, storageLocation, updateBoard);
  };

  updateState = state => {
    this.setState(state);
  };

  selectPreset = d => {
    const { key, type, ignore_filters, tag_filters, color } = d.options.find(
      o => o.value === d.value
    );
    const updateState = {
      selectedPreset: d.value,
      type,
      streamName: key,
      ignoreFilters: ignore_filters,
      streamColor: color,
      streamQuery: d.value
    };
    if (type === 'entitySearch') {
      updateState.accounts = [];
      updateState.tagFilters = tag_filters;
    }
    this.setState(updateState);
  };

  render() {
    const {
      eventStreams,
      eventStreamOpen,
      streamName,
      streamQuery,
      type,
      keysets,
      selectedPreset,
      ignoreFilters,
      tagFilters,
      streamColor,
      menuItem,
      ms
    } = this.state;

    const customMode = new CustomNrqlMode();
    if (this.aceEditorMain) {
      this.aceEditorMain.editor.getSession().setMode(customMode);
    }

    let disableAdd = false;
    if (!streamName || !streamQuery || !type) disableAdd = true;
    if (type === 'nrql' && this.state.accounts.length === 0) disableAdd = true;
    const foundExistingName = eventStreams.find(
      e => e.name.toLowerCase() === streamName.toLowerCase()
    )
      ? true
      : false;
    if (foundExistingName) disableAdd = true;

    return (
      <DataConsumer>
        {({
          selectedBoard,
          storageLocation,
          updateBoard,
          updateDataStateContext,
          storageOptions,
          filters
        }) => {
          const accounts = storageOptions.map(
            ({ label, ...keepAttrs }) => keepAttrs
          );
          accounts.shift();

          const { document } = selectedBoard;
          const dbFilters = document.filters || [];
          const filterOptions = buildFilterOptions(filters, dbFilters);

          const editQuery = (key, value, sourceAccounts, index, iType) => {
            if (type === 'nrql' || iType === 'nrql') {
              // detect available event types
              let eventTypes = [];
              sourceAccounts.forEach(id => {
                accounts.forEach(a => {
                  if (id === a.value) {
                    eventTypes = [...eventTypes, ...a.events];
                  }
                });
              });
              eventTypes = [...new Set(eventTypes)];

              if (eventTypes.length > 0) {
                const selectedEventTypes = [];
                eventTypes.forEach(e => {
                  if (value.includes(e)) {
                    selectedEventTypes.push(e);
                  }
                });
                this.fetchKeysets(selectedEventTypes, sourceAccounts);
              }
              // ---

              addCompleter({
                getCompletions: (editor, session, pos, prefix, callback) => {
                  callback(
                    null,
                    nrqlCompleter(
                      editor,
                      session,
                      pos,
                      prefix,
                      eventTypes,
                      keysets
                    )
                  );
                }
              });
            }

            if (iType) {
              this.editQuery(index, key, value);
            } else {
              this.updateState({ [key]: value });
            }
          };

          return (
            <Modal
              dimmer="inverted"
              closeIcon
              open={eventStreamOpen}
              onUnmount={() => updateDataStateContext({ closeCharts: false })}
              onMount={() => updateDataStateContext({ closeCharts: true })}
              onClose={this.handleClose}
              size="fullscreen"
              trigger={
                <Popup
                  basic
                  content="Manage Event Streams"
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
                        <Icon name="barcode" />
                        <Icon corner="bottom right" name="add" />
                      </Icon.Group>
                    </Button>
                  }
                />
              }
            >
              <Modal.Header>Manage Event Streams</Modal.Header>
              <Modal.Content>
                <Menu pointing secondary>
                  <Menu.Item
                    name="Add New Event Stream"
                    active={this.state.menuItem === 'new'}
                    onClick={() => this.setState({ menuItem: 'new' })}
                  />
                  <Menu.Item
                    name="Modify Existing Event Streams"
                    active={this.state.menuItem === 'existing'}
                    onClick={() => this.setState({ menuItem: 'existing' })}
                  />
                </Menu>

                <Form style={{ display: menuItem === 'new' ? '' : 'none' }}>
                  <Form.Group>
                    <Form.Field width="16">
                      <label>Available presets</label>
                      <Select
                        label="Presets"
                        options={presetEvents}
                        onChange={(e, d) => this.selectPreset(d)}
                        value={selectedPreset}
                      />
                    </Form.Field>
                  </Form.Group>

                  <Divider />

                  <Form.Group>
                    <Form.Input
                      width="4"
                      label="Stream name"
                      value={streamName}
                      onChange={(e, d) =>
                        this.setState({ streamName: d.value })
                      }
                      error={foundExistingName ? 'Already exists' : null}
                    />
                    <Form.Field width="3">
                      <label>Type</label>
                      <Select
                        label="type"
                        options={types}
                        value={type}
                        onChange={(e, d) => {
                          this.setState({ type: d.value, accounts: [] });
                        }}
                      />
                    </Form.Field>
                    {type === 'nrql' ? (
                      <Form.Field width="5">
                        <label>Ignore Filters</label>
                        <Dropdown
                          placeholder="Default false"
                          selection
                          onChange={(e, d) =>
                            d.value === 'false'
                              ? this.setState({ ignoreFilters: '' })
                              : this.setState({ ignoreFilters: d.value })
                          }
                          value={ignoreFilters}
                          options={[
                            { key: 'false', value: 'false', text: 'false' },
                            { key: 'true', value: 'true', text: 'true' }
                          ]}
                        />
                      </Form.Field>
                    ) : (
                      ''
                    )}
                    {type === 'entitySearch' ? (
                      <Form.Field width="5">
                        <label>Tag Filters</label>
                        <Dropdown
                          placeholder="Tags"
                          selection
                          multiple
                          onChange={(e, d) =>
                            this.setState({ tagFilters: d.value })
                          }
                          value={tagFilters}
                          options={filterOptions}
                        />
                      </Form.Field>
                    ) : (
                      ''
                    )}
                    <Form.Input
                      width="2"
                      label="Poll (ms)"
                      value={ms}
                      onChange={(e, d) =>
                        this.setState({
                          ms:
                            Number.isInteger(parseInt(d.value)) ||
                            d.value === ''
                              ? d.value
                              : 0
                        })
                      }
                    />
                    <Form.Input
                      width="2"
                      label="Color"
                      value={streamColor}
                      onChange={(e, d) =>
                        this.setState({ streamColor: d.value })
                      }
                    />
                  </Form.Group>

                  {type === 'nrql' ? (
                    <Form.Group>
                      <Form.Field width="16">
                        <Dropdown
                          style={{
                            width: '100%'
                          }}
                          placeholder="Select accounts"
                          fluid
                          multiple
                          selection
                          disabled={this.state.type === 'entitySearch'}
                          onChange={(e, d) =>
                            this.setState({ accounts: d.value })
                          }
                          value={this.state.accounts}
                          options={accounts}
                        />
                      </Form.Field>
                    </Form.Group>
                  ) : (
                    ''
                  )}

                  <AceEditor
                    ref={c => {
                      this.aceEditorMain = c;
                    }}
                    height="50px"
                    width="100%"
                    mode="text"
                    theme="tomorrow"
                    name="editorMain"
                    editorProps={{ $blockScrolling: false }}
                    wrapEnabled
                    style={{ borderStyle: 'solid' }}
                    // maxLines={1}
                    fontFamily="monospace"
                    fontSize={15}
                    showGutter={false}
                    value={streamQuery}
                    onChange={str => {
                      editQuery('streamQuery', str, this.state.accounts);
                    }}
                    setOptions={{
                      enableBasicAutocompletion: true,
                      enableLiveAutocompletion: true
                    }}
                  />

                  <br />

                  <Button
                    style={{ float: 'right' }}
                    disabled={disableAdd}
                    content="Add"
                    icon="plus"
                    onClick={() =>
                      this.addQuery(selectedBoard, storageLocation, updateBoard)
                    }
                  />
                  <br />
                  <br />
                </Form>

                <div
                  style={{
                    display: menuItem === 'existing' ? '' : 'none'
                  }}
                >
                  {eventStreams.length === 0 ? 'No event streams defined.' : ''}
                  {eventStreams.map((f, i) => {
                    if (this[`aceEditor${i}`]) {
                      this[`aceEditor${i}`].editor
                        .getSession()
                        .setMode(customMode);
                    }

                    let disableAddEx = false;
                    if (!f.name || !f.query || !f.type) disableAddEx = true;
                    if (f.type === 'nrql' && f.accounts.length === 0)
                      disableAddEx = true;

                    const foundExistingNameEx =
                      eventStreams.filter(
                        e => e.name.toLowerCase() === f.name.toLowerCase()
                      ).length > 1
                        ? true
                        : false;

                    if (foundExistingNameEx) disableAddEx = true;

                    return (
                      <div key={i}>
                        <Form>
                          <Form.Group>
                            <Form.Input
                              width="4"
                              label="Stream name"
                              value={f.name}
                              onChange={(e, d) =>
                                this.editQuery(i, 'name', d.value)
                              }
                              error={
                                foundExistingNameEx ? 'Already exists' : null
                              }
                            />
                            <Form.Field width="3">
                              <label>Type</label>
                              <Select
                                label="type"
                                options={types}
                                value={f.type}
                                onChange={(e, d) => {
                                  this.editQuery(i, 'type', d.value);
                                  this.editQuery(i, 'accounts', []);
                                }}
                              />
                            </Form.Field>
                            {f.type === 'nrql' ? (
                              <Form.Field width="5">
                                <label>Ignore Filters</label>
                                <Dropdown
                                  placeholder="Default false"
                                  selection
                                  onChange={(e, d) =>
                                    d.value === 'false'
                                      ? this.editQuery(i, 'ignoreFilters', '')
                                      : this.editQuery(
                                          i,
                                          'ignoreFilters',
                                          d.value
                                        )
                                  }
                                  value={f.ignoreFilters}
                                  options={[
                                    {
                                      key: 'false',
                                      value: 'false',
                                      text: 'false'
                                    },
                                    {
                                      key: 'true',
                                      value: 'true',
                                      text: 'true'
                                    }
                                  ]}
                                />
                              </Form.Field>
                            ) : (
                              ''
                            )}
                            {f.type === 'entitySearch' ? (
                              <Form.Field width="5">
                                <label>Tag Filters</label>
                                <Dropdown
                                  placeholder="Tags"
                                  selection
                                  multiple
                                  onChange={(e, d) =>
                                    this.editQuery(i, 'tagFilters', d.value)
                                  }
                                  value={f.tagFilters}
                                  options={filterOptions}
                                />
                              </Form.Field>
                            ) : (
                              ''
                            )}
                            <Form.Input
                              width="2"
                              label="Poll (ms)"
                              value={f.ms}
                              onChange={(e, d) =>
                                this.editQuery(
                                  i,
                                  'ms',
                                  Number.isInteger(parseInt(d.value)) ||
                                    d.value === ''
                                    ? d.value
                                    : 0
                                )
                              }
                            />
                            <Form.Input
                              width="2"
                              label="Color"
                              value={f.color}
                              onChange={(e, d) =>
                                this.editQuery(i, 'color', d.value)
                              }
                            />
                          </Form.Group>

                          {f.type === 'nrql' ? (
                            <Form.Group>
                              <Form.Field width="16">
                                <Dropdown
                                  style={{
                                    width: '100%'
                                  }}
                                  placeholder="Select accounts"
                                  fluid
                                  multiple
                                  selection
                                  disabled={f.type === 'entitySearch'}
                                  onChange={(e, d) =>
                                    this.editQuery(i, 'accounts', d.value)
                                  }
                                  value={f.accounts}
                                  options={accounts}
                                />
                              </Form.Field>
                            </Form.Group>
                          ) : (
                            ''
                          )}

                          <AceEditor
                            ref={c => {
                              this[`aceEditor${i}`] = c;
                            }}
                            height="50px"
                            width="100%"
                            mode="text"
                            theme="tomorrow"
                            name={`editor${i}`}
                            editorProps={{ $blockScrolling: false }}
                            wrapEnabled
                            style={{ borderStyle: 'solid' }}
                            // maxLines={1}
                            fontFamily="monospace"
                            fontSize={15}
                            showGutter={false}
                            value={f.query}
                            onChange={str => {
                              editQuery(
                                'query',
                                str,
                                f.accounts || [],
                                i,
                                f.type
                              );
                            }}
                            setOptions={{
                              enableBasicAutocompletion: true,
                              enableLiveAutocompletion: true
                            }}
                          />

                          <br />

                          <Button
                            style={{ float: 'right' }}
                            content="Delete"
                            onClick={() =>
                              this.deleteQuery(
                                selectedBoard,
                                storageLocation,
                                updateBoard,
                                i
                              )
                            }
                          />
                          <Button
                            style={{ float: 'right' }}
                            content="Update"
                            disabled={disableAddEx}
                            onClick={() =>
                              this.queryUpdate(
                                selectedBoard,
                                storageLocation,
                                updateBoard
                              )
                            }
                          />
                          <br />
                          <br />
                        </Form>
                      </div>
                    );
                  })}
                </div>
              </Modal.Content>
            </Modal>
          );
        }}
      </DataConsumer>
    );
  }
}
