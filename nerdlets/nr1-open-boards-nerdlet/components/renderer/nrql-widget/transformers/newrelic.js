export const nrqlToNrBillboard = (widget, rawData) => {
  // https://developer.newrelic.com/components/billboard-chart
  const { multiQueryMode } = widget;

  if (multiQueryMode === 'group') {
    return rawData;
  } else if (multiQueryMode === 'sum' && rawData.length > 0) {
    const { metadata } = rawData[0];
    const { groups } = metadata;
    const newRawData = [{ metadata, data: [] }];
    const names = [];

    groups.forEach(g => {
      const { name } = g;
      const newData = {
        begin_time: 0,
        count: 0,
        end_time: 0,
        x: 0,
        y: 0
      };

      rawData.forEach(r => {
        names.push(r.metadata.name);

        r.data.forEach(d => {
          if (d[name]) {
            newData.begin_time = d.begin_time;
            newData.end_time = d.end_time;
            newData.x = d.x;
            newData.y += d.y;
            newData[name] += d[name];
          }
        });
      });

      newRawData[0].metadata.name = names.join('+');

      newRawData[0].data.push(newData);
    });

    return newRawData;
  }

  return rawData;
};

export const nrqlToNrTable = (widget, rawData) => {
  // https://developer.newrelic.com/components/table-chart

  // remove unneeded x & y attributes
  rawData.forEach(r => {
    const { data } = r;
    const newData = (data || []).map(({ x, y, ...keepAttrs }) => keepAttrs);
    delete r.metadata.units_data.x;
    delete r.metadata.units_data.y;
    r.data = newData;
  });

  return rawData;
};
