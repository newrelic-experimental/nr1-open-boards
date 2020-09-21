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
