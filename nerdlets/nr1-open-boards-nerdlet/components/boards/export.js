import React from 'react';
import { Modal, Button, Popup } from 'semantic-ui-react';
import { DataConsumer } from '../../context/data';

export default class ExportBoard extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      exportOpen: false
    };
  }

  handleOpen = () => this.setState({ exportOpen: true });
  handleClose = () => this.setState({ exportOpen: false });

  convertBoard = document => {
    document.permalocked = false;
    return JSON.stringify(document, null, 2);
  };

  render() {
    const { exportOpen } = this.state;
    return (
      <DataConsumer>
        {({ updateDataStateContext, selectedBoard }) => (
          <Modal
            dimmer="inverted"
            closeIcon
            size="large"
            open={exportOpen}
            onClose={this.handleClose}
            onUnmount={() => updateDataStateContext({ closeCharts: false })}
            onMount={() => updateDataStateContext({ closeCharts: true })}
            trigger={
              <Popup
                content="Export"
                trigger={
                  <Button
                    onClick={this.handleOpen}
                    icon="download"
                    style={{ height: '45px' }}
                    className="filter-button"
                  />
                }
              />
            }
          >
            <Modal.Header>Export Board - {selectedBoard.label}</Modal.Header>
            <Modal.Content>
              <textarea
                readOnly
                name="exportBoardConfig"
                style={{ width: '100%', height: '500px' }}
                value={JSON.stringify(selectedBoard.document, null, 2)}
              />
            </Modal.Content>
          </Modal>
        )}
      </DataConsumer>
    );
  }
}
