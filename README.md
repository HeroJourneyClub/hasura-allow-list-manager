# hasura-allowed-queries

Populate the [Hasura allow-list](https://hasura.io/docs/1.0/graphql/manual/deployment/allow-list.html) from found GraphQL operations in a path, including queries, mutations, and subscriptions; replacing the existing ones.

## Why

Hasura only accepts a collection query named "allowed-queries", and its [Query Collection API](https://hasura.io/docs/1.0/graphql/core/api-reference/schema-metadata-api/query-collections.html) doesn't have the option to update an existing query, making it difficult to update queries with the same name. Forcing us to remove the query and add it again.


## How it works

The local queries, mutations, and subscriptions defined in `.graphql` or `.gql` files will be compared with the remote Hasura server.  The new definitions will be sent to Hasura and the existing ones will be compared and the difference between them will be shown. The replacement will be done by removing the remote query and re-adding the local changed query.

## Install

You can get it on npm.

```bash
npm install --save-dev @taller/hasura-allowed-queries
```

or

```bash
yarn add --dev @taller/hasura-allowed-queries
```

## Usage

```bash
hasura-allowed-queries [options]
```

### Options

- `-h | --host <uri>` Hasura host URI
- `-s | --admin-secret <key>` Hasura admin secret
- `-p | --path <path>` Source path with gql or graphql files
- `-f | --force-replace` Replace change queries, not prompt and asking for continue
- `-i | --allow-instrospection` Send the Introspection query with your queries


## Development

In order to run it locally you'll need to fetch some dependencies and run the cli.

1. Install dependencies:

```bash
yarn add --dev @taller/hasura-allowed-queries
```

2. To run the cli:

```
yarn dev -h http://localhost:8080 -s my-admin-secret -p '**/*.graphql'
```

## Contributing

1. Fork it!
2. Create your feature branch: git checkout -b my-new-feature
3. Commit your changes: git commit -m 'feat: Add some feature'
4. Push to the branch: git push origin my-new-feature
5. Submit a pull request :D


## Credits

- [hasura-allow-operations-in](https://github.com/rhyslbw/hasura-allow-operations-in) by [Rhys Bartels-Waller](https://github.com/rhyslbw)
