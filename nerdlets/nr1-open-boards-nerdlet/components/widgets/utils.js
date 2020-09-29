export const validateSources = (sources, selectedChart) => {
  const errors = [];
  if (sources.length > 0) {
    const query = sources[0].nrqlQuery.toLowerCase();
    const hasTimeseries = query.includes('timeseries');

    for (let z = 0; z < sources.length; z++) {
      const sQuery = sources[z].nrqlQuery.toLowerCase();

      if (sources[z].accounts.length === 0) {
        errors.push(`Query ${z + 1}: Missing account selection`);
      }

      if (selectedChart) {
        const { chart } = selectedChart;

        if (chart.nrqlRequire && chart.nrqlRequire.length > 0) {
          let requirementsMet = false;

          for (let z = 0; z < chart.nrqlRequire.length; z++) {
            if (sQuery.includes(chart.nrqlRequire[z].toLowerCase())) {
              requirementsMet = true;
              break;
            }
          }

          if (!requirementsMet) {
            errors.push(
              `Query ${z + 1}: Missing a required keyword for this chart ${
                chart.nrqlRequire
              }`
            );
          }
        }

        if (chart.nrqlDisallow && chart.nrqlDisallow.length > 0) {
          let requirementsMet = true;
          let disallowedFunction = '';

          for (let z = 0; z < chart.nrqlDisallow.length; z++) {
            if (sQuery.includes(chart.nrqlDisallow[z].toLowerCase())) {
              disallowedFunction = chart.nrqlDisallow[z];
              requirementsMet = false;
              break;
            }
          }

          if (!requirementsMet) {
            errors.push(
              `Query ${z +
                1}: ${disallowedFunction} is not supported for this chart type`
            );
          }
        }
      }

      // validate must haves
      const hasSelect = sQuery.includes('select');
      if (!hasSelect) errors.push(`Query ${z + 1}: Missing SELECT`);
      const hasFrom = /from \S+/.test(sQuery);
      if (!hasFrom) errors.push(`Query ${z + 1}: Missing FROM <event type>`);

      if (
        (hasTimeseries === true &&
          !sources[z].nrqlQuery.toLowerCase().includes('timeseries')) ||
        (hasTimeseries === false &&
          sources[z].nrqlQuery.toLowerCase().includes('timeseries'))
      ) {
        errors.push('Mixed query types are not allowed.');
      }
    }
  }

  return errors;
};

export const validateEvents = events => {
  const errors = [];

  if (events.length > 0) {
    for (let z = 0; z < events.length; z++) {
      if (!events[z].name) {
        errors.push(`Event ${z + 1}: Name cannot be empty`);
      }
      if (!events[z].nrqlQuery) {
        errors.push(`Event ${z + 1}: Query cannot be empty`);
      }
      if (events[z].nrqlQuery.toLowerCase().includes('timeseries')) {
        errors.push(`Event ${z + 1}: Event query cannot use TIMESERIES`);
      }
    }
  }

  return errors;
};
