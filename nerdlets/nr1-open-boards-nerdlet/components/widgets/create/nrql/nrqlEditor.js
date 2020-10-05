/* eslint 
no-console: 0
*/
import React from 'react';
import { Form, Dropdown } from 'semantic-ui-react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/theme-tomorrow';
import CustomNrqlMode from '../../../../lib/customNrqlMode';
import { addCompleter } from 'ace-builds/src-noconflict/ext-language_tools';
import { nrqlCompleter } from '../../../../lib/completers';
import { nrdbQuery } from '../../../../lib/utils';

// additional attributes need to be lowercase so it is DOM friendly
const presetEvents = [
  {
    key: 'App Alerts & Deploys',
    text: 'App Alerts & Deploys',
    value: `name LIKE 'MyApp' AND type IN ('APPLICATION')`,
    mode: 'entitySearchQuery'
  },
  {
    key: 'Kubernetes HPA',
    text: 'Kubernetes HPA',
    value:
      "FROM InfrastructureEvent SELECT * WHERE `event.involvedObject.kind` = 'HorizontalPodAutoscaler' LIMIT MAX",
    mode: 'nrqlQuery'
  },
  {
    key: 'AWS Change Events',
    text: 'AWS Change Events',
    value:
      "SELECT * FROM InfrastructureEvent WHERE changedPath LIKE 'aws/health/%' AND changeType = 'added' LIMIT MAX",
    ignore_filters: 'true',
    mode: 'nrqlQuery'
  }
];

const modes = [
  { key: 'nrqlQuery', text: 'NRQL', value: 'nrqlQuery' },
  {
    key: 'entitySearchQuery',
    text: 'Entity Search Query',
    value: 'entitySearchQuery'
  }
];

export default class NrqlEditor extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isFetchingKeysets: false,
      keysets: [],
      keysetEventLength: 0,
      keysetAccountsLength: 0,
      mode: 'nrqlQuery',
      preset: ''
    };
  }

  componentDidMount() {
    this.handleModeUpdate(this.props);
  }

  componentDidUpdate() {
    this.handleModeUpdate(this.props);
  }

  handleModeUpdate = props => {
    const { i, sources } = props;
    const currentMode = this.state.mode;
    const source = sources[i];
    let mode = '';
    if ('nrqlQuery' in source) mode = 'nrqlQuery';
    if ('entitySearchQuery' in source) mode = 'entitySearchQuery';

    if (currentMode !== mode) {
      this.setState({ mode });
    }
  };

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

  updateState = state => {
    this.setState(state);
  };

  render() {
    const { keysets } = this.state;
    const { i, sources, accounts, updateSources, type } = this.props;
    const source = sources[i];

    const customMode = new CustomNrqlMode();
    if (this[`aceEditor${i}`]) {
      this[`aceEditor${i}`].editor.getSession().setMode(customMode);
    }

    const edit = (k, value, sourceAccounts) => {
      if (k === 'nrqlQuery') {
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
          this.fetchKeysets(selectedEventTypes, source.accounts);
        }
        // ---

        addCompleter({
          getCompletions: (editor, session, pos, prefix, callback) => {
            callback(
              null,
              nrqlCompleter(editor, session, pos, prefix, eventTypes, keysets)
            );
          }
        });
      }

      source[k] = value;
      sources[i] = source;
      updateSources(sources);
    };

    const deleteItem = () => {
      sources.splice(i, 1);
      updateSources(sources);
    };

    const handlePresetChange = d => {
      const { value } = d;
      const { key, mode, ignore_filters, color } = d.options.find(
        o => o.value === value
      );

      edit('name', key);

      if (mode === 'nrqlQuery') {
        delete source.entitySearchQuery;
        edit('nrqlQuery', value, source.accounts);
      } else if (mode === 'entitySearchQuery') {
        delete source.nrqlQuery;
        source.accounts = [];
        edit('entitySearchQuery', value, source.accounts);
      }

      if (ignore_filters === 'true') {
        edit('ignoreFilters', 'true');
      } else {
        edit('ignoreFilters', '');
      }

      if (color) edit('color', color);
    };

    const handleModeChange = (d, accounts) => {
      if (d.value === 'nrqlQuery') {
        delete source.entitySearchQuery;
        sources[i] = source;
        edit('nrqlQuery', 'FROM ', accounts);
      } else if (d.value === 'entitySearchQuery') {
        delete source.nrqlQuery;
        sources[i] = source;
        edit(
          'entitySearchQuery',
          `name LIKE 'MyApp' AND type IN ('APPLICATION')`
        );
      }
    };

    return (
      <div
        style={{
          paddingTop: '5px',
          paddingBottom: '5px'
        }}
      >
        <Form>
          <Form.Group
            inline
            style={{
              marginBottom: '5px'
            }}
          >
            <Form.Field width="14">
              <Dropdown
                style={{
                  width: '100%'
                }}
                placeholder="Select accounts"
                fluid
                multiple
                selection
                disabled={this.state.mode === 'entitySearchQuery'}
                onChange={(e, d) => edit('accounts', d.value)}
                value={source.accounts || []}
                options={accounts}
              />
            </Form.Field>
            <Form.Button
              width="2"
              content="Delete"
              icon="minus"
              floated="left"
              onClick={deleteItem}
              style={{ float: 'right' }}
            />
          </Form.Group>
        </Form>

        <br />

        {type === 'events' ? (
          <Form>
            <Form.Group>
              <Form.Field width="3">
                <label>Presets</label>
                <Dropdown
                  placeholder="Use a preset"
                  selection
                  onChange={(e, d) => {
                    this.setState({ preset: d.value }, () => {
                      handlePresetChange(d);
                    });
                  }}
                  options={presetEvents}
                  value={this.state.preset}
                />
              </Form.Field>
              <Form.Field width="3">
                <label>Mode</label>
                <Dropdown
                  placeholder="NRQL/EntitySearch"
                  selection
                  options={modes}
                  onChange={(e, d) =>
                    this.setState({ preset: '' }, () => {
                      handleModeChange(d, source.accounts);
                    })
                  }
                  value={this.state.mode}
                />
              </Form.Field>
              <Form.Input
                width="3"
                label="Name &nbsp;"
                value={source.name}
                onChange={e => edit('name', e.target.value)}
              />
              <Form.Field width="3">
                <label>Ignore Filters</label>
                <Dropdown
                  placeholder="Default false"
                  selection
                  onChange={(e, d) =>
                    d.value === 'false'
                      ? edit('ignoreFilters', '')
                      : edit('ignoreFilters', d.value)
                  }
                  value={source.ignoreFilters}
                  options={[
                    { key: 'false', value: 'false', text: 'false' },
                    { key: 'true', value: 'true', text: 'true' }
                  ]}
                />
              </Form.Field>
              <Form.Input
                width="2"
                label="Color &nbsp;"
                placeholder="Empty randomized"
                value={source.color}
                onChange={e => edit('color', e.target.value)}
              />
            </Form.Group>
          </Form>
        ) : (
          ''
        )}

        <div
          className="App"
          style={{
            backgroundColor: 'white',
            paddingTop: '10px',
            display:
              this.state.mode === 'nrqlQuery' &&
              (source.accounts || []).length === 0
                ? 'none'
                : ''
          }}
        >
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
            // maxLines={1}
            fontFamily="monospace"
            fontSize={14}
            showGutter={false}
            value={source[this.state.mode]}
            onChange={str => edit(this.state.mode, str, source.accounts)}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true
            }}
          />
        </div>
      </div>
    );
  }
}
