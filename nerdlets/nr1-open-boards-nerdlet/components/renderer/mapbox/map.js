import React from 'react';
import { Icon, Form } from 'semantic-ui-react';
import ReactMapGL, {
  NavigationControl,
  FlyToInterpolator,
  Source,
  Layer,
  Popup
} from 'react-map-gl';
import { docToGeoJson, entitySummaryQuery } from './utils';
import {
  clusterLayer,
  clusterCountLayer,
  unclusteredPointLayer
} from './layers';
import { Modal, NerdGraphQuery } from 'nr1';
import { chunk } from '../../../lib/helper';
import PopupContent from './popup-content';
import ModalContent from './modal-content';

const alertLevels = {
  UNCONFIGURED: 0,
  NOT_ALERTING: 1,
  WARNING: 2,
  CRITICAL: 3
};

const updateSeverity = (alertValue, geojson, featIndex) => {
  const alertSeverity = alertLevels[alertValue] || 0;
  if (alertSeverity > geojson.features[featIndex].properties.alertLevel) {
    geojson.features[featIndex].properties.alertLevel = alertSeverity;
    geojson.features[featIndex].properties.alertHighest = alertValue;
  }
};

export default class Map extends React.Component {
  constructor(props) {
    super(props);
    this.sourceRef = React.createRef();
    this.mapRef = React.createRef();

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
      // entityData: {},
      showPopup: true,
      popupData: {
        properties: {},
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

    this.setState(
      {
        viewport,
        previousViewport: viewport,
        rawGeomap: document,
        geojson: docToGeoJson(document),
        interval: ms
      },
      () => this.doInterval()
    );
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
        this.doInterval();
      });
    }
  };

  updateGeomap = selectedGeomap => {
    const document = (selectedGeomap || {}).document || {};
    const { rawGeomap } = this.state;
    if (JSON.stringify(rawGeomap) !== JSON.stringify(document)) {
      this.setState(
        { rawGeomap: document, geojson: docToGeoJson(document) },
        () => this.doInterval()
      );
    }
  };

  doInterval = () => {
    if (this.mapPoll) {
      clearInterval(this.mapPoll);
    }

    this.fetchData();

    this.mapPoll = setInterval(() => {
      this.fetchData();
    }, this.state.interval);
  };

  fetchData = () => {
    const { isFetching } = this.state;
    const geojson = { ...this.state.geojson, timestamp: new Date().getTime() };

    if (isFetching === false) {
      this.setState({ isFetching: true }, async () => {
        const guids = geojson.features
          .map(f => f.properties)
          .map(p => p.entities)
          .flat()
          .map(e => e.guid);

        const entityChunks = chunk([...new Set(guids)], 25);

        const entityPromises = entityChunks.map(chunk => {
          return new Promise(async resolve => {
            const guidsStr = `"${chunk.join(`","`)}"`;
            const nerdGraphResult = await NerdGraphQuery.query({
              query: entitySummaryQuery(guidsStr)
            });
            resolve(nerdGraphResult);
          });
        });

        // const entityData = {};
        await Promise.all(entityPromises).then(values => {
          values.forEach(v => {
            const entities =
              (((v || {}).data || {}).actor || {}).entities || [];
            entities.forEach(e => {
              // entityData[e.guid] = e;
              geojson.features.forEach((f, featIndex) => {
                if (
                  geojson.features[featIndex].properties.alertLevel ===
                  undefined
                ) {
                  geojson.features[featIndex].properties.alertLevel = 0;
                  geojson.features[featIndex].properties.alertHighest = 0;
                }

                (f.properties.entities || []).forEach((entity, entityIndex) => {
                  if (e.guid === entity.guid) {
                    updateSeverity(e.alertSeverity, geojson, featIndex);

                    (e.relationships || []).forEach(r => {
                      const alertValue =
                        (((r || {}).target || {}).entity || {}).alertSeverity ||
                        null;
                      updateSeverity(alertValue, geojson, featIndex);
                    });

                    geojson.features[featIndex].properties.entities[
                      entityIndex
                    ] = {
                      ...e,
                      ...entity
                    };
                  }
                });
              });
            });
          });
        });

        this.setState(
          {
            isFetching: false,
            geojson
          },
          // eslint-disable-next-line
          () => console.log('map decorated')
        );
      });
    } else {
      // eslint-disable-next-line
      console.log('map already fetching, waiting for next interval');
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

  mapClick = (map, isHover) => {
    const filteredFeatures = (map.features || []).filter(
      f => f.layer.id === 'unclustered-point'
    );

    if (filteredFeatures.length > 0) {
      const feat = filteredFeatures[0];
      if (feat.properties && feat.properties.location) {
        const key = `${feat.properties.index}:::${feat.properties.name}`;
        const { geojson } = this.state;
        const properties = geojson.features[feat.properties.index].properties;

        this.setState({
          searchValue: key,
          selectedLocation: feat.properties.index,
          showPopup: true,
          popupData: {
            properties,
            lat: parseFloat(properties.location.lat),
            lng: parseFloat(properties.location.lng)
          }
        });
      }
    } else {
      const stateUpdate = { feat: {}, lat: 0, lng: 0 };
      if (!isHover && !this.state.showPopup) {
        this.setState({ showPopup: false, ...stateUpdate });
      }
    }
  };

  updateState = state => {
    this.setState(state);
  };

  render() {
    const {
      selectedGeomap,
      widget,
      updateDataStateContext,
      locked,
      filterClause
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
          <ModalContent
            filter={filterClause}
            widget={widget}
            updateState={this.updateState}
            popupData={popupData}
          />
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
                      properties: {
                        ...geojson.features[keySplit[0]].properties
                      },
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
                      popupData: { properties: {}, lng: 0, lat: 0 }
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
          onHover={map => this.mapClick(map, true)}
          ref={this.mapRef}
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
              <PopupContent
                updateState={this.updateState}
                popupData={popupData}
              />
            </Popup>
          )}

          <Source
            type="geojson"
            data={geojson}
            cluster
            clusterMaxZoom={14}
            clusterRadius={50}
            ref={this.sourceRef}
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
