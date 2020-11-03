import React from 'react';
import MenuBar from './components/navigation/menu-bar';
import ChartGrid from './components/chart-grid';
import { DataProvider } from './context/data';
import { AutoSizer, PlatformStateContext, NerdletStateContext } from 'nr1';
import FilterBar from './components/filter-bar';
import TimeHandler from './components/time-handler';
import NerdletStateHandler from './components/nerdletstate-handler';

export default class OpenBoardsRoot extends React.PureComponent {
  render() {
    return (
      <DataProvider>
        <NerdletStateContext.Consumer>
          {nerdletState => {
            return <NerdletStateHandler nerdletState={nerdletState} />;
          }}
        </NerdletStateContext.Consumer>

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
