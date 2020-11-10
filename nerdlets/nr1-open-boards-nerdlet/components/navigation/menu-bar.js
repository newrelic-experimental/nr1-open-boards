/* eslint 
no-console: 0
*/
import React from 'react';
import Select from 'react-select';
import { DataConsumer } from '../../context/data';
import { getUserCollection, getAccountCollection } from '../../lib/utils';
import CreateBoard from '../boards/create';
import { buildBoardOptions } from '../../context/utils';
import LockBoard from '../boards/lock';
import DeleteBoard from '../boards/delete';
import ExportBoard from '../boards/export';
import CreateNrqlWidget from '../widgets/create/nrql';
import BasicHTMLWidget from '../widgets/create/basic-html';
import CreateEntityHdvWidget from '../widgets/create/entity-hdv';
import ManageEventStreams from '../configuration/event-streams';
import ManageFilters from '../configuration/filters';
import ManageStyles from '../configuration/styles';
import ManageHTMLWidgets from '../configuration/nrql-html-widgets';
import ImportBoard from '../boards/import';
import CreateEventTimelineWidget from '../widgets/create/event-timeline';
import CreateMapboxWidget from '../widgets/create/mapbox';
import ConfigSelector from './configuration-selector';
import GeoMapsConfig from '../configuration/geomaps';

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
                    isClearable
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

                {selectedBoard ? <LockBoard /> : ''}

                <div className="flex-push" />

                {selectedBoard ? (
                  <>
                    <CreateNrqlWidget />
                    <CreateEntityHdvWidget />
                    <CreateEventTimelineWidget />
                    <CreateMapboxWidget />

                    <ManageFilters
                      filters={selectedBoard.document.filters || []}
                    />
                    <ManageHTMLWidgets
                      htmlWidgets={selectedBoard.document.htmlWidgets || []}
                    />
                    <ManageStyles
                      styles={selectedBoard.document.styles || []}
                    />
                    <ManageEventStreams
                      eventStreams={selectedBoard.document.eventStreams || []}
                    />
                    <BasicHTMLWidget />

                    <GeoMapsConfig />

                    <ConfigSelector />
                  </>
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
