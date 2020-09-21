export const nrqlCompleter = (
  editor,
  session,
  pos,
  prefix,
  eventTypes,
  keysets
) => {
  const wordList = [];

  keysets.forEach(k => {
    wordList.push({
      caption: k.key,
      value: k.key,
      name: k.key,
      meta: `attr: ${k.type}`,
      score: 1000
    });
  });

  const cursor = session.selection.cursor;
  const line = session
    .getLine(cursor.row)
    .slice(0, cursor.column - prefix.length);

  if (line.endsWith('FROM ')) {
    eventTypes.forEach(e => {
      if (e.includes(prefix)) {
        wordList.push({
          caption: e,
          value: e,
          name: e,
          meta: 'Event Type',
          score: 1000
        });
      }
    });
  }

  return wordList;
};

// addCompleter({
//   getCompletions: function(editor, session, pos, prefix, callback) {
//     const eventTypes = ['Transaction', 'Browser'];
//     const wordList = [];
//     console.log(this.state.sources);
//     const cursor = session.selection.cursor;
//     const line = session
//       .getLine(cursor.row)
//       .slice(0, cursor.column - prefix.length);
//     if (line.endsWith('FROM ')) {
//       eventTypes.forEach(e => {
//         if (e.includes(prefix)) {
//           wordList.push(e);
//         }
//       });
//     }
//     callback(
//       null,
//       wordList.map(function(word) {
//         return {
//           caption: word,
//           value: word,
//           name: word,
//           meta: word,
//           score: 1000
//         };
//       })
//     );
//     // callback(null, [
//     //   {
//     //     name: 'count',
//     //     value: 'count',
//     //     caption: 'count',
//     //     meta: 'count events',
//     //     score: 1000
//     //   }
//     // ]);
//   }
// });
