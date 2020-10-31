import React from 'react';
import { DataConsumer } from '../../context/data';
import { timeRangeToNrql } from '@newrelic/nr1-community';

// for whatever strange reason nr1 platformStatecontext always gets updates on drags
// because of this it continues causing unnecessary re-renders
// the timehandler component aims to alleviate that issue
export default class TimeHandler extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      init: true,
      platform_begin_time: 0,
      platform_end_time: 0,
      platform_duration: 0
    };
  }

  handleUpdate = (updateDataStateContext, props) => {
    this.updateTime(updateDataStateContext, props);
  };

  updateTime = (updateDataStateContext, props) => {
    const { timeRange } = props;
    const { init } = this.state;

    if (
      timeRange.begin_time !== this.state.platform_begin_time ||
      timeRange.end_time !== this.state.platform_end_time ||
      timeRange.duration !== this.state.platform_duration
    ) {
      let end_time = 0;
      let begin_time = 0;

      if (init) {
        end_time = Date.now();
        begin_time = end_time - 3600000;
      } else if (timeRange.duration) {
        end_time = Date.now();
        begin_time = end_time - timeRange.duration;
      } else {
        end_time = timeRange.end_time;
        begin_time = timeRange.begin_time;
      }

      const sinceClause = timeRangeToNrql({
        timeRange: { begin_time, end_time }
      });

      const stateUpdate = {
        platform_begin_time: timeRange.begin_time,
        platform_end_time: timeRange.end_time,
        platform_duration: timeRange.duration,
        begin_time,
        end_time,
        timeRange,
        sinceClause,
        init: false
      };

      this.setState(stateUpdate, () => {
        updateDataStateContext(stateUpdate);
      });
    }
  };

  render() {
    return (
      <DataConsumer>
        {({ updateDataStateContext }) => {
          this.handleUpdate(updateDataStateContext, this.props);
          return '';
        }}
      </DataConsumer>
    );
  }
}
