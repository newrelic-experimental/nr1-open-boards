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

const semver = require('semver');

toast.configure();

const DataContext = React.createContext();

const collectionName = 'OpenBoards';
const userConfig = 'OpenBoardsUserConfig';
const iconCollection = 'ObservabilityIcons';

export class DataProvider extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userConfig: {},
      selectedBoard: null,
      boards: [],
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
      createNrqlWidgetOpen: false,
      basicHtmlWidgetOpen: false,
      entityHdvWidgetOpen: false,
      selectedWidget: null
    };
  }

  async componentDidMount() {
    // this.checkVersion();
    const userConfig = await getUserCollection(userConfig, 'main');
    await this.getBoards('user');
    const { accounts, storageOptions } = await this.getAccounts();

    this.setState({ userConfig, accounts, storageOptions }, () => {
      if (this.state.accounts.length === 0) {
        toast.error(
          'Unable to load accounts, please check your nerdpack uuid.',
          {
            autoClose: 10000,
            containerId: 'B'
          }
        );
      }
    });
  }

  componentDidCatch(err, errInfo) {
    this.setState({ hasError: true, err, errInfo });
  }

  getBoards = (type, accountId) => {
    const { storageLocation } = this.state;
    return new Promise(resolve => {
      switch (type) {
        case 'user': {
          getUserCollection(collectionName).then(value => {
            this.setState({ boards: buildBoardOptions(value) }, () =>
              resolve()
            );
          });
          break;
        }
        case 'account': {
          getAccountCollection(
            accountId || storageLocation.value,
            collectionName
          ).then(value => {
            this.setState({ boards: buildBoardOptions(value) }, () =>
              resolve()
            );
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
      'https://raw.githubusercontent.com/newrelic/nr1-open-boards/master/package.json'
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
                  'https://github.com/newrelic/nr1-open-boards/',
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
          getBoards: this.getBoards
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
