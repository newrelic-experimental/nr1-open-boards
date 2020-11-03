import React from 'react';
import { AutoSizer } from 'nr1';
import ReactMapGL, { Marker, NavigationControl } from 'react-map-gl';

export default class MapBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        width: 400,
        height: 400,
        latitude: 37.7577,
        longitude: -122.4376,
        zoom: 8
      }
    };
  }

  render() {
    const { widget, i } = this.props;
    const hdrStyle = (widget || {}).headerStyle || {};

    return (
      <div style={{ width: '100%', height: '100%' }}>
        <AutoSizer>
          {({ width, height }) => {
            const { viewport } = this.state;
            const headerHeight = hdrStyle.height
              ? hdrStyle.height.replace(/\D/g, '')
              : 30;

            const maxWidgetHeight = height - headerHeight - 10;
            viewport.width = width - 14;
            viewport.height = maxWidgetHeight;

            const paddingTop = '5px';
            const paddingLeft = '9px';
            const paddingRight = '5px';
            const paddingBottom = '5px';

            hdrStyle.fontSize = hdrStyle.fontSize || '14px';
            hdrStyle.fontWeight = hdrStyle.fontWeight || 'bold';
            // hdrStyle.fontFamily = hdrStyle.fontFamily || 'Fira Code';
            hdrStyle.paddingLeft = hdrStyle.paddingLeft || '9px';
            hdrStyle.paddingLeft = hdrStyle.paddingRight || '5px';
            hdrStyle.float = hdrStyle.float || 'left';
            hdrStyle.verticalAlign = hdrStyle.verticalAlign || 'middle';

            return (
              <div style={{ paddingTop }}>
                <div style={{ height: `${headerHeight}px` }}>
                  <div
                    style={{
                      ...hdrStyle
                    }}
                  >
                    {widget.name || 'some widget'}
                  </div>

                  <div
                    style={{
                      float: 'right',
                      maxHeight: `${headerHeight}px`
                    }}
                  >
                    {/* <WidgetDropDown i={i} height={`${headerHeight}px`} /> */}
                  </div>
                </div>
                <div
                  style={{
                    paddingLeft,
                    paddingRight,
                    paddingBottom
                  }}
                >
                  <ReactMapGL
                    {...viewport}
                    onViewportChange={viewport => this.setState({ viewport })}
                    mapboxApiAccessToken="pk.eyJ1Ijoia2F2OTEiLCJhIjoiY2tndTllZW5kMDBsZDJxdDAwaDNqN3ptaSJ9.q6MK6us3x59y0VRmrB-q6Q"
                  >
                    <div style={{ position: 'absolute', right: 0 }}>
                      <NavigationControl />
                    </div>

                    <Marker
                      latitude={37.78}
                      longitude={-122.41}
                      offsetLeft={-20}
                      offsetTop={-10}
                    >
                      <div>You are here</div>
                    </Marker>
                  </ReactMapGL>
                </div>
              </div>
            );
          }}
        </AutoSizer>
      </div>
    );
  }
}
