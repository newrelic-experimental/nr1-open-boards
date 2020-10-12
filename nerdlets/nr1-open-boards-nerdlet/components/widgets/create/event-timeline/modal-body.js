import React from 'react';
import { Button, Input, Dropdown } from 'semantic-ui-react';
import { writeUserDocument, writeAccountDocument } from '../../../../lib/utils';
import { DataConsumer } from '../../../../context/data';

export default class EventTimelineBody extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      value: [],
      limit: 0,
      x: 0,
      y: 0,
      w: 7,
      h: 5
    };
  }

  componentDidMount() {
    document.getElementById('eventtimeline-create-title').click();

    if (this.props.widget) {
      const { widget } = this.props;
      this.setState({
        name: widget.name,
        value: widget.value || [],
        limit: widget.limit || 0,
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h
      });
    }
  }

  handleOpen = updateDataStateContext => {
    updateDataStateContext({ eventTimelineWidgetOpen: true });
  };

  handleClose = updateDataStateContext => {
    updateDataStateContext({
      eventTimelineWidgetOpen: false,
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
    const { name, value, limit, x, y, w, h } = this.state;
    const widget = {
      name,
      value,
      limit,
      x,
      y,
      w,
      h,
      type: 'eventtimeline'
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

    const { name, value, limit } = this.state;

    return (
      <DataConsumer>
        {({
          updateBoard,
          storageLocation,
          selectedBoard,
          updateDataStateContext
        }) => {
          const { document } = selectedBoard;

          const eventStreamOptions = (document.eventStreams || []).map(e => ({
            key: e.name,
            text: e.name,
            value: e.name
          }));

          return (
            <>
              <Input
                width="100%"
                label="Widget name"
                value={name}
                onChange={(e, d) => this.setState({ name: d.value })}
              />
              <br /> <br />
              <Input
                width="100%"
                label="Event limit (0 for max)"
                value={limit}
                onChange={(e, d) =>
                  this.setState({
                    limit: Number.isInteger(parseInt(d.value)) ? d.value : 0
                  })
                }
              />
              <br /> <br />
              <Dropdown
                style={{
                  width: '100%'
                }}
                label="Select Event Streams"
                placeholder="Apply Event Streams"
                options={eventStreamOptions}
                multiple
                fluid
                selection
                value={value}
                onChange={(e, d) => this.setState({ value: d.value })}
              />
              <br />
              <br />
              <Button
                style={{ float: 'right' }}
                width="4"
                disabled={!name || value.length === 0}
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
