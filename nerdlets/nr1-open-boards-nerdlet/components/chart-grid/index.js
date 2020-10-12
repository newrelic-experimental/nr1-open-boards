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

    if (init) {
      timeRange.end_time = Date.now();
      timeRange.begin_time = timeRange.end_time - 3600000;
    }

    const sinceClause = timeRangeToNrql({ timeRange });

    if (
      timeRange.begin_time !== this.state.begin_time ||
      timeRange.end_time !== this.state.end_time ||
      sinceClause !== this.state.sinceClause
    ) {
      this.setState({
        begin_time: timeRange.begin_time,
        end_time: timeRange.end_time,
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
