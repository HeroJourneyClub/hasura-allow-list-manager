import { QueryCollection } from './QueryCollection';

export function hasuraService(api: Api) {
  return {
    async replaceQueryFromCollection(
      collectionQuery: QueryCollection
    ): Promise<any> {
      await api.dropQueryFromCollection(collectionQuery);
      return api.addQueryToCollection(collectionQuery);
    },
  };
}
