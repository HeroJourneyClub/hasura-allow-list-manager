import axios, { AxiosResponse } from 'axios';

export interface Api {
  exportMetadata: () => Promise<AxiosResponse>;
}

export function init(hasuraUri: string, adminSecret: string): Api {
  const uri = `${hasuraUri}/v1/query`;
  const config = {
    headers: {
      'X-Hasura-Role': 'admin',
      'x-hasura-admin-secret': adminSecret,
    },
  };

  return {
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
  };
}
