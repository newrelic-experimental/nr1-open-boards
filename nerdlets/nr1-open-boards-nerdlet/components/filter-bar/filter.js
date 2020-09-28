/* eslint 
no-console: 0
*/
import React from 'react';
import { DataConsumer } from '../../context/data';
import CreatableSelect from 'react-select/creatable';
import { NrqlQuery } from 'nr1';

const customStyles = {
  menu: (provided, state) => ({
    ...provided,
    borderRadius: '0px'
  }),

  control: (provided, { selectProps: { width } }) => ({
    ...provided,
    borderRadius: '0px',
    fontSize: '13px',
    color: '#2a3434'
  }),

  valueContainer: (provided, state) => {
    // const opacity = state.isDisabled ? 0.5 : 1;
    // const transition = 'opacity 300ms';

    return { ...provided, top: '6px', fontSize: '12px' };
  }
};

export default class Filter extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { eventTypesStr: '', autoComplete: [], whereClause: '' };
  }

  componentDidMount() {
    const { filter, accounts, eventTypes, whereClause } = this.props;
    this.updateEventTypes(eventTypes, filter, accounts, whereClause);
  }

  componentDidUpdate() {
    const { filter, accounts, eventTypes, whereClause } = this.props;
    this.updateEventTypes(eventTypes, filter, accounts, whereClause);
  }

  updateEventTypes = async (eventTypes, filter, accounts, whereClause) => {
    let eventTypesStr = (eventTypes || []).join(',');

    if (eventTypesStr.endsWith(',')) {
      eventTypesStr = eventTypesStr.slice(0, -1);
    }

    const query = `FROM ${eventTypesStr} SELECT uniques(${filter.name}) ${whereClause}`;

    if (
      eventTypesStr !== this.state.eventTypesStr ||
      whereClause !== this.state.whereClause
    ) {
      const nrqlPromises = accounts.map(accountId => {
        return NrqlQuery.query({
          accountId,
          query
        });
      });

      const results = await Promise.all(nrqlPromises);
      let autoComplete = [];
      results.forEach(r => {
        const values =
          ((((r || {}).data || {}).chart || {})[0] || {}).data || [];
        autoComplete = [...autoComplete, ...values];
      });

      autoComplete = autoComplete
        .map(c => c[filter.name])
        .filter(a => !a.includes("'") && !a.includes('"'));

      this.setState({
        eventTypesStr,
        autoComplete,
        whereClause
      });
    }
  };

  render() {
    const { filter, filters } = this.props;
    const { autoComplete } = this.state;

    return (
      <DataConsumer>
        {({ updateDataStateContext }) => {
          const filterName = `filter_${filter.name}`;
          const all = { value: '*', label: 'All *' };
          const defaultValue = {
            value: filter.default,
            label:
              filter.default === '*' ? 'All *' : `${filter.default} (Default)`
          };

          const filterValue = filters[filterName] || defaultValue;
          const options = [defaultValue];

          autoComplete.forEach(a => {
            options.push({ value: a, label: a });
          });

          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '250px',
                marginRight: '8px'
              }}
              className="react-create-input-group"
            >
              <label style={{ zIndex: 1 }}>
                {filter.name} {filter.operator || ''}
              </label>
              <CreatableSelect
                styles={customStyles}
                isClearable
                formatCreateLabel={d => `Filter: ${d}`}
                options={options}
                value={filterValue}
                onCreateOption={v => {
                  filters[filterName] = { value: v, label: v };
                  updateDataStateContext({ filters });
                }}
                onChange={v => {
                  filters[filterName] = v ? v : all;
                  updateDataStateContext({ filters });
                }}
              />
            </div>
          );
        }}
      </DataConsumer>
    );
  }
}
