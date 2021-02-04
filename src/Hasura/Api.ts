import axios, { AxiosResponse } from 'axios';
import { QueryCollection } from './QueryCollection';

export interface Api {
  createQueryCollection: (
    collectionQueries: QueryCollection[]
  ) => Promise<AxiosResponse>;
  addQueryToCollection: (
    collectionQuery: QueryCollection
  ) => Promise<AxiosResponse>;
  dropQueryFromCollection: (
    collectionQuery: QueryCollection
  ) => Promise<AxiosResponse>;
  addCollectionToAllowList: () => Promise<AxiosResponse>;
  dropCollectionFromAllowList: () => Promise<AxiosResponse>;
  exportMetadata: () => Promise<AxiosResponse>;
}

export function init(hasuraUri: string, adminSecret: string): Api {
  const uri = `${hasuraUri}/v1/query`;
  const collectionName = 'allowed-queries';
  const config = {
    headers: {
      'X-Hasura-Role': 'admin',
      'x-hasura-admin-secret': adminSecret,
    },
  };

  return {
    addQueryToCollection(
      collectionQuery: QueryCollection
    ): Promise<AxiosResponse> {
      return axios.post(
        uri,
        {
          type: 'add_query_to_collection',
          args: {
            collection_name: collectionName, // eslint-disable-line @typescript-eslint/camelcase
            query_name: collectionQuery.name, // eslint-disable-line @typescript-eslint/camelcase
            query: collectionQuery.query,
          },
        },
        config
      );
    },
    createQueryCollection(collectionQueries): Promise<AxiosResponse> {
      return axios.post(
        uri,
        {
          type: 'create_query_collection',
          args: {
            name: collectionName,
            definition: {
              queries: collectionQueries,
            },
          },
        },
        config
      );
    },
    addCollectionToAllowList(): Promise<AxiosResponse> {
      return axios.post(uri, {
        type: 'add_collection_to_allowlist',
        args: {
          collection: collectionName,
        },
        config,
      });
    },
    dropCollectionFromAllowList(): Promise<AxiosResponse> {
      return axios.post(uri, {
        type: 'drop_collection_to_allowlist',
        args: {
          collection: collectionName,
        },
        config,
      });
    },
    exportMetadata(): Promise<AxiosResponse> {
      return axios.post(
        uri,
        {
          type: 'export_metadata',
          args: {},
        },
        config
      );
    },
    dropQueryFromCollection(
      collectionQuery: QueryCollection
    ): Promise<AxiosResponse> {
      return axios.post(
        uri,
        {
          type: 'drop_query_from_collection',
          args: {
            collection_name: collectionName,
            query_name: collectionQuery.name,
          },
        },
        config
      );
    },
  };
}
