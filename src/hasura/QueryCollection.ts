import { Source } from '@graphql-tools/utils';
import { DefinitionNode, FragmentDefinitionNode, OperationDefinitionNode, visit, print, parse } from 'graphql';

export interface QueryCollection {
  name: string;
  query: string;
}


function addFragmentsToQuery(defNode: OperationDefinitionNode, fragments: Record<string, FragmentDefinitionNode>) {
  let query : string = print(defNode)

  function recursivelyFindFragments(defNode: OperationDefinitionNode| FragmentDefinitionNode) {
    visit(defNode, {
      FragmentSpread(node) {
        const fragDef = fragments[node.name.value]
        // everytime we find a fragment, we add it to the query collection, and check the fragment for fragment
        query += `\n\n${print(fragDef)}`
        recursivelyFindFragments(fragDef);
      },
    })
  }
  recursivelyFindFragments(defNode)

  return query
}

export function getFragmentMap(sources: Source[]) {
  return sources.reduce<Record<string, FragmentDefinitionNode>>((acc, source) => {
    const fragmentMap = source.document.definitions.reduce<Record<string, FragmentDefinitionNode>>(
      (acc, nodeDef: DefinitionNode) => {
        if (nodeDef.kind == 'FragmentDefinition') {
          acc[nodeDef.name.value] = nodeDef
          return acc
        } else {
          return acc
        }
      },
      {}
    )

    return { ...acc, ...fragmentMap };
  }, {});
}

export function sourceToQueryCollection(prevQueryCollections: QueryCollection[], source: Source, fragmentMap: Record<string, FragmentDefinitionNode>) {
    return source.document.definitions.reduce<QueryCollection[]>(
      (acc, defNode: DefinitionNode) => {
        if (defNode.kind == 'OperationDefinition') {
          // Check if name already exist. If so raise an error
          const name = defNode.name.value
          const query = print(defNode)
          const exists = acc.find(qc => qc.name == name)
          if (exists) {
            if (exists.query != query) {
              throw Error(`Operation ${name} already exist. Please rename the operation name.`)
            } else {
              return acc
            }
          }

          return acc.concat({
            name: defNode.name.value,
            query: addFragmentsToQuery(defNode, fragmentMap),
          });
        } else {
          return acc
        }
      },
      prevQueryCollections
    );
  }


export function createQueryCollections(sources: Source[]): QueryCollection[] {
  const fragmentMap = getFragmentMap(sources);
  return sources.reduce<QueryCollection[]>((acc, source) => {
    return sourceToQueryCollection(acc, source, fragmentMap)
  }, []);
}

export function toMap(
  queries: QueryCollection[]
): Map<QueryCollection['name'], QueryCollection['query']> {
  return queries.reduce((acc, query) => {
    acc.set(query.name, query.query);
    return acc;
  }, new Map());
}

const nameToVersionRe = /(.*)___\(([0-9]+)-(.+)\)$/;

type QueryCollectionWithVersion = {
  name: string,
  query: string
  date: Date | null,
  version: string | null,
}

function queryToVersionData(query: QueryCollection) : QueryCollectionWithVersion {
  const m = query.name.match(nameToVersionRe)

  return {
    query: query.query,
    name: m ? m[1] : query.name,
    date: m ? new Date(parseInt(m[2])) : null,
    version: m ? m[3] :null,
  }
}

export function addVersionToQueryName(name: string, version: string) {
  return `${name}___(${Date.now()}-${version})`
}

export function getAddedOrUpdatedQueriesVersion(
  oldQueries: QueryCollection[],
  newQueries: QueryCollection[],
  version: string,
) : { added: QueryCollection[], updated: QueryCollection[]} {

  const lastOldQueryPerVersion = oldQueries.reduce<Record<string, QueryCollectionWithVersion>>((acc, query) => {
    const queryVersion = queryToVersionData(query)
    const prevQueryVersion = acc[queryVersion.name]

    if (!prevQueryVersion || prevQueryVersion.date < queryVersion.date) {
      acc[queryVersion.name] = queryVersion
    }

    return acc
  }, {})


  // Build a list of name + version to check duplicated version existants
  const queryNameVersionList = oldQueries.reduce<string[]>(( acc, query ) => {
    const queryVersion = queryToVersionData(query)
    if (queryVersion.version) {
      acc.push(queryVersion.name + queryVersion.version)
    }
    return acc
  }, [])

  return newQueries.reduce<{
    added: QueryCollection[];
    updated: QueryCollection[];
  }> (
    (acc, query) => {
      const oldQuery = lastOldQueryPerVersion[query.name]

      if (queryNameVersionList.includes(query.name + version)) {
        if (oldQuery != undefined) {
          if (!areEqualQueries(query.query, oldQuery?.query)) {
            throw Error(`Query with name '${query.name}' and version '${version}' already exists with different content. Update version number. \nOld query:\n${oldQuery?.query}\nnew query:\n${query.query}`)
          }
        }
      }

      query.name = addVersionToQueryName(query.name, version)

      // If the queries are equal it's not an update
      const isUpdate = oldQuery?.query ? !areEqualQueries(query.query, oldQuery?.query) : true;

      return {
        added: !!oldQuery ? acc['added'] : acc['added'].concat(query),
        updated: !!oldQuery && isUpdate ? acc['updated'].concat(query) : acc['updated']
      };
    },
    { added: [], updated: [] }
  )
}

function areEqualQueries(query1: string, query2: string): boolean {
  if (query1 == undefined || query2 == undefined) {
    return false;
  }

  return print(parse(query1)) === print(parse(query2));
}

export function getAddedOrUpdatedQueries(
  oldQueries: QueryCollection[],
  newQueries: QueryCollection[],
  version: string
) {
  if (version) {
    return getAddedOrUpdatedQueriesVersion(oldQueries, newQueries, version)
  }

  const oldMap = toMap(oldQueries);

  return newQueries.reduce<{
    added: QueryCollection[];
    updated: QueryCollection[];
  }> (
    (acc, query) => {
      const oldQuery = oldMap.get(query.name);

      return {
        added: !!oldQuery ? acc['added'] : acc['added'].concat(query),
        updated: !!oldQuery && oldQuery !== query.query ? acc['updated'].concat(query) : acc['updated']
      };
    },
    { added: [], updated: [] }
  );
}
