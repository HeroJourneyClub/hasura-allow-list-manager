# Manager for hasura allow-list

Automatically Populate the Hasura allow-list from found GraphQL operations in a path, including queries, mutations, and subscriptions.
Supports update and versioning.

More on [Hasura allow-list](https://hasura.io/docs/latest/graphql/core/deployment/allow-list.html)

## Why

From hasura:
> In production instances: Enabling the allow-list is highly recommended when running the GraphQL engine in production.

Allow list is a important security feature that restrict the GraphQL engine so that it executes *only* those operations that are present in the list. But managing allow-list manually can be tendious and prone to error.

## How it works

The local queries, mutations, and subscriptions defined in `.graphql` or `.gql` files will be compared with the remote Hasura server.
The new definitions will be sent to Hasura and the existing ones will be compared and the difference between them will be shown. The replacement will be done by removing the remote query and replacing it with the local query.

### Versioning behavior

- `-v --version <version>` allows to version queries instead of updating them. This is especially useful for mobile app where client can take several weeks to update.
- The current behavior is to never remove past queries. When a query with the same name and different query is detected, it will create a new query to the allow list collection with the current timestamp and version.
- The version query name format is the following: `$NAME___($TIMESTAMP-$VERSION)`
- If you start versioning, you must continue versioning.

## Installation

```bash
npm install --save-dev @herojourneyclub/hasura-allow-list-manager
```

or yarn

```bash
yarn add --dev @herojourneyclub/hasura-allow-list-manager
```

## Usage

```bash
hasura-allow-list-manager [options]
```

### Options

- `-h | --host <uri>` Hasura host URI
- `-s | --admin-secret <key>` Hasura admin secret
- `-p | --path <path>` Source path with gql or graphql files
- `-f | --force-replace` Replace change queries, not prompt and asking for continue
- `-i | --allow-instrospection` Send the Introspection query with your queries
- `-r | --reset` Delete all allow lists before running insert
- `-v | --version <version>` Version queries instead of replacing them. Incompatible with -f


### Examples

With update:
```
hasura-allow-list-manager -h http://localhost:8080 -s my-admin-secret -p './**/*.graphql' -f
```

With versionning:
```
GIT_VERSION=$(git log --pretty=format:"%h" -1)
hasura-allow-list-manager -h http://localhost:8080 -s my-admin-secret -p './**/*.graphql' -v ${GIT_VERSION}
```


## Development

In order to run it locally you'll need to fetch some dependencies and run the cli.

1. Install dependencies:

```bash
npm install
```

or

```bash
yarn install
```

2. To run the cli:

```
npm run dev -- -h http://localhost:8080 -s my-admin-secret -p '**/*.graphql'
```

or

```
yarn dev -h http://localhost:8080 -s my-admin-secret -p '**/*.graphql'
```

## Contributing

Contribution are welcome. Send us your PR or open a issue ticket. Let's build together.

## Credits

Fork from:
- [hasura-allowed-queries](https://github.com/TallerWebSolutions/hasura-allowed-queries)
- [hasura-allow-operations-in](https://github.com/rhyslbw/hasura-allow-operations-in) by [Rhys Bartels-Waller](https://github.com/rhyslbw)
