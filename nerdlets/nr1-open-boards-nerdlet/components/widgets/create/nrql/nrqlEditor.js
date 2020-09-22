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

export default class NrqlEditor extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isFetchingKeysets: false,
      keysets: [],
      keysetEventLength: 0,
      keysetAccountsLength: 0
    };
  }

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

  render() {
    const { keysets } = this.state;
    const { i, sources, accounts, updateSources } = this.props;
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

    return (
      <div
        style={{
          paddingTop: '5px',
          paddingBottom: '5px'
        }}
      >
        <Form>
          <Form.Group inline style={{ marginBottom: '5px' }}>
            <Form.Field width="14">
              <Dropdown
                style={{ width: '100%' }}
                placeholder="Select accounts"
                fluid
                multiple
                selection
                onChange={(e, d) => edit('accounts', d.value)}
                value={source.accounts}
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

        <div
          className="App"
          style={{
            backgroundColor: 'white',
            paddingTop: '10px',
            display: source.accounts.length === 0 ? 'none' : ''
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
            value={source.nrqlQuery}
            onChange={str => edit('nrqlQuery', str, source.accounts)}
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
