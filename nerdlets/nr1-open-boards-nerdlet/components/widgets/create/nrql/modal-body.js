import React from 'react';
import {
  Modal,
  Button,
  Input,
  Divider,
  Message,
  Header
} from 'semantic-ui-react';
import { DataConsumer } from '../../../../context/data';
import { nrqlCharts } from '../../list';
import { validateSources, validateEvents } from '../../utils';
import Select from 'react-select';
import NrqlEditor from './nrqlEditor';
import { writeUserDocument, writeAccountDocument } from '../../../../lib/utils';
import StyleEditor from './styles';

const multiQueryOptions = [
  {
    key: 'group',
    value: 'group',
    label: 'Group'
  }
  // {
  //   key: 'sum',
  //   value: 'sum',
  //   label: 'Sum'
  // }
];

export default class NrqlModalBody extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      ms: '',
      sources: [],
      events: [],
      styleConditions: [],
      htmlChart: null,
      selectedChart: null,
      props: {},
      x: 0,
      y: 0,
      w: 7,
      h: 5,
      multiQueryMode: {
        key: 'group',
        value: 'group',
        label: 'Group'
      }
    };
  }

  componentDidMount() {
    // workaround to close the drop down menu
    setTimeout(() => {
      document.getElementById('nrql-create-title').click();
    }, 100);

    if (this.props.widget) {
      const { widget } = this.props;
      let chart = null;
      for (let z = 0; z < nrqlCharts.length; z++) {
        const chartSplit = widget.chart.split(':');
        if (
          nrqlCharts[z].type === chartSplit[0] &&
          nrqlCharts[z].name === chartSplit[1]
        ) {
          chart = nrqlCharts[z];
          break;
        }
      }

      this.setState(
        {
          name: widget.name,
          ms: widget.ms,
          styleConditions: [...(widget.styleConditions || [])],
          htmlChart: widget.htmlChart
            ? {
                key: widget.htmlChart,
                value: widget.htmlChart,
                label: widget.htmlChart
              }
            : null,
          sources: [...(widget.sources || [])],
          events: [...(widget.events || [])],
          props: { ...(widget.props || []) },
          x: widget.x,
          y: widget.y,
          w: widget.w,
          h: widget.h,
          selectedChart: {
            key: widget.chart,
            value: widget.chart,
            label: widget.chart,
            chart: { ...chart }
          },
          multiQueryMode: {
            key: widget.multiQueryMode,
            value: widget.multiQueryMode,
            label: widget.multiQueryMode
          }
        },
        () => {
          const { sources, events, styleConditions } = this.state;
          this.setState({
            sources: [...sources],
            events: [...events],
            styleConditions: [...styleConditions]
          });
        }
      );
    }
  }

  handleOpen = updateDataStateContext => {
    this.setState(
      { name: '', sources: [], events: [], styleConditions: [] },
      () => updateDataStateContext({ createNrqlWidgetOpen: true })
    );
  };

  handleClose = updateDataStateContext => {
    this.setState(
      { name: '', sources: [], events: [], styleConditions: [] },
      () =>
        updateDataStateContext({
          createNrqlWidgetOpen: false,
          selectedWidget: null
        })
    );
  };

  addNrqlSource = () => {
    const { sources } = this.state;
    sources.push({ nrqlQuery: 'FROM ', accounts: [] });
    this.setState({ sources: [...sources] });
  };

  addNrqlEvents = () => {
    const { events } = this.state;
    events.push({ nrqlQuery: 'FROM ', accounts: [], name: '' });
    this.setState({ events: [...events] });
  };

  addStyleCondition = () => {
    const { styleConditions } = this.state;
    styleConditions.push({
      class: '',
      attr: '',
      operator: '',
      value: '',
      priority: 0
    });
    this.setState({ styleConditions: [...styleConditions] });
  };

  create = async (
    selectedBoard,
    storageLocation,
    updateBoard,
    updateDataStateContext,
    widgetNo
  ) => {
    const {
      name,
      selectedChart,
      styleConditions,
      htmlChart,
      sources,
      events,
      multiQueryMode,
      ms,
      props,
      x,
      y,
      w,
      h
    } = this.state;
    const widget = {
      name,
      chart: selectedChart.value,
      styleConditions,
      sources,
      events,
      multiQueryMode: multiQueryMode.value,
      props,
      ms,
      x,
      y,
      w,
      h,
      type: 'nrql'
    };

    if (htmlChart && selectedChart.key === 'open:html') {
      widget.htmlChart = htmlChart.value;
    } else {
      delete widget.htmlChart;
    }

    const { document } = selectedBoard;

    if (!document.widgets) {
      document.widgets = [];
    }

    if (widgetNo) {
      document.widgets[widgetNo] = { ...widget };
    } else {
      document.widgets.push(widget);
    }

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
    this.handleClose(updateDataStateContext);
  };

  updateSources = sources => {
    this.setState({ sources: [...sources] });
  };

  updateEvents = events => {
    this.setState({ events: [...events] });
  };

  updateStyles = styleConditions => {
    this.setState({ styleConditions: [...styleConditions] });
  };

  renderChartDropDown = selectedChart => {
    return (
      <div className="react-select-input-group" style={{ width: '175px' }}>
        <label>Chart Type</label>
        <Select
          options={nrqlCharts.map(n => ({
            key: `${n.type}:${n.name}`,
            value: `${n.type}:${n.name}`,
            label: `${n.type}: ${n.name}`,
            chart: n
          }))}
          onChange={selectedChart => this.setState({ selectedChart })}
          value={selectedChart}
          classNamePrefix="react-select"
        />
      </div>
    );
  };

  renderMultiQueryDropDown = (sources, multiQueryMode) => {
    return (
      <div className="react-select-input-group" style={{ width: '150px' }}>
        <label>Multi Query Mode</label>
        <Select
          isDisabled={
            sources.length === 0 ||
            (sources.length === 1 &&
              sources[0] &&
              sources[0].accounts.length <= 1)
          }
          options={multiQueryOptions}
          onChange={multiQueryMode => this.setState({ multiQueryMode })}
          value={multiQueryMode}
          classNamePrefix="react-select"
        />
      </div>
    );
  };

  renderPropDropDown = (name, options, props) => {
    const propOptions = options.map(o => ({
      key: o,
      value: o,
      label: o
    }));

    let value = {};
    Object.keys(props).forEach(p => {
      if (p === name) {
        value = {
          key: props[p],
          value: props[p],
          label: props[p]
        };
      }
    });

    const updateProp = v => {
      const newProps = { ...props };
      newProps[name] = v.value;
      this.setState({ props: newProps });
    };

    return (
      <div className="react-select-input-group" style={{ width: '150px' }}>
        <label>{name}</label>
        <Select
          options={propOptions}
          onChange={v => updateProp(v)}
          value={value}
          classNamePrefix="react-select"
        />
      </div>
    );
  };

  renderHtmlWidgetSelect = (selectedBoard, htmlChart) => {
    const { document } = selectedBoard;
    const htmlWidgets = document.htmlWidgets || [];

    const widgetOptions = htmlWidgets.map(o => ({
      key: o.name,
      value: o.name,
      label: o.name
    }));

    return (
      <div className="react-select-input-group" style={{ width: '250px' }}>
        <label>Base Html Widget</label>
        <Select
          options={widgetOptions}
          onChange={htmlChart => this.setState({ htmlChart })}
          value={htmlChart}
          classNamePrefix="react-select"
        />
      </div>
    );
  };

  render() {
    const { widget, widgetNo } = this.props;
    if (widget && this.state.selectedChart === null) {
      return 'Loading widget...';
    }

    const {
      name,
      styleConditions,
      sources,
      events,
      selectedChart,
      htmlChart,
      multiQueryMode,
      ms,
      props
    } = this.state;

    let createDisabled = false;
    if (!name) createDisabled = true;
    if (selectedChart && selectedChart.key === 'open:html' && !htmlChart) {
      createDisabled = true;
    }
    if (!selectedChart) {
      createDisabled = true;
    }

    const errors = validateSources(sources, selectedChart);
    if (errors.length > 0) createDisabled = true;
    if (sources.length === 0) {
      createDisabled = true;
    } else {
      sources.forEach(s => {
        if (s.accounts.length === 0 || s.nrqlQuery === '') {
          createDisabled = true;
        }
      });
    }

    const eventErrors = validateEvents(events);

    return (
      <DataConsumer>
        {({
          updateBoard,
          storageOptions,
          storageLocation,
          selectedBoard,
          updateDataStateContext
        }) => {
          const accounts = storageOptions.map(
            ({ label, ...keepAttrs }) => keepAttrs
          );
          accounts.shift();

          // const title = widget ? 'Edit NRQL Widget' : 'Create NRQL Widget';

          return (
            <>
              <Modal.Content>
                <div className="utility-bar">
                  <div className="react-select-input-group">
                    <Input
                      style={{ height: '45px', width: '100%' }}
                      placeholder="Widget name..."
                      value={name}
                      onChange={(e, d) => this.setState({ name: d.value })}
                    />
                  </div>

                  {this.renderChartDropDown(selectedChart)}
                  {this.renderMultiQueryDropDown(sources, multiQueryMode)}

                  <div className="flex-push" />

                  <div
                    className="react-select-input-group"
                    style={{ width: '185px' }}
                  >
                    <Input
                      className="input-poll"
                      label="Poll (ms)"
                      style={{ width: '115px', height: '45px' }}
                      placeholder="blank for auto"
                      value={ms}
                      onChange={(e, d) =>
                        this.setState({ ms: d.value.replace(/[^0-9]/g, '') })
                      }
                    />
                  </div>

                  <div>
                    <Button
                      style={{ height: '45px' }}
                      icon="plus"
                      content="Query"
                      onClick={() => this.addNrqlSource('nrql')}
                    />
                  </div>

                  {selectedChart &&
                  (selectedChart.key === 'newrelic:line' ||
                    selectedChart.key === 'newrelic:area') ? (
                    <div>
                      <Button
                        style={{ height: '45px' }}
                        icon="plus"
                        content="Events"
                        onClick={() => this.addNrqlEvents('nrql')}
                      />
                    </div>
                  ) : (
                    ''
                  )}

                  <div>
                    <Button
                      style={{ height: '45px' }}
                      icon="plus"
                      content="Style condition"
                      onClick={() => this.addStyleCondition()}
                    />
                  </div>
                </div>

                {selectedChart && selectedChart.chart.props ? (
                  <>
                    <div className="utility-bar">
                      {selectedChart.chart.props.map((p, i) => {
                        return (
                          <React.Fragment key={i}>
                            {this.renderPropDropDown(p.name, p.options, props)}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  ''
                )}

                {selectedChart &&
                selectedChart.chart &&
                selectedChart.key === 'open:html' ? (
                  <>
                    <div className="utility-bar">
                      {this.renderHtmlWidgetSelect(selectedBoard, htmlChart)}
                    </div>
                  </>
                ) : (
                  ''
                )}

                <Divider />

                {sources.map((s, i) => (
                  <NrqlEditor
                    key={i}
                    i={i}
                    sources={this.state.sources}
                    accounts={accounts}
                    updateSources={this.updateSources}
                  />
                ))}

                {sources.length > 0 && errors.length > 0 ? (
                  <Message negative>
                    <Message.Header>Errors</Message.Header>
                    <Message.List>
                      {errors.map((e, i) => (
                        <Message.Item key={i}>{e}</Message.Item>
                      ))}
                    </Message.List>
                  </Message>
                ) : (
                  ''
                )}

                {events.length > 0 ? (
                  <>
                    <Header as="h4" content="Events" />

                    {events.map((s, i) => (
                      <NrqlEditor
                        key={i}
                        i={i}
                        type="events"
                        sources={this.state.events}
                        accounts={accounts}
                        updateSources={this.updateEvents}
                      />
                    ))}

                    {events.length > 0 && eventErrors.length > 0 ? (
                      <Message negative>
                        <Message.Header>Errors</Message.Header>
                        <Message.List>
                          {eventErrors.map((e, i) => (
                            <Message.Item key={i}>{e}</Message.Item>
                          ))}
                        </Message.List>
                      </Message>
                    ) : (
                      ''
                    )}
                  </>
                ) : (
                  ''
                )}

                <Divider />

                {styleConditions.map((s, i) => {
                  return (
                    <StyleEditor
                      key={i}
                      i={i}
                      styleConditions={this.state.styleConditions}
                      updateStyles={this.updateStyles}
                    />
                  );
                })}
              </Modal.Content>

              <Modal.Actions>
                <Button
                  positive
                  disabled={createDisabled}
                  onClick={() =>
                    this.create(
                      selectedBoard,
                      storageLocation,
                      updateBoard,
                      updateDataStateContext,
                      widgetNo
                    )
                  }
                >
                  {widget ? 'Update' : 'Create'}
                </Button>
              </Modal.Actions>
            </>
          );
        }}
      </DataConsumer>
    );
  }
}
