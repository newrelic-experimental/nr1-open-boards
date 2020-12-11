/* eslint no-use-before-define: 0 */ // --> OFF
import {
  NerdGraphQuery,
  UserStorageQuery,
  UserStorageMutation,
  AccountStorageQuery,
  AccountStorageMutation
} from 'nr1';
import gql from 'graphql-tag';

export const nerdGraphQuery = async query => {
  const nerdGraphData = await NerdGraphQuery.query({
    query: gql`
      ${query}
    `
  });
  return nerdGraphData.data;
};

export const getUserCollection = async (collection, documentId) => {
  const payload = { collection };
  if (documentId) payload.documentId = documentId;
  const result = await UserStorageQuery.query(payload);
  const collectionResult = (result || {}).data || [];
  return collectionResult;
};

export const getAccountCollection = async (
  accountId,
  collection,
  documentId
) => {
  const payload = { accountId, collection };
  if (documentId) payload.documentId = documentId;
  const result = await AccountStorageQuery.query(payload);
  const collectionResult = (result || {}).data || [];
  return collectionResult;
};

export const writeUserDocument = async (collection, documentId, payload) => {
  const result = await UserStorageMutation.mutate({
    actionType: UserStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
    collection,
    documentId,
    document: payload
  });
  return result;
};

export const writeAccountDocument = async (
  accountId,
  collection,
  documentId,
  payload
) => {
  const result = await AccountStorageMutation.mutate({
    accountId,
    actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
    collection,
    documentId,
    document: payload
  });
  return result;
};

export const deleteUserDocument = async (collection, documentId) => {
  const result = await UserStorageMutation.mutate({
    actionType: UserStorageMutation.ACTION_TYPE.DELETE_DOCUMENT,
    collection,
    documentId
  });
  return result;
};

export const deleteAccountDocument = async (
  accountId,
  collection,
  documentId
) => {
  const result = await AccountStorageMutation.mutate({
    accountId,
    actionType: AccountStorageMutation.ACTION_TYPE.DELETE_DOCUMENT,
    collection,
    documentId
  });
  return result;
};

// may remove in favor of direct nrql query component
export const nrdbQuery = async (accountId, query, timeout) => {
  const q = gqlNrqlQuery(accountId, query, timeout);
  const result = await NerdGraphQuery.query({ query: q });
  const nrqlResult =
    (((((result || {}).data || {}).actor || {}).account || {}).nrql || {})
      .results || [];
  return nrqlResult;
};

// no need to run directly, nrdbQuery just passes it through
export const gqlNrqlQuery = (accountId, query, timeout) => gql`{
      actor {
        account(id: ${accountId}) {
          nrql(query: "${query}", timeout: ${timeout || 30000}) {
            results
          }
        }
      }
    }`;

// search for entities by domain & account
export const entitySearchByAccountQuery = (domain, accountId, cursor) => gql`{
  actor {
    entitySearch(query: "domain IN ('${domain}') AND reporting = 'true' ${
  accountId ? `AND tags.accountId IN ('${accountId}')` : ''
}") {
      query
      results${cursor ? `(cursor: "${cursor}")` : ''} {
        nextCursor
        entities {
          name
          guid
          entityType
          domain
        }
      }
    }
  }
}`;

export const buildFilterClause = (filters, dbFilters) => {
  if (Object.keys(filters).length > 0) {
    let value = '';
    Object.keys(filters).forEach(f => {
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

        // auto adjust operatorif percent wildcard is
        if (whereValue.includes('%')) {
          operator = 'LIKE';
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

        // auto adjust operatorif percent wildcard is
        if (whereValue.includes('%')) {
          operator = 'LIKE';
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
    }

    return value !== 'WHERE ' ? value : '';
  }

  return '';
};

export const buildTagFilterQuery = (
  widgetFilters,
  accounts,
  filters,
  dbFilters
) => {
  let query = '';
  const tfDbFilters = dbFilters || [];
  const tfFilters = filters || {};

  if (widgetFilters) {
    let appendedTags = '';

    widgetFilters.forEach(t => {
      if (t === 'accountId') {
        const accountsStr = accounts.map(a => `'${a}'`).join(',');
        const accountTagsQuery = ` AND tags.accountId IN (${accountsStr})`;
        appendedTags += accountTagsQuery;
      } else if (t === 'name') {
        let operator = '';
        let values = [];

        for (let z = 0; z < tfDbFilters.length; z++) {
          const { name } = tfDbFilters[z];
          const names = name.split(',');

          for (let x = 0; x < names.length; x++) {
            // TODO: Replace this with a filter-mapping capability
            if (
              names[x] === 'name' ||
              names[x] === 'appName' ||
              names[x] === 'clusterName'
            ) {
              operator = tfDbFilters[z].operator;
              let value = tfDbFilters[z].default;
              if (`filter_${name}` in tfFilters) {
                value = tfFilters[`filter_${name}`].value;
              }
              value = value.replace(/\*/g, '%');
              values.push(value);
            }
          }
        }

        values = values.filter(v => v !== '%');

        if (operator && operator !== '>' && operator !== '<') {
          let allNames = '';
          for (let x = 0; x < values.length; x++) {
            if (values[x].includes('%')) {
              operator = 'LIKE';
            }
            if (x === 0) {
              allNames += ` name ${operator} '${values[x]}' `;
            } else {
              allNames += ` OR name ${operator} '${values[x]}' `;
            }
          }
          appendedTags += ` AND (${allNames})`;
        }
      } else {
        // console.log(t);
      }
    });

    query += appendedTags;
  }

  query = query.replace(/AND \(\)/g, '');

  return query;
};
