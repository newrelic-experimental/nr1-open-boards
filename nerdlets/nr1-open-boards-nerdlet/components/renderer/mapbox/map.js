import React from 'react';
import { Button, Icon, Form } from 'semantic-ui-react';
import ReactMapGL, {
  NavigationControl,
  LinearInterpolator,
  FlyToInterpolator,
  Source,
  Layer,
  Popup
} from 'react-map-gl';
import { docToGeoJson } from './utils';
import {
  clusterLayer,
  clusterCountLayer,
  unclusteredPointLayer
} from './layers';
import { Modal, HeadingText, BlockText, LineChart, navigation } from 'nr1';

export default class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      interval: 30000,
      hidden: false,
      selectedLocation: null,
      searchValue: null,
      previousViewport: {},
      rawGeomap: {},
      geojson: {},
      viewport: {
        width: 400,
        height: 400,
        latitude: 36.2048,
        longitude: 138.2529,
        zoom: 8
      },
      entityData: {},
      showPopup: true,
      popupData: {
        feat: {},
        lat: 0,
        lng: 0
      },
      isFetching: false
    };
  }

  componentDidMount() {
    const { viewport } = this.state;
    const { selectedGeomap, widget, width, maxWidgetHeight } = this.props;
    const document = (selectedGeomap || {}).document || {};

    viewport.width = width - 14;
    viewport.height = maxWidgetHeight - 40;
    viewport.latitude = parseFloat(
      widget.latitude || document.latitude || 25.2744
    );
    viewport.longitude = parseFloat(
      widget.longitude || document.longitude || 133.7751
    );
    viewport.zoom = parseFloat(widget.zoom || document.zoom || 3);

    const ms = parseFloat(widget.ms || 30000);

    this.setState({
      viewport,
      previousViewport: viewport,
      rawGeomap: document,
      geojson: docToGeoJson(document),
      interval: ms
    });
  }

  componentDidUpdate() {
    const { width, maxWidgetHeight, selectedGeomap, widget } = this.props;
    this.updateSize(width, maxWidgetHeight);
    this.updateGeomap(selectedGeomap);
    this.updateInterval(widget);
  }

  componentWillUnmount() {
    if (this.mapPoll) {
      clearInterval(this.mapPoll);
    }
  }

  updateInterval = widget => {
    const ms = parseFloat(widget.ms || 30000);
    if (ms !== this.state.interval) {
      this.setState({ interval: ms }, () => {
        if (this.mapPoll) {
          clearInterval(this.mapPoll);
        }

        this.fetchData();

        this.mapPoll = setInterval(() => {
          this.fetchData();
        }, ms);
      });
    }
  };

  updateGeomap = selectedGeomap => {
    const document = (selectedGeomap || {}).document || {};
    const { rawGeomap } = this.state;
    if (JSON.stringify(rawGeomap) !== JSON.stringify(document)) {
      this.setState(
        { rawGeomap: document, geojson: docToGeoJson(document) },
        () => {
          if (this.mapPoll) {
            clearInterval(this.mapPoll);
          }

          this.fetchData();

          this.mapPoll = setInterval(() => {
            this.fetchData();
          }, this.state.interval);
        }
      );
    }
  };

  fetchData = () => {
    const { geojson, isFetching } = this.state;

    console.log('fetch data');

    if (isFetching === false) {
      this.setState({ isFetching: true }, () => {
        //
        console.log('fetching map data');
        this.setState({ isFetching: false });
      });
    } else {
      console.log('map already fetching');
    }
  };

  updateSize = (width, maxWidgetHeight) => {
    const { viewport } = this.state;
    const newViewPort = {
      ...viewport,
      width: width - 14,
      height: maxWidgetHeight - 40
    };

    if (JSON.stringify(viewport) !== JSON.stringify(newViewPort)) {
      this.setState({ viewport: newViewPort });
    }
  };

  moveViewPort = (lat, lng, zoom) => {
    const cViewPort = this.state.viewport;
    const viewport = {
      ...cViewPort,
      longitude: parseFloat(lng),
      latitude: parseFloat(lat),
      zoom: zoom || 14,
      transitionDuration: 5000,
      transitionInterpolator: new FlyToInterpolator()
    };

    this.setState({ viewport });
  };

  createMarkup = value => {
    return { __html: value };
  };

  getAlertStatus = item => {
    return 'blue';
  };

  renderIcon = item => {
    const alertStatus = this.getAlertStatus(item);

    if (item.icon) {
      return <Icon name={item.icon} color={alertStatus} />;
    }

    if (item.iconSet) {
      //
    }

    return <Icon name="map marker alternate" color={alertStatus} />;
  };

  mapClick = map => {
    console.log(map);
    const filteredFeatures = map.features.filter(
      f => f.layer.id === 'unclustered-point'
    );

    if (filteredFeatures.length > 0) {
      const feat = filteredFeatures[0];
      if (feat.properties && feat.properties.location) {
        const location = JSON.parse(feat.properties.location);
        const key = `${feat.properties.index}:::${feat.properties.name}`;

        this.setState({
          searchValue: key,
          selectedLocation: feat.properties.index,
          showPopup: true,
          popupData: {
            feat: feat.properties,
            lat: parseFloat(location.lat),
            lng: parseFloat(location.lng)
          }
        });
      }
    } else {
      this.setState({ showPopup: false, feat: {}, lat: 0, lng: 0 });
    }
  };

  render() {
    const {
      selectedGeomap,
      widget,
      updateDataStateContext,
      locked
    } = this.props;
    const document = (selectedGeomap || {}).document || {};
    const items = document.items || [];
    const searchItems = items.map((item, i) => {
      return {
        key: `${i}:::${item.title}`,
        value: `${i}:::${item.title}`,
        text: item.title
      };
    });

    const {
      viewport,
      previousViewport,
      selectedLocation,
      searchValue,
      geojson,
      showPopup,
      popupData
    } = this.state;

    return (
      <div
        onClick={() =>
          !locked ? updateDataStateContext({ locked: true }) : undefined
        }
      >
        <Modal
          hidden={!this.state.hidden}
          onClose={() => this.setState({ hidden: false })}
        >
          <div>
            <LineChart
              accountId={1}
              query="SELECT count(*) FROM Transaction TIMESERIES"
            />
            <HeadingText type={HeadingText.TYPE.HEADING_1}>Modal</HeadingText>
            <BlockText type={BlockText.TYPE.PARAGRAPH}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
              Dictumst quisque sagittis purus sit amet.
            </BlockText>
            <Button
              onClick={() => {
                this.setState({ hidden: false }, () => {
                  navigation.openStackedEntity(
                    'MjMzMDkzM3xOUjF8V09SS0xPQUR8MjU3MDk'
                  );
                });
              }}
            >
              Close
            </Button>
          </div>
        </Modal>

        <div style={{ paddingRight: '5px' }}>
          <Form>
            <Form.Group style={{ marginBottom: '3px', marginTop: '0px' }}>
              <Form.Dropdown
                width={12}
                placeholder="Search Location"
                fluid
                search
                selection
                value={searchValue}
                options={searchItems}
                onChange={(e, d) => {
                  const keySplit = d.value.split(':::');
                  const item = items[keySplit[0]];
                  const { location } = item;

                  this.setState({
                    selectedLocation: keySplit[0],
                    searchValue: d.value,
                    showPopup: true,
                    popupData: {
                      feat: item,
                      lat: parseFloat(location.lat),
                      lng: parseFloat(location.lng)
                    }
                  });

                  this.moveViewPort(location.lat, location.lng);
                }}
              />
              <Form.Button
                width={4}
                content="Reset"
                disabled={!selectedLocation}
                onClick={() =>
                  this.setState(
                    {
                      viewport: { ...previousViewport, zoom: 6 },
                      selectedLocation: null,
                      searchValue: null,
                      showPopup: false,
                      popupData: { feat: {}, lng: 0, lat: 0 }
                    },
                    () =>
                      this.moveViewPort(
                        previousViewport.latitude,
                        previousViewport.longitude,
                        6
                      )
                  )
                }
              />
            </Form.Group>
          </Form>
        </div>

        <ReactMapGL
          {...viewport}
          onViewportChange={viewport => this.setState({ viewport })}
          mapboxApiAccessToken={widget.apiToken}
          onClick={this.mapClick}
        >
          <div style={{ position: 'absolute', right: 0 }}>
            <NavigationControl />
          </div>

          {showPopup && (
            <Popup
              latitude={popupData.lat}
              longitude={popupData.lng}
              closeButton
              closeOnClick={false}
              onClose={() => this.setState({ showPopup: false })}
              anchor="top"
            >
              <div>
                You are here
                <Button onClick={() => this.setState({ hidden: true })}>
                  Open Modal
                </Button>
              </div>
            </Popup>
          )}

          <Source
            type="geojson"
            data={geojson}
            cluster
            clusterMaxZoom={14}
            clusterRadius={50}
            ref={this._sourceRef}
          >
            <Layer {...clusterLayer} />
            <Layer {...clusterCountLayer} />
            <Layer {...unclusteredPointLayer} />
          </Source>

          {/* {items.map((item, i) => {
            return (
              <Marker
                key={i}
                latitude={parseFloat(item.location.lat)}
                longitude={parseFloat(item.location.lng)}
              >
                <div>
                  <Popup content={item.title} trigger={this.renderIcon(item)} />
                </div>
              </Marker>
            );
          })} */}
        </ReactMapGL>
      </div>
    );
  }
}
