import React from 'react';
import { Button, Form, Dropdown, Icon } from 'semantic-ui-react';
import { writeUserDocument, writeAccountDocument } from '../../../../lib/utils';
import { DataConsumer } from '../../../../context/data';
import MapPreview from './map-preview';

const availableThemes = [
  'mapbox://styles/mapbox/basic-v9',
  'mapbox://styles/mapbox/streets-v10',
  'mapbox://styles/mapbox/satellite-v9',
  'mapbox://styles/mapbox/bright-v9',
  'mapbox://styles/mapbox/dark-v10',
  'mapbox://styles/mapbox/light-v10'
].sort((a,b) => (a < b ? -1 : (a > b ? 1 : 0)));

export default class MapboxModalBody extends React.PureComponent {
  constructor(props) {
    super(props);
    this.mapRef = React.createRef();

    this.state = {
      name: '',
      value: '',
      apiToken: 'pk.eyJ1IjoiamZ1Y2hzMTAiLCJhIjoiY2toMDVzYWVoMGNraTJ3cnNqa2cybHAwaCJ9.iB2LS1CChyFL4wjIi_gZ5g',
      mapStyle: '',
      defaultAccount: 0,
      latitude: 0,
      longitude: 0,
      ignoreFilters: null,
      zoom: 4,
      ms: 0,
      x: 0,
      y: 0,
      w: 7,
      h: 5,
      mapPreviewOpen: false
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
        mapStyle: widget.mapStyle || '',
        defaultAccount: widget.defaultAccount || 0,
        latitude: widget.latitude || 0,
        longitude: widget.longitude || 0,
        zoom: widget.zoom || 8,
        ignoreFilters: widget.ignoreFilters,
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

  updatePreviewViewport = ({ latitude, longitude, zoom }) => {
    this.setState({ 
      latitude: parseFloat(latitude.toFixed(5)),
      longitude: parseFloat(longitude.toFixed(5)),
      zoom: Math.floor(zoom)
    });
  }

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
      mapStyle,
      defaultAccount,
      latitude,
      longitude,
      ignoreFilters,
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
      mapStyle,
      defaultAccount,
      latitude,
      longitude,
      zoom,
      ignoreFilters,
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
      mapStyle,
      defaultAccount,
      latitude,
      longitude,
      zoom,
      ignoreFilters,
      mapPreviewOpen
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

          console.log({ accounts });

          const themes = availableThemes.map( text => ({text, key: text, value: text}));

          return (
            <>
              {mapPreviewOpen && (
                <MapPreview 
                  onClose={() => this.setState({ 
                    mapPreviewOpen: false,  
                    latitude: parseFloat(latitude.toFixed(5)),
                    longitude: parseFloat(longitude.toFixed(5)),
                    zoom: Math.floor(zoom)
                  })}
                  updateViewport={viewport => this.setState(viewport)}
                  latitude={latitude}
                  longitude={longitude}
                  zoom={zoom}
                  apiToken={apiToken}
                  mapStyle={mapStyle}
                  mapRef={this.mapRef}
                />
              )}
              <Form>
                <Form.Group>
                  <Form.Input
                    width="4"
                    label="Widget Name"
                    value={name}
                    onChange={(e, d) => this.setState({ name: d.value })}
                  />
                  <Form.Select
                    width="4"
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
                    width="4"
                    label="Refresh Interval (ms)"
                    value={ms}
                    onChange={(e, d) =>
                      this.setState({
                        ms: !isNaN(d.value) || d.value === '' ? d.value : 0
                      })
                    }
                  />
                  <Form.Field width="4">
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
                </Form.Group>
                <Form.Group>
                  <Form.Select
                    width="3"
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
                    width="9"
                    label="Mapbox API Token"
                    value={apiToken}
                    onChange={(e, d) => this.setState({ apiToken: d.value })}
                  />
                  <Form.Select
                    width="4"
                    options={themes}
                    value={mapStyle}
                    onChange={(e,d) => this.setState({ mapStyle: d.value })}
                    label="Map Theme"
                    placeholder="Default: mapbox://styles/mapbox/light-v10"
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
                  {(apiToken != '') && (
                    <div style={{ margin: 'auto'}}>
                      <label>&nbsp;</label>
                      <Icon style={{lineHeight: '1.25em'}} name="globe" size="big" link onClick={() => this.setState({ mapPreviewOpen: true })} />
                    </div>
                  )}
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
