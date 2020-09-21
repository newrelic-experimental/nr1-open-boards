/* eslint 
no-console: 0
*/
import React from 'react';
import { Dropdown, Icon } from 'semantic-ui-react';
import { DataConsumer } from '../../context/data';
import CreatableSelect from 'react-select/creatable';

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

export default class FilterBar extends React.PureComponent {
  render() {
    return (
      <DataConsumer>
        {({ selectedBoard, filters, updateDataStateContext }) => {
          if (selectedBoard) {
            const dashboardFilters = selectedBoard.document.filters || [];

            return (
              <div
                className="filters-container"
                style={{
                  paddingLeft: '16px',
                  textAlign: 'left',
                  height: '55px',
                  display: selectedBoard ? '' : 'none'
                }}
              >
                {/* <h4 className="filters-header">Filters:</h4> */}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row'
                  }}
                >
                  {dashboardFilters.map((f, i) => {
                    const filterName = `filter_${f.name}`;
                    const all = { value: '*', label: 'All *' };
                    const defaultValue = {
                      value: f.default,
                      label:
                        f.default === '*' ? 'All *' : `${f.default} (Default)`
                    };

                    const filterValue = filters[filterName] || defaultValue;
                    const options = [defaultValue];

                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          width: '250px',
                          marginRight: '8px'
                        }}
                        className="react-create-input-group"
                      >
                        <label style={{ zIndex: 1 }}>
                          {f.name} {f.operator || ''}
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
                  })}
                </div>
              </div>
            );
          } else {
            return '';
          }
        }}
      </DataConsumer>
    );
  }
}
