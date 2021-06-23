import * as path from 'path';
import * as compose from 'docker-compose';
import { IDockerComposeOptions } from 'docker-compose';
import * as delay from 'delay';
import { run } from '../';

const adminSecret = 'my-admin-secret';
const hasuraUri = process.env.HASURA_URI || 'http://localhost:8090';
const sourcePathOne = path.resolve(__dirname, 'operations/1/**/*.graphql');
const sourcePathTwo = path.resolve(__dirname, 'operations/2/**/*.graphql');
const composeOptions: IDockerComposeOptions = {
  cwd: path.join(__dirname),
  composeOptions: ['-p hasura-allow-operations-in'],
  log: true,
};

describe('e2e', () => {
  afterEach(async () => {
    await compose.down({
      ...composeOptions,
    });
  });

  describe('clean state', () => {
    beforeEach(async () => {
      await compose.upAll({
        ...composeOptions,
        commandOptions: ['--force-recreate'],
      });
      await delay(3000);
    });

    it('finds GraphQL operations as SDL within .graphql files, and adds them to the Hasura allow list', async () => {
      const report = await run(hasuraUri, adminSecret, sourcePathOne);
      expect(report.existingCount).toBe(0);
      expect(report.addedCount).toBe(3);
      expect(report.collectionCreated).toBe(true);
      expect(JSON.stringify(report, null, 4)).toMatchSnapshot();
    });

    it('optionally includes the introspection query', async () => {
      const report = await run(hasuraUri, adminSecret, sourcePathOne, true);
      expect(report.existingCount).toBe(0);
      expect(report.addedCount).toBe(4);
      expect(report.collectionCreated).toBe(true);
      expect(JSON.stringify(report, null, 4)).toMatchSnapshot();
    });
  });

  describe('previous state', () => {
    beforeEach(async () => {
      await compose.upAll({
        ...composeOptions,
        commandOptions: ['--force-recreate'],
      });
      await delay(2000);
      const report = await run(hasuraUri, adminSecret, sourcePathOne);
      expect(report.addedCount).toBe(3);
    });

    it('finds GraphQL operations as SDL within .graphql files, and adds new items to the Hasura allow list', async () => {
      const report = await run(hasuraUri, adminSecret, sourcePathOne);
      expect(report.existingCount).toBe(3);
      expect(report.collectionCreated).toBe(false);
      expect(report.addedCount).toBe(0);
      expect(JSON.stringify(report, null, 4)).toMatchSnapshot();
    });

    it('allows new queries to be added from different source pointers', async () => {
      const report = await run(hasuraUri, adminSecret, sourcePathTwo, true);
      expect(report.existingCount).toBe(0);
      expect(report.collectionCreated).toBe(false);
      expect(report.addedCount).toBe(2);
      expect(JSON.stringify(report, null, 4)).toMatchSnapshot();
    });
  });

  describe('Hasura unavailable', () => {
    it('throws if the endpoint cannot be reached', async () => {
      expect.assertions(1);
      try {
        await run(hasuraUri, adminSecret, sourcePathOne);
      } catch (error) {
        expect(error.code).toBe('ECONNREFUSED')
      }
    });
  });
});
