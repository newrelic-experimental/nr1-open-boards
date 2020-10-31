import React from 'react';
import { DataConsumer } from '../../context/data';

// for whatever strange reason nr1 platformStatecontext always gets updates on drags
// because of this it continues causing unnecessary re-renders
// the timehandler component aims to alleviate that issue
export default class NerdletStateHandler extends React.PureComponent {
  handleUpdate = (updateDataStateContext, urlStateChecked, props, boards) => {
    if (boards.length > 0) {
      if (urlStateChecked === false) {
        const { nerdletState } = props;
        const { name, filters } = nerdletState;
        const selectedBoard = boards.find(b => b.id === name);

        if (selectedBoard) {
          updateDataStateContext({ selectedBoard, filters });
        }

        updateDataStateContext({ urlStateChecked: true });
      }
    }
  };

  render() {
    return (
      <DataConsumer>
        {({ updateDataStateContext, urlStateChecked, boards }) => {
          this.handleUpdate(
            updateDataStateContext,
            urlStateChecked,
            this.props,
            boards
          );
          return '';
        }}
      </DataConsumer>
    );
  }
}
