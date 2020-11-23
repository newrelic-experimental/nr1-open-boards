/* eslint 
no-console: 0
*/
import React from 'react';
import Select from 'react-select';
import { DataConsumer } from '../../../context/data';

// const customStyles = {
//   option: (provided, state) => ({
//     ...provided,
//     textAlign: 'right'
//   }),
//   placeholder: (provided, state) => ({
//     ...provided,
//     textAlign: 'right'
//   })
// };

export default class ConfigSelector extends React.PureComponent {
  handleSelect = (v, options, updateDataStateContext) => {
    const stateUpdate = {};

    if (v) {
      stateUpdate[v.value] = true;
    }

    const disabledOptions = options.filter(
      o => o.value !== (v || {}).value || null
    );

    disabledOptions.forEach(o => {
      stateUpdate[o.value] = false;
    });

    updateDataStateContext(stateUpdate);
  };

  render() {
    const options = [
      { value: 'openFilters', label: 'Filters' },
      { value: 'openStyles', label: 'CSS Styles' },
      { value: 'openEventStreams', label: 'Event Streams' },
      { value: 'openDynamicHTMLWidgets', label: 'Dynamic HTML Widgets' },
      { value: 'openGeoMaps', label: 'Geo Maps' },
      { value: 'openPermalock', label: 'Permalock' }
    ];

    return (
      <DataConsumer>
        {({ updateDataStateContext }) => {
          return (
            <div
              className="react-select-input-group"
              style={{ width: '150px' }}
            >
              <label style={{}}>Configuration</label>

              <Select
                // styles={customStyles}
                options={options}
                value={null}
                onChange={v =>
                  this.handleSelect(v, options, updateDataStateContext)
                }
                classNamePrefix="react-select"
              />
            </div>
          );
        }}
      </DataConsumer>
    );
  }
}
