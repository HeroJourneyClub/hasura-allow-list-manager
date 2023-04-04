import { AxiosError } from 'axios';
import { getIntrospectionQuery, OperationDefinitionNode } from 'graphql';
import { loadDocuments } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import {
  init,
  hasuraService,
  createQueryCollections,
  getOperationDefinitionNodes,
  QueryCollection,
  getAddedOrUpdatedQueries,
  addVersionToQueryName,
} from './hasura';
import { question } from './question';
import { printQueryDiff } from './diff';
import { QueryFilter } from './queryFilter';

export type RunReport = {
  addedCount: number;
  updated: number;
  collectionCreated: boolean;
  existingCount: number;
  operationDefinitionsFound: OperationDefinitionNode[];
  removedQueries: number;
};

function throwIfUnexpected(error: AxiosError, acceptable_errors: string[]): void {
  if (
    error.response === undefined || !acceptable_errors.includes(error.response.data.code)
  ) {
    if (error.response?.data?.error) {
      throw Error(error.response?.data?.error)
    } else {
      throw error;
    }
  }
}

export async function run(
  hasuraUri: string,
  adminSecret: string,
  sourcePaths: string | string[],
  allowIntrospection?: boolean,
  resetAllowList?: boolean,
  forceReplace?: boolean,
  version?: string,
  maxVersion?: number,
  maxVersionDay?: number,
): Promise<RunReport> {
  const api = init(hasuraUri, adminSecret);

  const sources = await loadDocuments(sourcePaths, {
    loaders: [new GraphQLFileLoader()],
  });

  let queryCollections = createQueryCollections(sources);

  if (allowIntrospection)
    queryCollections.push({
      name: 'IntrospectionQuery',
      query: getIntrospectionQuery(),
    });

  const report: RunReport = {
    addedCount: 0,
    existingCount: 0,
    updated: 0,
    collectionCreated: false,
    operationDefinitionsFound: getOperationDefinitionNodes(sources),
    removedQueries: 0,
  };

  if (resetAllowList) {
    try {
      await api.dropQueryCollection()
    } catch (error) {
      throwIfUnexpected(error, ['not-exists'])
    }
  }

  const service = await hasuraService(api);

  if (!service.hasQueryCollections) {
    if (version) {
      queryCollections = queryCollections.map<QueryCollection>(q => {
        return {
          name: addVersionToQueryName(q.name, version),
          query: q.query,
        };
      });
    }

    await api.createQueryCollection(queryCollections);
    report.collectionCreated = true;
    report.addedCount = queryCollections.length;
  } else {
    // The main query collection ('allowed-queries') already exist. Must upddate it with new or updated queries
    const { added: addedQueries, updated: updatedQueries } =
      getAddedOrUpdatedQueries(
        service.remoteQueries,
        queryCollections,
        version
      );

    report.existingCount = service.remoteQueries.length;
    report.addedCount = addedQueries.length;
    report.updated = updatedQueries.length;

    await Promise.all(
      addedQueries.map(query => {
        return api.addQueryToCollection(query);
      })
    );

    if (version) {
      await Promise.all(
        updatedQueries.map(query => {
          return api.addQueryToCollection(query);
        })
      )
    } else {
      printQueryDiff(service.remoteQueries, updatedQueries);

      const replaceQueries = (queries: QueryCollection[]) => {
        Promise.all(queries.map(service.replaceQueryFromCollection))
          .then(() => {
            console.log('Queries updated!');
            process.exit(0);
          })
          .catch(e => {
            console.log('Error on update queries!', e);
            process.exit(1);
          });
      };

      if (forceReplace) {
        console.log('Forcing queries replacement...');
        replaceQueries(updatedQueries);
      } else if (updatedQueries.length > 0) {
        await question(
          'Do you want to continue? This will replace the changed queries on Hasura! y/n -> '
        ).then(answer => {
          if (answer.toLowerCase().trim() === 'y') {
            replaceQueries(updatedQueries);
          } else {
            report.updated = 0;
          }
        });
      }
    }
  }

  const metadata = await api.exportMetadata();
  const queries: Array<any> = metadata.data?.query_collections?.[0]?.definition?.queries;

  if (queries != undefined && (maxVersion != undefined || maxVersionDay != undefined)) {
    const queryNameRegex = /([a-zA-Z]+)([_]+)\(([\d]+)\-([a-z0-9]+)\)/;
    const queryFilter = new QueryFilter(maxVersionDay ?? 0, maxVersion ?? 0);
    
    for (const query of queries) {
      const queryName = query.name;
      const queryNameMatch = queryName.match(queryNameRegex);
      if (queryNameMatch) {
        const queryTimestamp = queryNameMatch[3];
        const queryName = queryNameMatch[0];

        queryFilter.addQuery(queryTimestamp, queryName, query.query);
      }
    }

    const queriesToDelete = queryFilter.getQueriesToDelete();
    await Promise.all(queriesToDelete.map(api.dropQueryFromCollection));

    report.removedQueries = queriesToDelete.length;
  }

  if (!service.queryCollectionsPresentInAllowList) {
    await api.addCollectionToAllowList()
  }

  return report
}
