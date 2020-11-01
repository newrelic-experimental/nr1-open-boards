import React from 'react';
import { DataConsumer } from '../../context/data';
import { buildFilterClause } from './utils';
import Grid from './grid';
import BoardSelector from './board-selector';
import _ from 'lodash';
import { Dimmer, Loader } from 'semantic-ui-react';

export default class ChartGrid extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      width: 1,
      height: 1
    };
  }

  componentDidMount() {
    const { height, width } = this.props;
    this.setState({ height, width });
  }

  componentDidUpdate() {
    const { height, width } = this.props;
    this.updateSize(width, height);
  }

  // debounce the size change to avoid continous re-renders
  updateSize = _.debounce((width, height) => {
    this.setState({ width, height });
  }, 500);

  render() {
    const { height, width } = this.state;

    return (
      <DataConsumer>
        {({
          selectedBoard,
          filters,
          begin_time,
          end_time,
          timeRange,
          sinceClause,
          initialized,
          urlStateChecked
        }) => {
          if (
            urlStateChecked === false ||
            initialized === false ||
            sinceClause === ''
          ) {
            return (
              <Dimmer active inverted>
                <Loader>Loading...</Loader>
              </Dimmer>
            );
          }

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
