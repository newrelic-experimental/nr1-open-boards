import React from 'react';
import { Modal, Button, Form, TextArea, Label, Menu } from 'semantic-ui-react';
import { DataConsumer } from '../../../context/data';
import {
  writeUserDocument,
  writeAccountDocument,
  getAccountCollection,
  getUserCollection,
  deleteUserDocument,
  deleteAccountDocument
} from '../../../lib/utils';
import { buildBoardOptions } from '../../../context/utils';

function isValidJson(json) {
  try {
    JSON.parse(json);
    return true;
  } catch (e) {
    return false;
  }
}

export default class GeoMapsConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      menuItem: 'new',
      newGeoMapName: '',
      newGeoMapJson: 'Paste GeoMap json here...',
      selectedGeomap: null,
      geomapData: null
    };
  }

  addGeomap = async (updateDataStateContext, storageLocation, geomapData) => {
    const { newGeoMapName, newGeoMapJson, selectedGeomap } = this.state;

    let geomaps = [];

    const geomap = JSON.parse(geomapData || newGeoMapJson);
    const geomapName = geomapData ? selectedGeomap : newGeoMapName;

    switch (storageLocation.type) {
      case 'user': {
        await writeUserDocument('OpenBoardsGeoMaps', geomapName, geomap);
        geomaps = await getUserCollection('OpenBoardsGeoMaps');
        break;
      }
      case 'account': {
        await writeAccountDocument(
          storageLocation.value,
          'OpenBoardsGeoMaps',
          geomapName,
          geomap
        );
        geomaps = await getAccountCollection(
          storageLocation.value,
          'OpenBoardsGeoMaps'
        );
        break;
      }
    }

    await updateDataStateContext({
      geomaps: buildBoardOptions(geomaps)
    });

    this.setState({
      newGeoMapName: '',
      newGeoMapJson: '',
      menuItem: 'existing'
    });
  };

  deleteMap = async (updateDataStateContext, storageLocation) => {
    const { selectedGeomap } = this.state;

    let geomaps = [];

    switch (storageLocation.type) {
      case 'user': {
        await deleteUserDocument('OpenBoardsGeoMaps', selectedGeomap);
        geomaps = await getUserCollection('OpenBoardsGeoMaps');
        break;
      }
      case 'account': {
        await deleteAccountDocument(
          storageLocation.value,
          'OpenBoardsGeoMaps',
          selectedGeomap
        );
        geomaps = await getAccountCollection(
          storageLocation.value,
          'OpenBoardsGeoMaps'
        );
        break;
      }
    }

    await updateDataStateContext({
      geomaps: buildBoardOptions(geomaps)
    });

    this.setState({
      selectedGeomap: '',
      geomapData: ''
    });
  };

  render() {
    const {
      menuItem,
      newGeoMapJson,
      newGeoMapName,
      selectedGeomap,
      geomapData
    } = this.state;

    return (
      <DataConsumer>
        {({
          openGeoMaps,
          storageLocation,
          updateDataStateContext,
          storageOptions,
          geomaps
        }) => {
          const accounts = storageOptions.map(
            ({ label, ...keepAttrs }) => keepAttrs
          );
          accounts.shift();

          const geomapsClean = geomaps.map(g => {
            const geomap = { ...g };
            delete geomap.label;
            return geomap;
          });

          let geoMapError = false;
          const geoMapErrorContent = {
            content: '',
            pointing: 'above'
          };
          const existingGeomap = [...geomaps].filter(
            geomap =>
              geomap.id.replace(/\+/g, ' ') === newGeoMapName ||
              geomap.id === newGeoMapName
          );
          if (existingGeomap.length > 0) {
            geoMapErrorContent.content = 'This Geo Map name already exists';
            geoMapError = true;
          } else if (newGeoMapName.length === 0) {
            geoMapErrorContent.content = 'Please enter a name';
            geoMapError = true;
          } else {
            geoMapError = false;
          }

          return (
            <Modal
              dimmer="inverted"
              closeIcon
              open={openGeoMaps}
              onUnmount={() => updateDataStateContext({ closeCharts: false })}
              onMount={() => updateDataStateContext({ closeCharts: true })}
              onClose={() => updateDataStateContext({ openGeoMaps: false })}
              size="fullscreen"
            >
              <Modal.Header>Manage Geo Maps</Modal.Header>
              <Modal.Content>
                <Menu pointing secondary>
                  <Menu.Item
                    name="Add New"
                    active={this.state.menuItem === 'new'}
                    onClick={() => this.setState({ menuItem: 'new' })}
                  />
                  <Menu.Item
                    name="Modify Existing"
                    active={this.state.menuItem === 'existing'}
                    onClick={() => this.setState({ menuItem: 'existing' })}
                  />
                </Menu>

                <div style={{ display: menuItem === 'new' ? '' : 'none' }}>
                  <Form>
                    <Form.Input
                      error={geoMapError ? geoMapErrorContent : false}
                      fluid
                      value={newGeoMapName}
                      onChange={e =>
                        this.setState({ newGeoMapName: e.target.value })
                      }
                      placeholder="Enter GeoMap Name..."
                      color="red"
                    />
                    <Form.Field width="16">
                      <TextArea
                        name="importGeoMapJson"
                        style={{ width: '100%', height: '300px' }}
                        value={newGeoMapJson}
                        onChange={e =>
                          this.setState({ newGeoMapJson: e.target.value })
                        }
                        className="txtarea"
                      />
                      <Label
                        style={{
                          display: isValidJson(newGeoMapJson) ? 'none' : ''
                        }}
                        pointing
                        prompt
                      >
                        Please enter valid json.
                      </Label>
                    </Form.Field>
                    <Form.Button
                      icon="download"
                      disabled={
                        isValidJson(newGeoMapJson) === false || geoMapError
                      }
                      positive
                      content="Add Geo Map"
                      style={{ float: 'right' }}
                      onClick={() =>
                        this.addGeomap(updateDataStateContext, storageLocation)
                      }
                    />
                  </Form>
                  <br />
                  <br />
                </div>

                {menuItem === 'existing' ? (
                  <div>
                    <Form>
                      <Form.Select
                        options={geomapsClean}
                        value={selectedGeomap}
                        onChange={(e, d) => {
                          const geomapData = JSON.stringify(
                            geomaps.find(g => g.key === d.value).document
                          );
                          this.setState({
                            selectedGeomap: d.value,
                            geomapData
                          });
                        }}
                        placeholder="Select Geo Map..."
                      />
                      {selectedGeomap ? (
                        <>
                          <Form.Field width="16">
                            <TextArea
                              name="editGeoMapJson"
                              style={{ width: '100%', height: '300px' }}
                              value={geomapData}
                              onChange={e => {
                                this.setState({ geomapData: e.target.value });
                              }}
                              className="txtarea"
                            />
                            <Label
                              style={{
                                display: isValidJson(geomapData) ? 'none' : ''
                              }}
                              pointing
                              prompt
                            >
                              Please enter valid json.
                            </Label>
                          </Form.Field>

                          <div>
                            <Button
                              icon="close"
                              negative
                              content="Delete"
                              style={{ float: 'right' }}
                              onClick={() =>
                                this.deleteMap(
                                  updateDataStateContext,
                                  storageLocation
                                )
                              }
                            />

                            <Button
                              icon="check"
                              disabled={isValidJson(geomapData) === false}
                              positive
                              content="Update"
                              style={{ float: 'right' }}
                              onClick={() =>
                                this.addGeomap(
                                  updateDataStateContext,
                                  storageLocation,
                                  geomapData
                                )
                              }
                            />
                          </div>
                        </>
                      ) : (
                        ''
                      )}
                    </Form>
                    <br />
                    <br />
                  </div>
                ) : (
                  ''
                )}
              </Modal.Content>
            </Modal>
          );
        }}
      </DataConsumer>
    );
  }
}
