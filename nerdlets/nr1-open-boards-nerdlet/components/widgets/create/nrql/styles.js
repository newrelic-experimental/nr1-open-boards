/* eslint 
no-console: 0
*/
import React from 'react';
import { Form, Dropdown } from 'semantic-ui-react';

const operators = [
  { key: '==', value: '==', text: '==' },
  { key: '!=', value: '!=', text: '!=' },
  { key: '>', value: '>', text: '>' },
  { key: '<', value: '<', text: '<' },
  { key: '>=', value: '>=', text: '>=' },
  { key: '<=', value: '<=', text: '<=' },
  { key: 'LIKE', value: 'LIKE', text: 'LIKE' },
  { key: 'NOT LIKE', value: 'NOT LIKE', text: 'NOT LIKE' }
];

export default class StyleEditor extends React.PureComponent {
  render() {
    const { i, styleConditions, updateStyles } = this.props;
    const styleCondition = styleConditions[i];

    const edit = (k, value) => {
      styleCondition[k] = value;
      styleConditions[i] = styleCondition;
      updateStyles(styleConditions);
    };

    const deleteItem = () => {
      styleConditions.splice(i, 1);
      updateStyles(styleConditions);
    };

    return (
      <div
        style={{
          paddingTop: '5px',
          paddingBottom: '5px'
        }}
      >
        <Form>
          <Form.Group inline style={{ marginBottom: '5px' }}>
            <Form.Input
              width="4"
              label="Class name"
              value={styleCondition.class}
              onChange={(e, d) => edit('class', d.value)}
            />
            <Form.Input
              width="4"
              label="Attribute"
              value={styleCondition.attr}
              onChange={(e, d) => edit('attr', d.value)}
            />
            <Form.Field width="2">
              <Dropdown
                style={{ width: '100%' }}
                placeholder="Operator"
                fluid
                selection
                onChange={(e, d) => edit('operator', d.value)}
                value={styleCondition.operator}
                options={operators}
              />
            </Form.Field>
            <Form.Input
              width="4"
              label="Value"
              value={styleCondition.value}
              onChange={(e, d) => edit('value', d.value)}
            />
            <Form.Button
              width="2"
              content="Delete"
              icon="minus"
              floated="left"
              onClick={deleteItem}
              style={{ float: 'right' }}
            />
          </Form.Group>
        </Form>
      </div>
    );
  }
}
