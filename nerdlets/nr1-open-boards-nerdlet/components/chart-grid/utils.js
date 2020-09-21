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
