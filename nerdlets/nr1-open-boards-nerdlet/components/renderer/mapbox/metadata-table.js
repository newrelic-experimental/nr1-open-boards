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

function isValidJson(json) {
  try {
    JSON.parse(json);
    return true;
  } catch (e) {
    return false;
  }
}

export default class MetadataTable extends React.Component {
  render() {
    const { popupData, updateState } = this.props;
    const { properties } = popupData;

    const metadata = [];

    const excludeKeys = [
      'index',
      'entities',
      'alertHighest',
      'alertLevel',
      'name'
    ];

    Object.keys(properties).forEach(key => {
      if (!excludeKeys.includes(key)) {
        if (key === 'location') {
          Object.keys(properties[key]).forEach(l => {
            metadata.push({ name: l, value: properties[key][l] });
          });
        } else {
          const value = isValidJson(properties[key])
            ? JSON.stringify(properties[key])
            : properties[key];
          metadata.push({ name: key, value });
        }
      }
    });

    return (
      <Table
        items={metadata || []}
        onSelect={(evt, { item }) => (item.selected = evt.target.checked)}
      >
        <TableHeader>
          <TableHeaderCell
            // width="10px"
            value={({ item }) => item.name}
            width="fit-content"
            alignmentType={TableRowCell.ALIGNMENT_TYPE.LEFT}
          >
            Name
          </TableHeaderCell>
          <TableHeaderCell value={({ item }) => item.value}>
            Value
          </TableHeaderCell>
        </TableHeader>

        {({ item }) => {
          return (
            <TableRow>
              <TableRowCell>{item.name}</TableRowCell>
              <TableRowCell>{item.value}</TableRowCell>
            </TableRow>
          );
        }}
      </Table>
    );
  }
}
