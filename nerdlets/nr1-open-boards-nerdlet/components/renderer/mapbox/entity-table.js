import React from 'react';
import { Icon } from 'semantic-ui-react';
import {
  navigation,
  Table,
  TableHeaderCell,
  TableHeader,
  TableRow,
  TableRowCell
} from 'nr1';

const getAlertColor = alertHighest => {
  switch (alertHighest) {
    case 'NOT_ALERTING': {
      return 'green';
    }
    case 'WARNING': {
      return 'orange';
    }
    case 'CRITICAL': {
      return 'red';
    }
  }

  return 'grey';
};

export default class EntityTable extends React.Component {
  render() {
    const { popupData, updateState } = this.props;
    const { properties } = popupData;

    let entities = properties.entities || [];
    const nestedEntites = [];
    entities.forEach(e => {
      if (e.relationships) {
        e.relationships.forEach(r => {
          if (r.target && r.target.entity) {
            nestedEntites.push(r.target.entity);
          }
        });
      }
    });

    entities = [...entities, ...nestedEntites].filter(
      e => e.entityType !== 'DASHBOARD_ENTITY'
    );

    return (
      <Table
        items={entities || []}
        onSelect={(evt, { item }) => (item.selected = evt.target.checked)}
      >
        <TableHeader>
          <TableHeaderCell
            value={({ item }) => item.alertSeverity || 'UNCONFIGURED'}
            width="fit-content"
            alignmentType={TableRowCell.ALIGNMENT_TYPE.LEFT}
          />
          <TableHeaderCell
            // width="10px"
            value={({ item }) => item.name}
            alignmentType={TableRowCell.ALIGNMENT_TYPE.LEFT}
          >
            Name
          </TableHeaderCell>
          <TableHeaderCell value={({ item }) => item.entityType}>
            Type
          </TableHeaderCell>
        </TableHeader>

        {({ item }) => {
          const alertColor = getAlertColor(item.alertSeverity);

          return (
            <TableRow
              onClick={() => {
                updateState({ hidden: false });
                navigation.openStackedEntity(item.guid);
              }}
            >
              <TableRowCell>
                <Icon color={alertColor} name="circle" />
              </TableRowCell>
              <TableRowCell>{item.name}</TableRowCell>
              <TableRowCell>{item.entityType}</TableRowCell>
            </TableRow>
          );
        }}
      </Table>
    );
  }
}
