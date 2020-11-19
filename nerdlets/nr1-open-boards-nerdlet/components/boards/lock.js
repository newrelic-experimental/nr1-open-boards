import React from 'react';
import { Button, Icon } from 'semantic-ui-react';
import { DataConsumer } from '../../context/data';

export default class LockBoard extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  save = async (locked, updateDataStateContext) => {
    await updateDataStateContext({ locked: locked });
  };

  render() {
    return (
      <DataConsumer>
        {({ locked, updateDataStateContext }) => (
          <Button
            className="filter-button"
            size="large"
            onClick={() => this.save(!locked, updateDataStateContext)}
          >
            <Icon
              size="large"
              fitted
              name={locked ? 'lock' : 'lock open'}
              color={locked ? 'green' : 'red'}
            />
          </Button>
        )}
      </DataConsumer>
    );
  }
}
