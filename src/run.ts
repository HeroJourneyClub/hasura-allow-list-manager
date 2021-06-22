import { AxiosError } from 'axios';
import { getIntrospectionQuery, OperationDefinitionNode } from 'graphql';
import { loadDocuments } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import {
  init,
  hasuraService,
  createQueryCollection,
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

function throwIfUnexpected(error: AxiosError): void {
  if (
    error.response === undefined ||
    error.response.data.code !== 'already-exists'
  )
    throw error;
}

export async function run(
  hasuraUri: string,
  adminSecret: string,
  sourcePaths: string | string[],
  allowIntrospection?: boolean
): Promise<RunReport> {
  const sources = await loadDocuments(sourcePaths, {
    loaders: [new GraphQLFileLoader()],
  });

  const collectionItem = createQueryCollection(sources);
  const definitionNodes = createOperationDefinitionNodes(sources);

  if (allowIntrospection)
    collectionItem.push({
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

  try {
    await api.createQueryCollection(collectionItem);
    report.collectionCreated = true;
    report.addedCount = collectionItem.length;
  } catch (error) {
    throwIfUnexpected(error);
    // The collection exists, but the contents are unknown
    // Ensure each query is in the allow list
    let existingQueries: QueryCollection[] = [];

    for (const item of collectionItem) {
      try {
        await api.addQueryToCollection(item);
        report.addedCount++;
      } catch (error) {
        throwIfUnexpected(error);
        report.existingCount++;
        existingQueries = [...existingQueries, item];
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
