import React from 'react';
import { Modal, Label, Form, Divider, Message } from 'semantic-ui-react';
import { writeUserDocument, writeAccountDocument } from '../../../lib/utils';
import { DataConsumer } from '../../../context/data';

export default class BoardConfig extends React.Component {
    constructor(props) { 
        super(props);
        this.state = {
            autoSize: true,
            width: 0,
            height: 0
        }
    }

    componentDidMount() {
        this.setState({ ...(this.props.selectedBoard || {})});
    }


}
