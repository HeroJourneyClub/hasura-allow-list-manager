import { AxiosError } from 'axios';
import { getIntrospectionQuery, OperationDefinitionNode } from 'graphql';
import { loadDocuments } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import {
  init,
  hasuraService,
  createQueryCollections,
  createOperationDefinitionNodes,
  QueryCollection,
  getChangedQueries,
} from './hasura';
import { printQueryDiff } from './diff';

export type RunReport = {
  addedCount: number;
  changed: number;
  collectionCreated: boolean;
  existingCount: number;
  introspectionAllowed: boolean;
  operationDefinitionsFound: OperationDefinitionNode[];
  changedQueries: QueryCollection[];
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
): Promise<RunReport> {
  const sources = await loadDocuments(sourcePaths, {
    loaders: [new GraphQLFileLoader()],
  });

  const queryCollections = createQueryCollections(sources);
  const definitionNodes = createOperationDefinitionNodes(sources);

  if (allowIntrospection)
    queryCollections.push({
      name: 'IntrospectionQuery',
      query: getIntrospectionQuery(),
    });

  const report: RunReport = {
    addedCount: 0,
    existingCount: 0,
    changed: 0,
    collectionCreated: false,
    introspectionAllowed: allowIntrospection,
    operationDefinitionsFound: definitionNodes,
    changedQueries: [],
  };

  const api = init(hasuraUri, adminSecret);
  const service = hasuraService(api);

  if (resetAllowList) {
    try {
      await api.dropQueryCollection()
    } catch (error) {
      throwIfUnexpected(error, ['not-exists'])
    }
  }

  try {
    await api.createQueryCollection(queryCollections).then(() => {
      return api.addCollectionToAllowList()
    })
    report.collectionCreated = true;
    report.addedCount = queryCollections.length;
  } catch (error) {
    throwIfUnexpected(error, ['already-exists']);
    // The collection exists, but the contents are unknown
    // Ensure each query is in the allow list
    let existingQueries: QueryCollection[] = [];

    for (const query of queryCollections) {
      try {
        await api.addQueryToCollection(query);
        report.addedCount++;
      } catch (error) {
        throwIfUnexpected(error, ['already-exists']);
        report.existingCount++;
        existingQueries = [...existingQueries, query];
      }
    }

    const remoteQueries = await service.getRemoteAllowedQueryCollection();
    const changedQueries = await getChangedQueries(
      remoteQueries,
      existingQueries
    );

    printQueryDiff(remoteQueries, changedQueries);

    report.changed = changedQueries.length;
    report.changedQueries = changedQueries;
  }
  return report;
}
