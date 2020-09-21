/* eslint 
no-console: 0
*/
import React from 'react';
import Select from 'react-select';
import { DataConsumer } from '../../context/data';
import { getUserCollection, getAccountCollection } from '../../lib/utils';
import CreateBoard from '../boards/create';
import { buildBoardOptions } from '../../context/utils';
import DeleteBoard from '../boards/delete';
import ExportBoard from '../boards/export';
import CreateNrqlWidget from '../widgets/create/nrql';
import BasicHTMLWidget from '../widgets/create/basic-html';
import CreateEntityHdvWidget from '../widgets/create/entity-hdv';
import ManageFilters from '../filters';
import ManageStyles from '../styles';
import ManageHTMLWidgets from '../nrql-html-widgets';
import ImportBoard from '../boards/import';

export default class MenuBar extends React.PureComponent {
  changeLocation = async (storageLocation, updateDataStateContext) => {
    switch (storageLocation.type) {
      case 'user': {
        const boards = await getUserCollection('OpenBoards');
        await updateDataStateContext({
          boards: buildBoardOptions(boards),
          selectedBoard: null,
          storageLocation
        });
        break;
      }
      case 'account': {
        const boards = await getAccountCollection(
          storageLocation.value,
          'OpenBoards'
        );
        await updateDataStateContext({
          boards: buildBoardOptions(boards),
          selectedBoard: null,
          storageLocation
        });
        break;
      }
    }
  };

  render() {
    return (
      <DataConsumer>
        {({
          boards,
          selectedBoard,
          storageOptions,
          storageLocation,
          updateDataStateContext
        }) => {
          return (
            <div>
              <div className="utility-bar">
                <div className="react-select-input-group">
                  <label>Board Storage</label>
                  <Select
                    options={storageOptions}
                    onChange={s =>
                      this.changeLocation(s, updateDataStateContext)
                    }
                    value={storageLocation}
                    classNamePrefix="react-select"
                  />
                </div>
                <div className="react-select-input-group">
                  <label>Boards</label>
                  <Select
                    options={boards}
                    onChange={selectedBoard =>
                      updateDataStateContext({ selectedBoard })
                    }
                    value={selectedBoard}
                    classNamePrefix="react-select"
                  />
                </div>

                {selectedBoard ? <DeleteBoard /> : ''}

                <CreateBoard />

                <ImportBoard />

                {selectedBoard ? <ExportBoard /> : ''}

                <div className="flex-push" />

                {selectedBoard ? <BasicHTMLWidget /> : ''}

                {selectedBoard ? <CreateEntityHdvWidget /> : ''}

                {selectedBoard ? <CreateNrqlWidget /> : ''}

                {selectedBoard ? (
                  <ManageFilters
                    filters={selectedBoard.document.filters || []}
                  />
                ) : (
                  ''
                )}
                {selectedBoard ? (
                  <ManageHTMLWidgets
                    htmlWidgets={selectedBoard.document.htmlWidgets || []}
                  />
                ) : (
                  ''
                )}
                {selectedBoard ? (
                  <ManageStyles styles={selectedBoard.document.styles || []} />
                ) : (
                  ''
                )}
              </div>
            </div>
          );
        }}
      </DataConsumer>
    );
  }
}
