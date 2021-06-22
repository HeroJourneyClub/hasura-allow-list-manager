import { Source } from '@graphql-tools/utils';
import { TypeDefinitionNode } from 'graphql';

export interface QueryCollection {
  name: string;
  query: string;
}

function fromToolkitSource(source: Source): QueryCollection {
  const names = source.document.definitions.reduce(
    (prev, curr: TypeDefinitionNode) => prev.concat(curr.name.value),
    [] as string[]
  );
  return {
    name: names.join(' '),
    query: source.rawSDL,
  };
}

export function createQueryCollection(sources: Source[]): QueryCollection[] {
  return sources.map(source => fromToolkitSource(source));
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
