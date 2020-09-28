export const buildFilterClause = (filters, dbFilters) => {
  if (Object.keys(filters).length > 0) {
    let value = '';
    Object.keys(filters).forEach((f, i) => {
      const filterName = f.replace('filter_', '');
      if (filters[f] && filters[f].value !== '*') {
        const filterValue = filters[f].value;
        const whereValue = isNaN(filterValue)
          ? `'${filterValue}'`
          : filterValue;
        // const endValue =
        //   Object.keys(filters).length === 1 ||
        //   Object.keys(filters).length === i + 1
        //     ? ''
        //     : 'AND';

        let operator = '';
        for (let z = 0; z < dbFilters.length; z++) {
          if (dbFilters[z].name === filterName) {
            operator = dbFilters[z].operator || '';
            break;
          }
        }

        if (operator === '') {
          operator = whereValue.includes('%') ? ' LIKE ' : '=';
        }

        const filterNames = filterName.split(',');

        let multiWhere = ' WHERE';
        filterNames.forEach((name, i) => {
          multiWhere += ` \`${name}\` ${operator} ${whereValue}`;
          if (i + 1 < filterNames.length) {
            multiWhere += ' OR';
          }
        });
        value += multiWhere;
      }
    });
    return value !== 'WHERE ' ? value : '';
  } else if (dbFilters.length > 0) {
    let value = '';
    for (let z = 0; z < dbFilters.length; z++) {
      const filterName = dbFilters[z].name;
      const filterValue = dbFilters[z].default;

      if (filterValue !== '*') {
        const whereValue = isNaN(filterValue)
          ? `'${filterValue}'`
          : filterValue;

        // const endValue =
        //   dbFilters.length === 1 || dbFilters.length === z + 1 ? '' : 'AND';
        let operator = '';
        if (dbFilters[z].operator) {
          operator = dbFilters[z].operator;
        } else {
          operator = whereValue.includes('%') ? ' LIKE ' : '=';
        }

        value += ` WHERE ${filterName} ${operator} ${whereValue}`;
      }
    }

    return value !== 'WHERE ' ? value : '';
  }

  return '';
};

export const writeStyle = (styleName, cssText) => {
  let styleElement = document.getElementById(styleName);
  if (styleElement)
    document.getElementsByTagName('head')[0].removeChild(styleElement);
  styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.id = styleName;
  styleElement.innerHTML = cssText;
  document.getElementsByTagName('head')[0].appendChild(styleElement);
};

export const createCSSSelector = (selector, style) => {
  if (!document.styleSheets) return;
  if (document.getElementsByTagName('head').length === 0) return;

  let styleElement = document.getElementById(`${selector} *`);
  if (styleElement) {
    document.getElementsByTagName('head')[0].removeChild(styleElement);
  }
  styleElement = document.getElementById(`${selector}`);
  if (styleElement) {
    document.getElementsByTagName('head')[0].removeChild(styleElement);
  }

  let styleSheet;
  let mediaType;

  if (document.styleSheets.length > 0) {
    for (let i = 0, l = document.styleSheets.length; i < l; i++) {
      if (document.styleSheets[i].disabled) continue;
      const media = document.styleSheets[i].media;
      mediaType = typeof media;

      if (mediaType === 'string') {
        if (media === '' || media.indexOf('screen') !== -1) {
          styleSheet = document.styleSheets[i];
        }
      } else if (mediaType === 'object') {
        if (
          media.mediaText === '' ||
          media.mediaText.indexOf('screen') !== -1
        ) {
          styleSheet = document.styleSheets[i];
        }
      }

      if (typeof styleSheet !== 'undefined') break;
    }
  }

  if (typeof styleSheet === 'undefined') {
    const styleSheetElement = document.createElement('style');
    styleSheetElement.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(styleSheetElement);

    for (let i = 0; i < document.styleSheets.length; i++) {
      if (document.styleSheets[i].disabled) {
        continue;
      }
      styleSheet = document.styleSheets[i];
    }

    mediaType = typeof styleSheet.media;
  }

  if (mediaType === 'string') {
    for (let i = 0, l = styleSheet.rules.length; i < l; i++) {
      if (
        styleSheet.rules[i].selectorText &&
        styleSheet.rules[i].selectorText.toLowerCase() ===
          selector.toLowerCase()
      ) {
        styleSheet.rules[i].style.cssText = style;
        return;
      }
    }
    styleSheet.addRule(selector, style);
  } else if (mediaType === 'object') {
    const styleSheetLength = styleSheet.cssRules
      ? styleSheet.cssRules.length
      : 0;
    for (let i = 0; i < styleSheetLength; i++) {
      if (
        styleSheet.cssRules[i].selectorText &&
        styleSheet.cssRules[i].selectorText.toLowerCase() ===
          selector.toLowerCase()
      ) {
        styleSheet.cssRules[i].style.cssText = style;
        return;
      }
    }
    styleSheet.insertRule(`${selector} * ${style}`, styleSheetLength);
  }
};
