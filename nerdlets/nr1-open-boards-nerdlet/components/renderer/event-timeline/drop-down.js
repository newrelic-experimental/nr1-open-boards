import React from 'react';
import { Popup, Icon } from 'semantic-ui-react';
import { DataConsumer } from '../../../context/data';
import { writeUserDocument, writeAccountDocument } from '../../../lib/utils';

export default class EventTimelineWidgetDropDown extends React.Component {
  state = { isOpen: false };

  handleOpen = () => {
    this.setState({ isOpen: true });
  };

  handleClose = () => {
    this.setState({ isOpen: false });
  };

  deleteWidget = async (i, selectedBoard, storageLocation, updateBoard) => {
    const { document } = selectedBoard;
    document.widgets.splice(i.split('_')[1], 1);

    switch (storageLocation.type) {
      case 'user': {
        const result = await writeUserDocument(
          'OpenBoards',
          selectedBoard.value,
          document
        );
        if (result && result.data) {
          updateBoard(document);
        }
        break;
      }
      case 'account': {
        const result = await writeAccountDocument(
          storageLocation.value,
          'OpenBoards',
          selectedBoard.value,
          document
        );
        if (result && result.data) {
          updateBoard(document);
        }
        break;
      }
    }
  };

  render() {
    const { i } = this.props;
    return (
      <DataConsumer>
        {({
          selectedBoard,
          storageLocation,
          updateBoard,
          updateDataStateContext
        }) => {
          return (
            <Popup
              basic
              on="click"
              open={this.state.isOpen}
              onClose={this.handleClose}
              onOpen={this.handleOpen}
              trigger={<Icon name="caret down" color="grey" size="large" />}
              content={
                <div>
                  <div
                    onClick={() =>
                      this.deleteWidget(
                        i,
                        selectedBoard,
                        storageLocation,
                        updateBoard
                      )
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    <Icon name="close" /> Delete
                  </div>
                  <div
                    onClick={() =>
                      updateDataStateContext({
                        selectedWidget: i,
                        eventTimelineWidgetOpen: true
                      })
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    <Icon name="pencil" /> Edit
                  </div>
                </div>
              }
              position="bottom right"
            />
          );
        }}
      </DataConsumer>
    );
  }
}
