import { QueryCollection } from './QueryCollection';
import { getAllowedQueryCollection } from './Metadata';
import { Api } from './Api';

export function hasuraService(api: Api) {
  return {
    async replaceQueryFromCollection(
      collectionQuery: QueryCollection
    ): Promise<any> {
      await api.dropQueryFromCollection(collectionQuery);
      return api.addQueryToCollection(collectionQuery);
    },
    async getRemoteAllowedQueryCollection() {
      const metadata = (await api.exportMetadata()).data;
      const remoteQueries = await getAllowedQueryCollection(metadata);
      return remoteQueries;
    },
  };
}
