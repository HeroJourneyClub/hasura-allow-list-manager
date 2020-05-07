import axios, { AxiosResponse } from 'axios';
import { QueryCollection } from './index';

export interface Api {
  createQueryCollection: (
    collectionQueries: QueryCollection[]
  ) => Promise<AxiosResponse>;
  addQueryToCollection: (
    collectionQuery: QueryCollection
  ) => Promise<AxiosResponse>;
}

export function init(hasuraUri: string, adminSecret: string): Api {
  const uri = `${hasuraUri}/v1/query`;
  const collectionName = 'allowed-queries';
  const config = {
    headers: {
      'X-Hasura-Role': 'admin',
      'x-hasura-admin-secret': adminSecret
    }
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
  };
}
