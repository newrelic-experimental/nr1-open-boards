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
    this.state = { eventTypesStr: '', filterVal: '', autoComplete: [] };
  }

  componentDidMount() {
    const { filter, filters, accounts, eventTypes } = this.props;
    this.updateEventTypes(eventTypes, filter, filters, accounts);
  }

  componentDidUpdate() {
    const { filter, filters, accounts, eventTypes } = this.props;
    this.updateEventTypes(eventTypes, filter, filters, accounts);
  }

  updateEventTypes = async (eventTypes, filter, filters, accounts) => {
    let eventTypesStr = (eventTypes || []).join(',');
    const filterName = `filter_${filter.name}`;
    const defaultValue = {
      value: filter.default,
      label: filter.default === '*' ? 'All *' : `${filter.default} (Default)`
    };

    const filterValue = filters[filterName] || defaultValue;

    if (eventTypesStr.endsWith(',')) {
      eventTypesStr = eventTypesStr.slice(0, -1);
    }

    let query = `FROM ${eventTypesStr} SELECT uniques(${filter.name})`;

    if (
      filterValue.value &&
      filterValue.value !== '*' &&
      filterValue.value.includes('%')
    ) {
      query += ` WHERE ${filter.name} LIKE '${filterValue.value}'`;
    }

    if (
      eventTypesStr !== this.state.eventTypesStr ||
      filterValue.value !== this.state.filterVal
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
        filterVal: filterValue.value,
        autoComplete
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
