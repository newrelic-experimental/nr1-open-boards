import React from 'react';
import ReactMapGL from 'react-map-gl';
import { Button, Form, Modal } from 'semantic-ui-react';

export default class MapPreview extends React.PureComponent {
    render() {
        const { onClose, latitude, updateViewport, longitude, zoom, apiToken, mapRef, mapStyle } = this.props;
        return (
            <Modal
                dimmer="blurring"
                closeIcon
                open={true}
                onClose={onClose}
                size="fullscreen"
                style={{ left: 0, right: 0 }}
            >
                <Modal.Header>
                    Map Preview    
                </Modal.Header>
                <Modal.Content style={{height: '100%', width: '100%'}}>
                    <ReactMapGL
                        latitude={parseFloat(latitude) || -25}
                        longitude={parseFloat(longitude) || -25}
                        zoom={parseFloat(zoom) || 4}
                        height="80vh"
                        width="auto"
                        onViewportChange={updateViewport}
                        mapboxApiAccessToken={apiToken}
                        ref={mapRef}
                        mapStyle={mapStyle || "mapbox://styles/mapbox/light-v10"}
                    ></ReactMapGL>
                <Form.Group style={{float:'right', padding: '10px 0'}}>
                    <Button positive primary onClick={onClose}>Select</Button>
                </Form.Group>
                </Modal.Content>    
            </Modal>
        )
    }
}