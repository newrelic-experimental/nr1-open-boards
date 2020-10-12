import React from 'react';
import { AutoSizer, NerdGraphQuery } from 'nr1';
import EntityHdvWidgetDropDown from './drop-down';
import gql from 'graphql-tag';
import EntityHdvWidget from './hdv';
import queue from 'async/queue';

const entityQuery = (query, cursor) => {
  return gql`{
    actor {
      entitySearch(query: "${query}") {
        results${cursor ? `(cursor: "${cursor}")` : ''} {
          entities {
            name
            guid
            account {
              id
              name
            }
            domain
            type
            entityType
            reporting
            ... on AlertableEntityOutline {
              alertSeverity
            }
          }
          nextCursor
        }
      }
    }
  }`;
};

export default class EntityHdv extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      isFetching: false,
      error: false,
      tagFilterQuery: ''
    };
  }

  componentDidMount() {
    const { widget, tagFilterQuery } = this.props;
    // fetch data on poll
    let pollInterval = widget.ms || 30000;
    pollInterval = pollInterval < 15000 ? 15000 : pollInterval;

    // fetch data on mount
    this.setState(
      { init: true, query: widget.value, tagFilterQuery, pollInterval },
      () => {
        this.fetchData();

        this.widgetPoll = setInterval(() => {
          this.fetchData();
        }, pollInterval);
      }
    );
  }

  componentDidUpdate() {
    const { widget, tagFilterQuery } = this.props;

    if (
      widget.value !== this.state.query ||
      tagFilterQuery !== this.state.tagFilterQuery
    ) {
      this.updateFilter(widget, tagFilterQuery);
    }
  }

  componentWillUnmount() {
    if (this.widgetPoll) {
      clearInterval(this.widgetPoll);
    }
  }

  updateFilter = (widget, tagFilterQuery) => {
    const stateUpdate = { init: false, query: widget.value, tagFilterQuery };
    this.setState(stateUpdate, () => {
      const { pollInterval } = this.state;

      if (this.widgetPoll) {
        clearInterval(this.widgetPoll);
      }

      this.fetchData();

      this.widgetPoll = setInterval(() => {
        this.fetchData();
      }, pollInterval);
    });
  };

  fetchData = () => {
    const { isFetching } = this.state;

    if (!isFetching) {
      this.setState({ isFetching: true }, () => {
        this.recursiveEntityFetch().then(data => {
          this.setState({ data, isFetching: false });
        });
      });
    }
  };

  recursiveEntityFetch = async () => {
    const { query, tagFilterQuery } = this.state;

    return new Promise(async resolve => {
      const guidData = [];

      const q = queue((task, callback) => {
        NerdGraphQuery.query({
          query: entityQuery(
            `${task.query} ${task.tagFilterQuery || ''}`,
            task.cursor
          )
        }).then(value => {
          const results =
            ((((value || {}).data || {}).actor || {}).entitySearch || {})
              .results || null;

          if (results) {
            if (results.entities.length > 0) {
              guidData.push(results.entities);
            }

            if (results.nextCursor) {
              q.push({ query, tagFilterQuery, cursor: results.nextCursor });
            }
          }

          callback();
        });
      }, 1);

      q.push({ query, tagFilterQuery, cursor: null });

      await q.drain();

      resolve(guidData.flat());
    });
  };

  render() {
    const { data, isFetching } = this.state;
    const { widget, i } = this.props;
    const hdrStyle = widget.headerStyle || {};

    return (
      <div style={{ width: '100%', height: '100%' }}>
        <AutoSizer>
          {({ width, height }) => {
            const headerHeight = hdrStyle.height
              ? hdrStyle.height.replace(/\D/g, '')
              : 30;

            const maxWidgetHeight = height - headerHeight - 10;
            const paddingTop = '5px';
            const paddingLeft = '9px';
            const paddingRight = '5px';
            const paddingBottom = '5px';

            hdrStyle.fontSize = hdrStyle.fontSize || '14px';
            hdrStyle.fontWeight = hdrStyle.fontWeight || 'bold';
            // hdrStyle.fontFamily = hdrStyle.fontFamily || 'Fira Code';
            hdrStyle.paddingLeft = hdrStyle.paddingLeft || '9px';
            hdrStyle.paddingLeft = hdrStyle.paddingRight || '5px';
            hdrStyle.float = hdrStyle.float || 'left';
            hdrStyle.verticalAlign = hdrStyle.verticalAlign || 'middle';

            return (
              <div style={{ paddingTop }}>
                <div style={{ height: `${headerHeight}px` }}>
                  <div
                    style={{
                      ...hdrStyle
                    }}
                  >
                    {widget.name || 'some widget'}
                  </div>

                  <div
                    style={{
                      float: 'right',
                      maxHeight: `${headerHeight}px`
                    }}
                  >
                    <EntityHdvWidgetDropDown
                      i={i}
                      height={`${headerHeight}px`}
                    />
                  </div>
                </div>

                <div style={{ paddingLeft, paddingRight, paddingBottom }}>
                  <EntityHdvWidget
                    data={data}
                    width={width}
                    height={maxWidgetHeight}
                    limit={widget.limit}
                    isFetching={isFetching}
                  />
                </div>
              </div>
            );
          }}
        </AutoSizer>
      </div>
    );
  }
}
