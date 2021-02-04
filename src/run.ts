import { AxiosError } from 'axios';
import { getIntrospectionQuery, OperationDefinitionNode } from 'graphql';
import { loadDocuments } from '@graphql-toolkit/core';
import { GraphQLFileLoader } from '@graphql-toolkit/graphql-file-loader';
import {
  init,
  createQueryCollection,
  createOperationDefinitionNodes,
} from './Hasura/schema_metadata/QueryCollection';

export type RunReport = {
  addedCount: number;
  collectionCreated: boolean;
  existingCount: number;
  introspectionAllowed: boolean;
  operationDefinitionsFound: OperationDefinitionNode[];
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
    collectionCreated: false,
    introspectionAllowed: allowIntrospection,
    operationDefinitionsFound: definitionNodes,
  };

  const api = init(hasuraUri, adminSecret);

  try {
    await api.createQueryCollection(collectionItem);
    report.collectionCreated = true;
    report.addedCount = collectionItem.length;
  } catch (error) {
    throwIfUnexpected(error);
    // The collection exists, but the contents are unknown
    // Ensure each query is in the allow list
    console.log({ collectionItem });
    for (const item of collectionItem) {
      try {
        await api.addQueryToCollection(item);
        report.addedCount++;
      } catch (error) {
        throwIfUnexpected(error);
        report.existingCount++;
      }
    }
  }
  return report;
}
