import React from 'react';
import { Button, Input } from 'semantic-ui-react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-tomorrow';
import { writeUserDocument, writeAccountDocument } from '../../../../lib/utils';
import { DataConsumer } from '../../../../context/data';

export default class BasicHTMLModalBody extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      value: '<div>\n     Hello World\n</div>',
      x: 0,
      y: 0,
      w: 7,
      h: 5
    };
  }

  componentDidMount() {
    document.getElementById('basic-create-title').click();

    if (this.props.widget) {
      const { widget } = this.props;
      this.setState({
        name: widget.name,
        value: widget.value,
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h
      });
    }
  }

  handleOpen = updateDataStateContext => {
    updateDataStateContext({ basicHtmlWidgetOpen: true });
  };

  handleClose = updateDataStateContext => {
    updateDataStateContext({
      basicHtmlWidgetOpen: false,
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
    const { name, value, x, y, w, h } = this.state;
    const widget = {
      name,
      value,
      x,
      y,
      w,
      h,
      type: 'html'
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
      case 'accounts': {
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

    const { name, value } = this.state;

    return (
      <DataConsumer>
        {({
          updateBoard,
          storageLocation,
          selectedBoard,
          updateDataStateContext
        }) => {
          // const title = widget ? 'Edit Widget' : 'Create Widget';

          return (
            <>
              <Input
                width="4"
                label="New name"
                value={name}
                onChange={(e, d) => this.setState({ name: d.value })}
              />
              <br /> <br />
              <AceEditor
                height="400px"
                width="100%"
                mode="html"
                theme="tomorrow"
                name="editorMain"
                editorProps={{ $blockScrolling: false }}
                fontFamily="monospace"
                fontSize={14}
                showGutter={false}
                value={value}
                onChange={d => this.setState({ value: d })}
                setOptions={{
                  enableBasicAutocompletion: true,
                  enableLiveAutocompletion: true
                }}
              />
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
