import React from 'react';
import { DataConsumer } from '../../context/data';
import { PlatformStateContext } from 'nr1';
import { timeRangeToNrql } from '@newrelic/nr1-community';
import { buildFilterClause } from './utils';
import Grid from './grid';

export default class ChartGrid extends React.Component {
  render() {
    const { height, width } = this.props;

    return (
      <PlatformStateContext.Consumer>
        {platformState => {
          const { timeRange } = platformState;
          const sinceClause = timeRangeToNrql({ timeRange });
          let begin_time = 0;
          let end_time = 0;

          if (timeRange.begin_time) begin_time = timeRange.begin_time;
          if (timeRange.end_time) end_time = timeRange.end_time;
          if (timeRange.duration) {
            end_time = Date.now();
            begin_time = end_time - timeRange.duration;
          }

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
                      filterClause={filterClause}
                      timeRange={timeRange}
                      sinceClause={sinceClause}
                      begin_time={begin_time}
                      end_time={end_time}
                    />
                  );
                } else {
                  return (
                    <div
                      style={{
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ marginTop: '25%' }}>
                        <h2>Select or create a new Open Board to begin!</h2>
                      </div>
                    </div>
                  );
                }
              }}
            </DataConsumer>
          );
        }}
      </PlatformStateContext.Consumer>
    );
  }
}
