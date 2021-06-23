import { QueryCollection } from './QueryCollection';
import { Api } from './Api';

export async function hasuraService(api: Api) {
  const metadata = (await api.exportMetadata()).data
  const allowQueryCollection = metadata['query_collections']?.find(({ name }: { name: string }) => {
    return name == 'allowed-queries'
  });
  const allowListCollection = metadata.allowlist?.find(({ collection }: { collection: string }) => {
    return collection == 'allowed-queries'
  });

  return {
    metadata: metadata,
    hasQueryCollections: !!allowQueryCollection,
    queryCollectionsPresentInAllowList: !!allowListCollection,
    remoteQueries: allowQueryCollection?.definition?.queries,

    async replaceQueryFromCollection(
      collectionQuery: QueryCollection
    ): Promise<any> {
      await api.dropQueryFromCollection(collectionQuery);
      return api.addQueryToCollection(collectionQuery);
    },
  };
}
