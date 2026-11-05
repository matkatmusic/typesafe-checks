# typesafe-checks

Pure TypeScript checks for TypeSafe `state` and `questions`. The file uses no packages and no runtime APIs.

- `listStateErrors(state)` returns a list of errors when `state` is not a string, object or array.
- `listQuestionsErrors(questions)` returns a list of errors for the shape of `questions` and each question. The rules come from the TypeSafe API docs.
- `listUndefinedReferences(state, questions)` returns one error for each backtick name that is not in `state` or in the `instructions` of its own question. Use it only when both shape lists are empty.
- `collectReferenceNames(value)` returns each backtick name in all strings inside `value`.
- `findPathValue(root, path)` finds the value at a path such as `ticket.messages[0].text`.
- `splitKeyPath(path)` splits a path into its keys and indexes.

The functions return lists. They do not throw. Run the tests with `bun test`.
