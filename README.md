# hasura-allow-operations-in
Populate the [Hasura allow-list](https://hasura.io/docs/1.0/graphql/manual/deployment/allow-list.html) from found GraphQL operations in a path, including queries, mutations, and subscriptions.
Optionally include the introspection query by passing `true` as the fourth argument.

## Run with [npx](https://nodejs.dev/the-npx-nodejs-package-runner)
```
npx hasura-allow-operations-in my-admin-secret '**/*.graphql' http://localhost:8090 true
```

## Global install from [npm](https://www.npmjs.com/package/hasura-allow-operations-in)
```
npm i -g hasura-allow-operations-in
hasura-allow-operations-in my-admin-secret http://localhost:8090 '**/*.graphql' true

## cleanup
npm uninstall -g hasura-allow-operations-in
```

## ECMAScript + `.d.ts`
```
import { run } from 'hasura-allow-operations-in'

run('http://localhost:8090', 'my-admin-secret', '**/*.graphql', true)
  .then(
    ({
      introspectionAllowed,
      operationDefinitionsFound,
      addedCount,
      existingCount,
    }) => {
      console.log(
        `Introspection allowed: ${introspectionAllowed}
         Found: ${operationDefinitionsFound.length}
         Added: ${addedCount}
         Existing: ${existingCount}`
      );
    }
  )
  .catch(error => console.error(error));
```

## dev
```
HASURA_URI=http://localhost:8090 yarn && yarn dev http://localhost:8090 my-admin-secret '**/*.graphql' true
```
