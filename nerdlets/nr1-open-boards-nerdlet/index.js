import React from 'react';
import MenuBar from './components/navigation/menu-bar';
import ChartGrid from './components/chart-grid';
import { DataProvider } from './context/data';
import { AutoSizer, PlatformStateContext } from 'nr1';
import FilterBar from './components/filter-bar';
import TimeHandler from './components/time-handler';

export default class OpenBoardsRoot extends React.PureComponent {
  render() {
    return (
      <DataProvider>
        <PlatformStateContext.Consumer>
          {platformState => {
            return <TimeHandler timeRange={platformState.timeRange} />;
          }}
        </PlatformStateContext.Consumer>

        <AutoSizer>
          {({ width, height }) => {
            return (
              <div id="openboards-root">
                <MenuBar />
                <FilterBar />
                <ChartGrid width={width} height={height} />
              </div>
            );
          }}
        </AutoSizer>
      </DataProvider>
    );
  }
}
