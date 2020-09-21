export const buildBoardOptions = boards => {
  const boardOptions = boards.map(a => ({
    key: a.id,
    label: a.id.replace(/\+/g, ' '),
    text: a.id.replace(/\+/g, ' '),
    value: a.id,
    id: a.id,
    document: a.document
  }));

  boardOptions.sort((a, b) => {
    if (a.label < b.label) {
      return -1;
    }
    if (a.label > b.label) {
      return 1;
    }
    return 0;
  });

  return boardOptions;
};

export const buildStorageOptions = accounts => {
  const storageOptions = accounts.map(a => ({
    key: a.id,
    label: a.name,
    text: a.name,
    value: a.id,
    events: a.reportingEventTypes,
    type: 'account'
  }));

  storageOptions.sort((a, b) => {
    if (a.label < b.label) {
      return -1;
    }
    if (a.label > b.label) {
      return 1;
    }
    return 0;
  });

  storageOptions.unshift({
    key: 'User',
    label: 'User (Personal)',
    value: 'user',
    type: 'user'
  });

  return storageOptions;
};
