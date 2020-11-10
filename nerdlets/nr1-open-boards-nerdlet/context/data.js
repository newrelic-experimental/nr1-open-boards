/* eslint
no-console: 0,
no-async-promise-executor: 0,
no-func-assign: 0,
require-atomic-updates: 0,
no-unused-vars: 0
*/

import React, { Component } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import pkg from '../../../package.json';
import { buildStorageOptions, buildBoardOptions } from './utils';
import {
  getUserCollection,
  getAccountCollection,
  nerdGraphQuery
} from '../lib/utils';
import { nerdlet } from 'nr1';

const semver = require('semver');

toast.configure();

const DataContext = React.createContext();

const collectionName = 'OpenBoards';
const collectionGeoMaps = 'OpenBoardsGeoMaps';

const userConfig = 'OpenBoardsUserConfig';
const iconCollection = 'ObservabilityIcons';

export class DataProvider extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userConfig: {},
      selectedBoard: null,
      boards: [],
      geomaps: [],
      storeLocation: 'user',
      storageLocation: {
        key: 'User',
        label: 'User (Personal)',
        value: 'user',
        type: 'user'
      },
      storageOptions: [],
      accounts: [],
      filters: {},
      locked: true,
      createNrqlWidgetOpen: false,
      basicHtmlWidgetOpen: false,
      entityHdvWidgetOpen: false,
      selectedWidget: null,
      platform_begin_time: 0,
      platform_end_time: 0,
      platform_duration: 0,
      begin_time: 0,
      end_time: 0,
      timeRange: {},
      sinceClause: '',
      urlStateChecked: false,
      initialized: false,
      openFilters: false,
      openStyles: false,
      openEventStreams: false,
      openDynamicHTMLWidgets: false,
      openGeoMaps: false
    };
  }

  async componentDidMount() {
    this.checkVersion();
    const userConfig = await getUserCollection(userConfig, 'main');
    await this.getBoards('user');
    const { accounts, storageOptions } = await this.getAccounts();

    this.setState(
      { userConfig, accounts, storageOptions, initialized: true },
      () => {
        if (this.state.accounts.length === 0) {
          toast.error(
            'Unable to load accounts, please check your nerdpack uuid.',
            {
              autoClose: 10000,
              containerId: 'B'
            }
          );
        }
      }
    );
  }

  componentDidCatch(err, errInfo) {
    this.setState({ hasError: true, err, errInfo });
  }

  getBoards = (type, accountId) => {
    return new Promise(resolve => {
      this.getCollection(collectionName, type, accountId).then(value => {
        const boards = buildBoardOptions(value);
        this.setState({ boards }, () => {
          this.getGeoMaps(type, accountId);
          resolve(boards);
        });
      });
    });
  };

  getGeoMaps = (type, accountId) => {
    return new Promise(resolve => {
      this.getCollection(collectionGeoMaps, type, accountId).then(value => {
        const geomaps = buildBoardOptions(value);
        this.setState({ geomaps }, () => resolve(geomaps));
      });
    });
  };

  getCollection = (collection, type, accountId) => {
    const { storageLocation } = this.state;
    return new Promise(resolve => {
      switch (type) {
        case 'user': {
          getUserCollection(collection).then(value => {
            resolve(value);
          });
          break;
        }
        case 'account': {
          getAccountCollection(
            accountId || storageLocation.value,
            collection
          ).then(value => {
            resolve(value);
          });
          break;
        }
      }
    });
  };

  getAccounts = () => {
    return new Promise(resolve => {
      nerdGraphQuery(`{
        actor {
          accounts(scope: GLOBAL) {
            reportingEventTypes
            id
            name
          }
        }
      }`).then(result => {
        const accounts = result.actor.accounts || [];
        const storageOptions = buildStorageOptions(accounts);
        resolve({ accounts, storageOptions });
      });
    });
  };

  checkVersion = async () => {
    fetch(
      'https://raw.githubusercontent.com/newrelic-experimental/nr1-open-boards/master/package.json'
    )
      .then(response => {
        return response.json();
      })
      .then(repoPackage => {
        if (pkg.version === repoPackage.version) {
          console.log(`Running latest version: ${pkg.version}`);
        } else if (semver.lt(pkg.version, repoPackage.version)) {
          toast.warn(
            <a
              onClick={() =>
                window.open(
                  'https://github.com/newrelic-experimental/nr1-open-boards/',
                  '_blank'
                )
              }
            >{`New version available: ${repoPackage.version}`}</a>,
            {
              autoClose: 5000,
              containerId: 'C'
            }
          );
        }
      });
  };

  updateDataStateContext = (stateData, actions) => {
    return new Promise(resolve => {
      this.setState(stateData, () => {
        Object.keys(stateData).forEach(key => {
          if (key === 'selectedBoard') {
            nerdlet.setUrlState({
              name: stateData[key] ? stateData[key].id : null,
              filters: {}
            });
          } else if (key === 'storageLocation') {
            let storageLocation = null;
            if (stateData[key]) {
              storageLocation = {
                key: stateData[key].key
              };
            }
            nerdlet.setUrlState({
              storageLocation
            });
          }
        });
        resolve();
      });
    });
  };

  // updates the local state document for selected board
  updateBoard = doc => {
    return new Promise(resolve => {
      const { selectedBoard, boards } = this.state;
      selectedBoard.document = { ...doc };
      for (let z = 0; z < boards.length; z++) {
        if (boards[z].value === selectedBoard.value) {
          boards[z].document = { ...doc };
          break;
        }
      }

      this.setState(
        { boards: [...boards], selectedBoard: { ...selectedBoard } },
        () => resolve()
      );
    });
  };

  render() {
    const { children } = this.props;

    return (
      <DataContext.Provider
        value={{
          ...this.state,
          updateDataStateContext: this.updateDataStateContext,
          updateBoard: this.updateBoard,
          getBoards: this.getBoards,
          getGeoMaps: this.getGeoMaps
        }}
      >
        <ToastContainer
          enableMultiContainer
          containerId="B"
          position={toast.POSITION.TOP_RIGHT}
        />

        <ToastContainer
          enableMultiContainer
          containerId="C"
          position={toast.POSITION.BOTTOM_RIGHT}
        />

        {children}
      </DataContext.Provider>
    );
  }
}

export const DataConsumer = DataContext.Consumer;
