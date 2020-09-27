import React from 'react';
import { AutoSizer, NerdGraphQuery } from 'nr1';
import EntityHdvWidgetDropDown from './drop-down';
import gql from 'graphql-tag';
import EntityHdvWidget from './hdv';

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
    this.state = { data: [], isFetching: false, error: false };
  }

  componentDidMount() {
    const { widget } = this.props;
    // fetch data on mount
    this.setState({ init: true, query: widget.value }, () => {
      this.fetchData(widget);
      // fetch data on poll
      let pollInterval = widget.ms || 30000;
      pollInterval = pollInterval < 15000 ? 15000 : pollInterval;

      this.widgetPoll = setInterval(() => {
        this.fetchData();
      }, pollInterval);
    });
  }

  componentDidUpdate() {
    const { widget } = this.props;
    if (widget.value !== this.state.query) {
      this.updateFilter(widget);
    }
  }

  componentWillUnmount() {
    if (this.widgetPoll) {
      clearInterval(this.widgetPoll);
    }
  }

  updateFilter = widget => {
    const stateUpdate = { init: false, query: widget.value };
    this.setState(stateUpdate, () => this.fetchData());
  };

  fetchData = () => {
    const { isFetching, query } = this.state;
    if (!isFetching) {
      this.setState({ isFetching: true }, async () => {
        const result = await NerdGraphQuery.query({
          query: entityQuery(query, null)
        });

        if (result.errors && result.errors.length > 0) {
          //
        } else {
          const results =
            ((((result || {}).data || {}).actor || {}).entitySearch || {})
              .results || null;
          if (results.nextCursor) {
            this.setState({ data: results.entities }, () => {
              this.recursiveFetch(results.nextCursor);
            });
          } else {
            this.setState({ data: results.entities, isFetching: false });
          }
        }
      });
    }
  };

  recursiveFetch = async cursor => {
    const { data, query } = this.state;

    const result = await NerdGraphQuery.query({
      query: entityQuery(query, cursor)
    });

    if (result.errors && result.errors.length > 0) {
      //
    } else {
      const results =
        ((((result || {}).data || {}).actor || {}).entitySearch || {})
          .results || null;
      if (results) {
        if (results.nextCursor) {
          this.setState({ data: [...data, ...results.entities] }, () => {
            this.recursiveFetch(results.nextCursor);
          });
        } else {
          this.setState(
            {
              data: [...data, ...results.entities],
              isFetching: false
            },
            () => {
              // console.log(this.state.data.length)
            }
          );
        }
      } else {
        this.setState({ isFetching: false });
      }
    }
  };

  render() {
    const { data } = this.state;
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
