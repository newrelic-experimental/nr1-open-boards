import React from 'react';
import { DataConsumer } from '../../../../context/data';

export default class OpenHtml extends React.Component {
  render() {
    const { data, widget, width, height } = this.props;

    const findMetric = (queryNo, key, id) => {
      for (let z = 0; z < data.length; z++) {
        const { sourceIndex, accountId, metadata } = data[z];
        const innerData = data[z].data || [];
        const groups = metadata.groups || [];

        const no = queryNo.replace('Q', '');

        if (parseInt(no) === sourceIndex + 1) {
          if (id && parseInt(accountId) !== parseInt(id)) {
            continue;
          }

          for (let z = 0; z < groups.length; z++) {
            const valueName = groups[z].value;
            const displayName = groups[z].displayName;
            if (valueName === key || displayName === key) {
              for (let x = 0; x < innerData.length; x++) {
                return innerData[x][valueName];
              }
            }
          }
        }
      }

      return null;
    };

    const getAccountName = (accounts, id) => {
      for (let z = 0; z < accounts.length; z++) {
        if (accounts[z].id === id) {
          return accounts[z].name;
        }
      }
      return '';
    };

    const createMarkup = (value, fullAccounts) => {
      let processedValue = value;

      if (value.includes(':ACCOUNTS:')) {
        const accounts = data.map(d => d.accountId);

        let completedValues = '';
        accounts.forEach(id => {
          const accountName = getAccountName(fullAccounts, id);
          const newVal = value
            .replace(/:ACCOUNTS:/g, `:${id}:`)
            .replace(/\${ ACCOUNT_NAME }/g, accountName);
          completedValues += newVal;
        });

        processedValue = completedValues;
      }

      const replacements = processedValue.match(/(?<=\${).*?(?=})/g) || [];

      replacements.forEach(r => {
        let newValue = r;

        const valueAccountReplacements = r.match(/Q\d+:\w+:\S+/g) || [];
        valueAccountReplacements.forEach(v => {
          const values = v.split(':');
          const queryNo = values[0];
          const accountId = values[1];
          const key = values[2];
          const value = findMetric(queryNo, key, accountId);
          newValue = newValue.replace(v, value);
        });

        const valueSingleReplacements = r.match(/Q\d+:\S+/g) || [];
        valueSingleReplacements.forEach(v => {
          const values = v.split(':');
          const queryNo = values[0];
          const key = values[1];
          const value = findMetric(queryNo, key);
          newValue = newValue.replace(v, value);
        });

        let finalValue = '';
        try {
          finalValue = eval(newValue);
        } catch (e) {
          console.log(`eval error ${e}`);
          finalValue = 'eval error';
        }

        processedValue = processedValue.replace(`\${${r}}`, finalValue);
      });

      return { __html: processedValue };
    };

    return (
      <DataConsumer>
        {({ updateDataStateContext, selectedBoard, filters, accounts }) => {
          let baseChartHtml = '';
          const { document } = selectedBoard;
          const htmlWidgets = document.htmlWidgets || [];

          for (let z = 0; z < htmlWidgets.length; z++) {
            const { name, value } = htmlWidgets[z];
            if (name === widget.htmlChart) {
              baseChartHtml = value;
            }
          }

          return (
            <div
              style={{
                overflow: 'auto'
              }}
              className="force-select"
            >
              <div
                style={{ height: `${height}px`, width: `${width - 15}px` }}
                dangerouslySetInnerHTML={createMarkup(baseChartHtml, accounts)}
              />
            </div>
          );
        }}
      </DataConsumer>
    );
  }
}
