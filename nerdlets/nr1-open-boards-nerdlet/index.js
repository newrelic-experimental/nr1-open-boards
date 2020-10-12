import React from 'react';
import MenuBar from './components/navigation/menu-bar';
import ChartGrid from './components/chart-grid';
import { DataProvider } from './context/data';
import { AutoSizer, PlatformStateContext } from 'nr1';
import FilterBar from './components/filter-bar';
// import gql from 'graphql-tag';

export default class OpenBoardsRoot extends React.Component {
  // componentDidMount() {
  //   NerdGraphMutation.mutate({
  //     mutation: gql`
  //       mutation {
  //         nerdStorageVaultWriteSecret(
  //           name: "kav-test"
  //           scope: ACTOR
  //           scopeId: "testscope"
  //           value: "mySecretValue"
  //         ) {
  //           errors {
  //             message
  //           }
  //           status
  //         }
  //       }
  //     `
  //   }).then(value => console.log(value));
  // }

  render() {
    return (
      <PlatformStateContext.Consumer>
        {platformState => {
          const { timeRange } = platformState;

          return (
            <DataProvider>
              <AutoSizer>
                {({ width, height }) => (
                  <div id="openboards-root">
                    <MenuBar />
                    <FilterBar />
                    <ChartGrid
                      width={width}
                      height={height}
                      timeRange={timeRange}
                    />
                  </div>
                )}
              </AutoSizer>
            </DataProvider>
          );
        }}
      </PlatformStateContext.Consumer>
    );
  }
}
