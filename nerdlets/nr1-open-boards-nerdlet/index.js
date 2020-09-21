import React from 'react';
import MenuBar from './components/navigation/menu-bar';
import ChartGrid from './components/chart-grid';
import { DataProvider } from './context/data';
import { AutoSizer, NerdGraphMutation } from 'nr1';
import FilterBar from './components/filter-bar';
import gql from 'graphql-tag';

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
      <DataProvider>
        <AutoSizer>
          {({ width, height }) => (
            <div id="openboards-root">
              <MenuBar />
              <FilterBar />
              <ChartGrid width={width} height={height} />
            </div>
          )}
        </AutoSizer>
      </DataProvider>
    );
  }
}
