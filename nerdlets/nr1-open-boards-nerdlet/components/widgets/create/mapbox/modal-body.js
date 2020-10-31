import React from 'react';
import { Button, Divider, Message, Form } from 'semantic-ui-react';
import { writeUserDocument, writeAccountDocument } from '../../../../lib/utils';
import { DataConsumer } from '../../../../context/data';

export default class MapboxModalBody extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      value: `domain IN ('INFRA', 'APM')`,
      limit: 0,
      x: 0,
      y: 0,
      w: 7,
      h: 5
    };
  }

  componentDidMount() {
    document.getElementById('mapbox-create-title').click();

    if (this.props.widget) {
      const { widget } = this.props;
      this.setState({
        name: widget.name,
        value: widget.value,
        limit: widget.limit || 0,
        tagFilters: widget.tagFilters || [],
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h
      });
    }
  }

  handleOpen = updateDataStateContext => {
    updateDataStateContext({ entityHdvWidgetOpen: true });
  };

  handleClose = updateDataStateContext => {
    updateDataStateContext({
      entityHdvWidgetOpen: false,
      selectedWidget: null
    });
  };

  create = async (
    selectedBoard,
    storageLocation,
    updateBoard,
    updateDataStateContext,
    widgetNo
  ) => {
    const { name, value, limit, tagFilters, x, y, w, h } = this.state;
    const widget = {
      name,
      value,
      limit,
      tagFilters,
      x,
      y,
      w,
      h,
      type: 'entityhdv'
    };

    const { document } = selectedBoard;

    if (!document.widgets) {
      document.widgets = [];
    }

    if (widgetNo) {
      document.widgets[widgetNo] = { ...widget };
    } else {
      document.widgets.push(widget);
    }

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
    this.handleClose(updateDataStateContext);
  };

  render() {
    const { widget, widgetNo } = this.props;
    if (widget && this.state.selectedChart === null) {
      return 'Loading widget...';
    }

    const { name, value, limit, tagFilters } = this.state;

    const filterOptions = [
      { key: 'accountId', text: 'accountId', value: 'accountId' },
      { key: 'name', text: 'name', value: 'name' }
    ];

    return (
      <DataConsumer>
        {({
          updateBoard,
          storageLocation,
          selectedBoard,
          updateDataStateContext
        }) => {
          return (
            <>
              <Form>
                <Form.Group>
                  <Form.Input
                    width="8"
                    label="Widget name"
                    value={name}
                    onChange={(e, d) => this.setState({ name: d.value })}
                  />
                  <Form.Input
                    width="8"
                    label="Entity limit (0 for max)"
                    value={limit}
                    onChange={(e, d) =>
                      this.setState({
                        limit: Number.isInteger(parseInt(d.value)) ? d.value : 0
                      })
                    }
                  />
                </Form.Group>
                <Form.Input
                  width="16"
                  label="Entity search query"
                  value={value}
                  onChange={(e, d) => this.setState({ value: d.value })}
                />
                <Form.Dropdown
                  width="16"
                  label="Tag Filters"
                  placeholder="Tags"
                  selection
                  multiple
                  onChange={(e, d) => this.setState({ tagFilters: d.value })}
                  value={tagFilters}
                  options={filterOptions}
                />
              </Form>
              <Divider />
              <div>
                <Message>
                  Operators available: =, AND, IN, LIKE Entity queries use the
                  same syntax of a WHERE clause in NRQL queries. <br /> <br />
                  Examples:
                  <Message.List>
                    <Message.Item>name = 'MyApp (Staging)'</Message.Item>
                    <Message.Item>
                      name LIKE 'MyApp' AND type IN ('APPLICATION')
                    </Message.Item>
                    <Message.Item>
                      reporting = 'false' AND type IN ('HOST')
                    </Message.Item>
                    <Message.Item>domain IN ('INFRA', 'APM')</Message.Item>
                    <Message.Item>
                      domain IN ('APM') AND reporting = 'true' AND
                      tags.accountId IN ('1234567','8765432')
                    </Message.Item>
                  </Message.List>
                </Message>
              </div>
              <br />
              <br />
              <Button
                style={{ float: 'right' }}
                width="4"
                disabled={!name || !value}
                content={widget ? 'Update' : 'Create'}
                onClick={() =>
                  this.create(
                    selectedBoard,
                    storageLocation,
                    updateBoard,
                    updateDataStateContext,
                    widgetNo
                  )
                }
              />
              <br />
              <br />
            </>
          );
        }}
      </DataConsumer>
    );
  }
}
