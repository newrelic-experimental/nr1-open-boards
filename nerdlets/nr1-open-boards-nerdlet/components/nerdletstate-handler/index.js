import React from 'react';
import { DataConsumer } from '../../context/data';
import { platform } from 'nr1';
// for whatever strange reason nr1 platformStatecontext always gets updates on drags
// because of this it continues causing unnecessary re-renders
// the timehandler component aims to alleviate that issue
export default class NerdletStateHandler extends React.PureComponent {
  handleUpdate = async (
    updateDataStateContext,
    urlStateChecked,
    props,
    boards,
    storageOptions,
    getBoards
  ) => {
    if (urlStateChecked === false) {
      const { nerdletState } = props;
      const { timeRange } = nerdletState;
      if (timeRange) {
        platform.setUrlState({ timeRange });
      }

      if (storageOptions.length > 0) {
        const { name, filters, storageLocation } = nerdletState;
        const stateUpdate = {};

        const selectedStorageLocation = storageOptions.find(
          s =>
            s.key ===
            (storageLocation && storageLocation.key
              ? storageLocation.key
              : 'User')
        );

        if (storageLocation && storageLocation.key) {
          const storeLocation = isNaN(storageLocation.key) ? 'user' : 'account';

          if (storeLocation === 'account') {
            boards = await getBoards('account', storageLocation.key);
            stateUpdate.boards = boards;
          }
        }

        const selectedBoard = boards.find(b => b.id === name);

        stateUpdate.storageLocation = selectedStorageLocation;
        stateUpdate.selectedBoard = selectedBoard;
        stateUpdate.filters = filters || {};

        updateDataStateContext({ urlStateChecked: true, ...stateUpdate });
      }
    }
  };

  render() {
    return (
      <DataConsumer>
        {({
          updateDataStateContext,
          urlStateChecked,
          boards,
          storageOptions,
          getBoards
        }) => {
          this.handleUpdate(
            updateDataStateContext,
            urlStateChecked,
            this.props,
            boards,
            storageOptions,
            getBoards
          );
          return '';
        }}
      </DataConsumer>
    );
  }
}
