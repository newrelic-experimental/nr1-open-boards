import React from 'react';
import { DataConsumer } from '../../context/data';
import { buildFilterClause } from './utils';
import Grid from './grid';
import BoardSelector from './board-selector';

export default class ChartGrid extends React.PureComponent {
  render() {
    const { height, width } = this.props;

    return (
      <DataConsumer>
        {({
          selectedBoard,
          filters,
          begin_time,
          end_time,
          timeRange,
          sinceClause
        }) => {
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
