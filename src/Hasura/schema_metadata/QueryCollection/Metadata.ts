import { QueryCollection } from './QueryCollection';

type Metadata = {
  query_collections: [
    {
      name: string;
      definition: {
        queries: QueryCollection[];
      };
    }
  ];
  [index: string]: any;
};

export function getAllowedQueryCollection(
  metadata: Metadata
): QueryCollection[] {
  const allowedCollection = metadata['query_collections'].find(
    ({ name }) => name === 'allowed-queries'
  );

  if (allowedCollection) {
    return allowedCollection.definition.queries;
  }

  return [];
}
