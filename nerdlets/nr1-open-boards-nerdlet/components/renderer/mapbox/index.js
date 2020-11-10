import React from 'react';
import { AutoSizer } from 'nr1';
import WidgetDropDown from './drop-down';
import { DataConsumer } from '../../../context/data';
import Map from './map';

export default class MapBox extends React.Component {
  render() {
    const { widget, i } = this.props;
    const hdrStyle = (widget || {}).headerStyle || {};

    return (
      <DataConsumer>
        {({ geomaps, updateDataStateContext, locked, filterClause }) => {
          const selectedGeomap = geomaps.find(g => g.key === widget.value);

          return (
            <div style={{ width: '100%', height: '100%' }}>
              <AutoSizer>
                {({ width, height }) => {
                  const headerHeight = hdrStyle.height
                    ? hdrStyle.height.replace(/\D/g, '')
                    : 30;

                  const maxWidgetHeight = height - headerHeight - 10;

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
                          <WidgetDropDown i={i} height={`${headerHeight}px`} />
                        </div>
                      </div>
                      <div
                        style={{
                          paddingLeft,
                          paddingRight,
                          paddingBottom
                        }}
                      >
                        <Map
                          filterClause={filterClause}
                          updateDataStateContext={updateDataStateContext}
                          locked={locked}
                          width={width}
                          maxWidgetHeight={maxWidgetHeight}
                          widget={widget}
                          selectedGeomap={selectedGeomap}
                        />
                      </div>
                    </div>
                  );
                }}
              </AutoSizer>
            </div>
          );
        }}
      </DataConsumer>
    );
  }
}
