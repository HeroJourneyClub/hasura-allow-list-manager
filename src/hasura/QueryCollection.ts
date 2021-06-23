import { Source } from '@graphql-tools/utils';
import { DefinitionNode, FragmentDefinitionNode, OperationDefinitionNode, visit, print } from 'graphql';

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

export function sourceToQueryCollection(prevQueryCollections: QueryCollection[], source: Source) {
    // Gather any fragment if any
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
  return sources.reduce<QueryCollection[]>((acc, source) => {
    return sourceToQueryCollection(acc, source)
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

export function getChangedQueries(
  oldQueries: QueryCollection[],
  newQueries: QueryCollection[]
) {
  const oldMap = toMap(oldQueries);

  return newQueries.filter(({ query, name }) => {
    const oldQuery = oldMap.get(name);

    return oldQuery !== query;
  });
}
