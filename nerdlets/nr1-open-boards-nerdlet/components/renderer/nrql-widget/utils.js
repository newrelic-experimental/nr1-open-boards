export const randomColor = () => {
  const colors = [
    '#11A893',
    '#4ACAB7',
    '#0E7365',
    '#00B3D7',
    '#3ED2F2',
    '#0189A4',
    '#FFC400',
    '#FFDD78',
    '#CE9E00',
    '#A45AC1',
    '#C07DDB',
    '#79428E',
    '#83CB4E',
    '#A2E572',
    '#63973A',
    '#FA6E37',
    '#FF9269',
    '#C6562C',
    '#C40685',
    '#E550B0',
    '#910662'
  ];

  return colors[Math.floor(Math.random() * colors.length)];
};

export const decorateWithEvents = (rawData, rawEventData) => {
  let newEvents = rawData;

  if ((rawEventData || []).length > 0) {
    rawEventData.forEach(r => {
      const formattedEvents = {
        metadata: {
          id: 'events',
          name: r.name,
          color: r.color || '#000000',
          viz: 'event'
        },
        data: r.data.map(d => ({
          x0: d.timestamp,
          x1: d.timestamp + 1
        }))
      };

      newEvents = [...newEvents, formattedEvents];
    });
  }

  return newEvents;
};
