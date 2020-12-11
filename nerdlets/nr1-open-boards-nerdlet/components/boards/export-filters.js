import React from 'react';
import { Icon, Modal, Button, Popup } from 'semantic-ui-react';
import { DataConsumer } from '../../context/data';
import { buildFilterClause, buildTagFilterQuery } from '../../lib/utils';

export default class ExportFiltersBoard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      exportOpen: false
    };
  }

  handleOpen = () => this.setState({ exportOpen: true });
  handleClose = () => this.setState({ exportOpen: false });

  convertBoard = (accounts, document, filters) => {
    const withFilters = JSON.parse(JSON.stringify(document, null, 2));
    const dbFilters = withFilters.filters || [];
    const eventStreams = withFilters.eventStreams || [];
    const widgets = withFilters.widgets || [];
    const filterClause = buildFilterClause(filters, dbFilters);
    const accountIds = accounts.map(account => account.id);

    eventStreams.forEach(stream => {
      if (stream.type === 'nrql') {
        stream.query = `${stream.query} ${
          // TODO: Find out why this is stored as a string
          stream.ignoreFilters === 'true' ? '' : filterClause
        }`;
      } else if (stream.type === 'entitySearch') {
        stream.query = `${stream.query} ${buildTagFilterQuery(
          stream.tagFilters,
          accountIds,
          filters,
          dbFilters
        )}`;
      }
      // TODO: Add Graphql stream types
    });
    widgets.forEach(widget => {
      if (widget.type === 'nrql') {
        widget.sources.forEach(source => {
          source.nrqlQuery = `${source.nrqlQuery} ${filterClause}`;
        });
      } else if (widget.type === 'entityhdv') {
        widget.value = `${widget.value} ${buildTagFilterQuery(
          widget.tagFilters || [],
          accountIds,
          filters,
          dbFilters
        )}`;
      }
    });

    withFilters.filters = [];
    withFilters.permalocked = false;

    return JSON.stringify(withFilters, null, 2);
  };

  render() {
    const { exportOpen } = this.state;
    return (
      <DataConsumer>
        {({ accounts, updateDataStateContext, selectedBoard, filters }) => (
          <Modal
            dimmer="inverted"
            closeIcon
            size="large"
            open={exportOpen}
            onClose={this.handleClose}
            onUnmount={() => updateDataStateContext({ closeCharts: false })}
            onMount={() => updateDataStateContext({ closeCharts: true })}
            trigger={
              <Popup
                content="Export With Filters Applied"
                trigger={
                  <Button
                    onClick={this.handleOpen}
                    style={{ height: '45px' }}
                    className="filter-button"
                  >
                    <Icon.Group
                      style={{
                        marginTop: '8px',
                        marginLeft: '8px',
                        marginRight: '-4px'
                      }}
                    >
                      <Icon name="download" />
                      <Icon corner="bottom right" name="filter" />
                    </Icon.Group>
                  </Button>
                }
              />
            }
          >
            <Modal.Header>
              Export Board With Current Filters Applied - {selectedBoard.label}
            </Modal.Header>
            <Modal.Content>
              <textarea
                readOnly
                name="exportBoardConfigWithFilter"
                style={{ width: '100%', height: '500px' }}
                value={this.convertBoard(
                  accounts,
                  selectedBoard.document,
                  filters
                )}
              />
            </Modal.Content>
          </Modal>
        )}
      </DataConsumer>
    );
  }
}
