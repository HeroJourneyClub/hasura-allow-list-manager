import { getIntrospectionQuery, OperationDefinitionNode } from 'graphql';
import { loadDocuments } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import {
  init,
  hasuraService,
  createQueryCollections,
  getOperationDefinitionNodes,
  getAddedOrUpdatedQueries,
} from './hasura';
import { question } from './question';
import { printQueryDiff } from './diff';
import { QueryFilter } from './queryFilter';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

export type RunReport = {
  addedCount: number;
  updated: number;
  collectionCreated: boolean;
  existingCount: number;
  operationDefinitionsFound: OperationDefinitionNode[];
  removedQueries: number;
};

export async function run(
  hasuraUri: string,
  adminSecret: string,
  sourcePaths: string | string[],
  queryCollectionPath: string,
  allowIntrospection?: boolean,
  resetAllowList?: boolean,
  forceReplace?: boolean,
  version?: string,
  maxVersion?: number,
  maxVersionDay?: number,
): Promise<RunReport> {
  const api = init(hasuraUri, adminSecret);
  const service = await hasuraService(api);

  const sources = await loadDocuments(sourcePaths, {
    loaders: [new GraphQLFileLoader()],
  });

  // List of queries used in the source code
  let sourceQueryCollections = createQueryCollections(sources);
  // List of queries already set in Hasura. If `resetAllowList` is true we'll use an empty array which will remove
  // all queries when applied (unless found in `sourceQueryCollections`)
  const serviceQueryCollections = resetAllowList ? [] : service.remoteQueries ?? [];
  // The final query collection to be set in Hasura
  const queryCollections = {
    name: 'allowed-queries',
    definition: {
      queries: [...serviceQueryCollections],
    },
  };

  if (allowIntrospection) {
    sourceQueryCollections.push({
      name: 'IntrospectionQuery',
      query: getIntrospectionQuery(),
    });
  }

  const report: RunReport = {
    addedCount: 0,
    existingCount: 0,
    updated: 0,
    collectionCreated: false,
    operationDefinitionsFound: getOperationDefinitionNodes(sources),
    removedQueries: 0,
  };

  const { added: addedQueries, updated: updatedQueries } =
    getAddedOrUpdatedQueries(
      serviceQueryCollections,
      sourceQueryCollections,
      version
  );

  report.existingCount = serviceQueryCollections.length;
  report.addedCount = addedQueries.length;
  report.updated = updatedQueries.length;

  if (addedQueries.length > 0) {
    queryCollections.definition.queries.push(...addedQueries);
  }

  if (version && updatedQueries.length > 0) {
    queryCollections.definition.queries.push(...updatedQueries);
  } else {
    printQueryDiff(serviceQueryCollections, updatedQueries);
    
    const replaceQueries = () => {
      const queryNamesToUpdate = updatedQueries.map((query) => query.name);
      queryCollections.definition.queries.filter((query) => !queryNamesToUpdate.includes(query.name));
      queryCollections.definition.queries.push(...updatedQueries);
    };
    
    if (forceReplace) {
      replaceQueries();
    } else if (updatedQueries.length > 0) {
      await question(
        'Do you want to continue? This will replace the changed queries on Hasura! y/n -> '
      ).then(answer => {
        if (answer.toLowerCase().trim() === 'y') {
          replaceQueries();
        } else {
          report.updated = 0;
        }
      });
    }
  }

  const queries = queryCollections.definition.queries;

  if (queries != undefined && (maxVersion != undefined || maxVersionDay != undefined)) {
    const queryNameRegex = /([a-zA-Z]+)([_]+)\(([\d]+)\-([a-z0-9-]+)\)/;
    const queryFilter = new QueryFilter(maxVersionDay ?? 0, maxVersion ?? 0);
    
    for (const query of queries) {
      const fullQueryName = query.name;
      const queryNameMatch = fullQueryName.match(queryNameRegex);
      if (queryNameMatch) {
        const queryTimestamp = queryNameMatch[3];
        const queryName = queryNameMatch[1];

        queryFilter.addQuery(queryTimestamp, fullQueryName, queryName, query.query);
      }
    }

    const queriesToDelete = queryFilter.getQueriesToDelete();
    const queryNamesToDelete = queriesToDelete.map((query) => query.name);
    queryCollections.definition.queries = queryCollections.definition.queries.filter((query) => !queryNamesToDelete.includes(query.name));

    report.removedQueries = queriesToDelete.length;
  }

  fs.writeFileSync(
    queryCollectionPath,
    yaml.dump([queryCollections]),
  );

  return report;
}
