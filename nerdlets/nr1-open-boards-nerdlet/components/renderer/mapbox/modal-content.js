import React from 'react';
import { Breadcrumb, Divider, Menu, Icon } from 'semantic-ui-react';
import { LineChart, HeadingText } from 'nr1';
import { DataConsumer } from '../../../context/data';
import EntityTable from './entity-table';
import MetadataTable from './metadata-table';
import RecentViolations from './recent-violations';

export default class ModalContent extends React.Component {
  state = { activeItem: 'Entity Summary' };

  handleItemClick = (e, { name }) => this.setState({ activeItem: name });

  render() {
    const { activeItem } = this.state;
    const { popupData, updateState, widget, filterClause } = this.props;
    const { properties } = popupData;

    if (properties) {
      const { alertHighest, query } = properties;
      let alertColor = 'grey';

      switch (alertHighest) {
        case 'NOT_ALERTING': {
          alertColor = 'green';
          break;
        }
        case 'WARNING': {
          alertColor = 'orange';
          break;
        }
        case 'CRITICAL': {
          alertColor = 'red';
          break;
        }
      }

      const { country, region, municipality } = properties.location || {};

      // const chartQuery = (properties || {}).query.includes('TIMESERIES')
      //   ? properties.query
      //   : `${properties.query} TIMESERIES`;

      const chartQuery =
        !query || query.toUpperCase().includes('TIMESERIES')
          ? query
          : `${query} TIMESERIES`;

      return (
        <DataConsumer>
          {({ storageLocation }) => {
            let accountId = 0;
            const ignoreFilters =
              widget.ignoreFilters !== undefined ? widget.ignoreFilters : true;

            if (properties.queryAccountId) {
              accountId = properties.queryAccountId;
            } else if (widget.defaultAccount) {
              accountId = widget.defaultAccount;
            } else if (storageLocation.value && !isNaN(storageLocation.value)) {
              accountId = storageLocation.value;
            }

            return (
              <div>
                <div>
                  <Breadcrumb size="large">
                    {country ? (
                      <>
                        <Breadcrumb.Section>{country}</Breadcrumb.Section>
                      </>
                    ) : (
                      ''
                    )}
                    {region ? (
                      <>
                        <Breadcrumb.Divider icon="right chevron" />
                        <Breadcrumb.Section>{region}</Breadcrumb.Section>
                      </>
                    ) : (
                      ''
                    )}
                    {municipality ? (
                      <>
                        <Breadcrumb.Divider icon="right chevron" />
                        <Breadcrumb.Section>{municipality}</Breadcrumb.Section>
                      </>
                    ) : (
                      ''
                    )}
                  </Breadcrumb>
                  <Divider hidden />

                  <HeadingText type={HeadingText.TYPE.HEADING_3}>
                    <Icon color={alertColor} name="circle" /> &nbsp;
                    {properties.title}
                  </HeadingText>

                  {query ? (
                    <div style={{ textAlign: 'center' }}>
                      <LineChart
                        fullWidth
                        accountId={accountId}
                        query={`${chartQuery} ${
                          ignoreFilters ? '' : filterClause || ''
                        }`}
                      />
                    </div>
                  ) : (
                    ''
                  )}

                  <Menu pointing secondary widths={3}>
                    <Menu.Item
                      name="Entity Summary"
                      active={activeItem === 'Entity Summary'}
                      onClick={this.handleItemClick}
                    />
                    <Menu.Item
                      name="Recent Incidents"
                      active={activeItem === 'Recent Incidents'}
                      onClick={this.handleItemClick}
                    />
                    <Menu.Item
                      name="Metadata"
                      active={activeItem === 'Metadata'}
                      onClick={this.handleItemClick}
                    />
                  </Menu>

                  <div
                    style={{
                      display: activeItem === 'Entity Summary' ? '' : 'none'
                    }}
                  >
                    <EntityTable
                      popupData={popupData}
                      updateState={updateState}
                    />
                  </div>

                  <div
                    style={{
                      display: activeItem === 'Metadata' ? '' : 'none'
                    }}
                  >
                    <MetadataTable
                      popupData={popupData}
                      updateState={updateState}
                    />
                  </div>

                  <div
                    style={{
                      display: activeItem === 'Recent Incidents' ? '' : 'none'
                    }}
                  >
                    <RecentViolations
                      popupData={popupData}
                      updateState={updateState}
                    />
                  </div>
                </div>
              </div>
            );
          }}
        </DataConsumer>
      );
    }

    return <div>No content</div>;
  }
}
