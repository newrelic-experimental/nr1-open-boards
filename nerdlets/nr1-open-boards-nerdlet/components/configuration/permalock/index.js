import React from 'react';
import { Modal, Form, Message } from 'semantic-ui-react';
import { writeUserDocument, writeAccountDocument } from '../../../lib/utils';
import { DataConsumer } from '../../../context/data';

export default class ManagePermalock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      permalocked: false
    };
  }

  componentDidMount() {
    if (this.props.permalocked) {
      this.setState({ permalocked: this.props.permalocked });
    }
  }

  setPermalock = async (selectedBoard, storageLocation, updateBoard) => {
    const { document } = selectedBoard;
    document.permalocked = true;

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

    this.setState({ permalocked: true });
  };

  render() {
    const { permalocked } = this.state;
    return (
      <DataConsumer>
        {({
          openPermalock,
          selectedBoard,
          storageLocation,
          updateBoard,
          updateDataStateContext
        }) => {
          return (
            <Modal
              dimmer="inverted"
              closeIcon
              open={openPermalock}
              onUnmount={() => updateDataStateContext({ closeCharts: false })}
              onMount={() => updateDataStateContext({ closeCharts: true })}
              onClose={() => updateDataStateContext({ openPermalock: false })}
              size="fullscreen"
            >
              <Modal.Header>Set Permalock</Modal.Header>
              <Modal.Content>
                <Message>
                  <Message.Header>Permalocking</Message.Header>
                  Permalocking a board will prevent you from ever editing it.
                  This is useful for boards that are shared very broadly and
                  must never change. If this board has been permalocked and you
                  would like to make changes, export it and edit a new copy.
                </Message>
                <Form>
                  {!permalocked ? (
                    <Form.Button
                      label="&nbsp;"
                      content="Permalock"
                      color="red"
                      onClick={() =>
                        this.setPermalock(
                          selectedBoard,
                          storageLocation,
                          updateBoard
                        )
                      }
                    />
                  ) : (
                    <Message>PERMALOCKED</Message>
                  )}
                </Form>
              </Modal.Content>
            </Modal>
          );
        }}
      </DataConsumer>
    );
  }
}
