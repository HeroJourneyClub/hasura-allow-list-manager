import * as path from 'path';
import { loadDocuments } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { createQueryCollections } from '../hasura';

async function getSource(pathStr: string) {
  return await loadDocuments(
    path.resolve(__dirname, pathStr),
    {
      loaders: [new GraphQLFileLoader()],
    }
  );
}

describe('createQueryCollections', () => {

  it('generate a query by operation', async () => {
    const sources = await getSource('operations/1/double.graphql')
    expect(sources.length).toBe(1)

    const queryCollections = createQueryCollections(sources);

    expect(queryCollections.length).toBe(2)
    expect(queryCollections).toMatchSnapshot()
  })

  it('handle fragment and move them to end of query', async () => {
    const sources = await getSource('operations/fragments/fragment.graphql')
    const queryCollections = createQueryCollections(sources);
    expect(queryCollections.length).toBe(1)
    expect(queryCollections).toMatchSnapshot()
  })

  it('handle recursive fragment and move them to end of query', async () => {
    const sources = await getSource('operations/fragments/recFragment.graphql')
    const queryCollections = createQueryCollections(sources);
    expect(queryCollections.length).toBe(1)
    expect(queryCollections).toMatchSnapshot()
  })

  it('ignores unused fragment', async () => {
    const sources = await getSource('operations/fragments/unusedFragment.graphql')
    const queryCollections = createQueryCollections(sources);
    expect(queryCollections.length).toBe(1)
    expect(queryCollections).toMatchSnapshot()
  })


  it('ignores other types than operation and fragment', async () => {
    const sources = await getSource('operations/unsupported.graphql')
    const queryCollections = createQueryCollections(sources);
    expect(queryCollections.length).toBe(1)
    expect(queryCollections).toMatchSnapshot()
  })
})
