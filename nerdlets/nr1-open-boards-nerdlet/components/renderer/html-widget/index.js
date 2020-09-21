import React from 'react';
import { AutoSizer } from 'nr1';
import HtmlWidgetDropDown from './drop-down';

export default class BasicHTML extends React.Component {
  render() {
    const { widget, i } = this.props;
    const hdrStyle = widget.headerStyle || {};

    const createMarkup = value => {
      return { __html: value };
    };

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
                <div style={{ float: 'right' }}>
                  <HtmlWidgetDropDown i={i} height={`${headerHeight}px`} />
                </div>

                <div style={{ paddingLeft, paddingRight, paddingBottom }}>
                  <div dangerouslySetInnerHTML={createMarkup(widget.value)} />
                </div>
              </div>
            );
          }}
        </AutoSizer>
      </div>
    );
  }
}
