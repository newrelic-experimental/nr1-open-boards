import React from 'react';
import { Button, Form } from 'semantic-ui-react';
import { writeUserDocument, writeAccountDocument } from '../../../../lib/utils';
import { DataConsumer } from '../../../../context/data';

export default class MapboxModalBody extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      value: '',
      apiToken: '',
      defaultAccount: 0,
      latitude: 0,
      longitude: 0,
      zoom: 8,
      ms: 0,
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
        ms: widget.ms || 0,
        apiToken: widget.apiToken || '',
        defaultAccount: widget.defaultAccount || 0,
        latitude: widget.latitude || 0,
        longitude: widget.longitude || 0,
        zoom: widget.zoom || 8,
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h
      });
    }
  }

  handleOpen = updateDataStateContext => {
    updateDataStateContext({ mapboxWidgetOpen: true });
  };

  handleClose = updateDataStateContext => {
    updateDataStateContext({
      mapboxWidgetOpen: false,
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
    const {
      name,
      value,
      ms,
      apiToken,
      defaultAccount,
      latitude,
      longitude,
      zoom,
      x,
      y,
      w,
      h
    } = this.state;
    const widget = {
      name,
      value,
      ms,
      apiToken,
      defaultAccount,
      latitude,
      longitude,
      zoom,
      x,
      y,
      w,
      h,
      type: 'mapbox'
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

    const {
      name,
      value,
      ms,
      apiToken,
      defaultAccount,
      latitude,
      longitude,
      zoom
    } = this.state;

    return (
      <DataConsumer>
        {({
          updateBoard,
          storageLocation,
          selectedBoard,
          updateDataStateContext,
          geomaps,
          storageOptions
        }) => {
          const geomapsClean = geomaps.map(g => {
            const geomap = { ...g };
            delete geomap.label;
            return geomap;
          });

          const accounts = storageOptions.map(
            ({ label, ...keepAttrs }) => keepAttrs
          );
          accounts.shift();

          return (
            <>
              <Form>
                <Form.Group>
                  <Form.Input
                    width="6"
                    label="Widget Name"
                    value={name}
                    onChange={(e, d) => this.setState({ name: d.value })}
                  />
                  <Form.Select
                    width="6"
                    options={geomapsClean}
                    value={value}
                    onChange={(e, d) =>
                      this.setState({
                        value: d.value
                      })
                    }
                    label="Select Geo Map"
                    placeholder=""
                  />
                  <Form.Input
                    width="6"
                    label="Refresh Interval (ms)"
                    value={ms}
                    onChange={(e, d) =>
                      this.setState({
                        ms: !isNaN(d.value) || d.value === '' ? d.value : 0
                      })
                    }
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Select
                    width="5"
                    options={accounts}
                    value={defaultAccount}
                    onChange={(e, d) =>
                      this.setState({
                        defaultAccount: d.value
                      })
                    }
                    label="Default Account"
                    placeholder=""
                  />
                  <Form.Input
                    width="11"
                    label="Mapbox API Token"
                    value={apiToken}
                    onChange={(e, d) => this.setState({ apiToken: d.value })}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Input
                    width="6"
                    label="Latitude"
                    value={latitude}
                    onChange={(e, d) =>
                      this.setState({
                        latitude:
                          !isNaN(d.value) || d.value === '' ? d.value : 0
                      })
                    }
                  />
                  <Form.Input
                    width="6"
                    label="Longitude"
                    value={longitude}
                    onChange={(e, d) =>
                      this.setState({
                        longitude:
                          !isNaN(d.value) || d.value === '' ? d.value : 0
                      })
                    }
                  />
                  <Form.Input
                    width="6"
                    label="Zoom"
                    value={zoom}
                    onChange={(e, d) =>
                      this.setState({
                        zoom: !isNaN(d.value) || d.value === '' ? d.value : 0
                      })
                    }
                  />
                </Form.Group>
              </Form>
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
