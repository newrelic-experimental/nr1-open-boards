import React from 'react';
import { DataConsumer } from '../../context/data';
import { buildFilterClause } from './utils';
import Grid from './grid';
import BoardSelector from './board-selector';
import { timeRangeToNrql } from '@newrelic/nr1-community';

export default class ChartGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      init: true,
      platform_begin_time: 0,
      platform_end_time: 0,
      platform_duration: 0,
      begin_time: 0,
      end_time: 0,
      timeRange: {},
      sinceClause: ''
    };
  }

  componentDidMount() {
    this.updateTime(this.props);
  }

  componentDidUpdate() {
    this.updateTime(this.props);
  }

  updateTime = props => {
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

      this.setState({
        platform_begin_time: timeRange.begin_time,
        platform_end_time: timeRange.end_time,
        platform_duration: timeRange.duration,
        begin_time,
        end_time,
        timeRange,
        sinceClause,
        init: false
      });
    }
  };

  render() {
    const { height, width } = this.props;
    const { begin_time, end_time, timeRange, sinceClause } = this.state;

    return (
      <DataConsumer>
        {({ selectedBoard, filters }) => {
          if (selectedBoard) {
            const { document } = selectedBoard;
            const dbFilters = document.filters || [];
            const filterClause = buildFilterClause(filters, dbFilters);

            return (
              <Grid
                selectedBoard={selectedBoard}
                width={width}
                height={height}
                filters={filters}
                filterClause={filterClause}
                timeRange={timeRange}
                sinceClause={sinceClause}
                begin_time={begin_time}
                end_time={end_time}
              />
            );
          } else {
            return <BoardSelector />;
          }
        }}
      </DataConsumer>
    );
  }
}
