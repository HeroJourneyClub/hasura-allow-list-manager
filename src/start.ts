#!/usr/bin/env node
import { run } from './run';
import { question } from './question';
import { init, hasuraService, QueryCollection } from './hasura';
import { getParams } from './cli';

const options = getParams(process.argv);

const hasuraUri = options.host;
const adminSecret = options.adminSecret;
const sourcePath = options.path;
const forceReplace = options.forceReplace;
const allowIntrospection = !!options.allowInstrospection;

if (sourcePath === undefined) {
  throw new Error('Source path must be passed as first argument');
}

if (hasuraUri === undefined) {
  throw new Error('Hasura URI must be passed as the second argument');
}

const api = init(hasuraUri, adminSecret);
const service = hasuraService(api);

function replaceQueries(queries: QueryCollection[]) {
  Promise.all(queries.map(service.replaceQueryFromCollection))
    .then(() => {
      console.log('Queries updated!');
    })
    .catch(e => {
      console.log('Error on update queries!', e);
    });
}

run(hasuraUri, adminSecret, sourcePath, allowIntrospection)
  .then(
    ({
      introspectionAllowed,
      operationDefinitionsFound,
      addedCount,
      existingCount,
      changed,
      changedQueries,
    }) => {
      console.log(
        `Introspection allowed: ${introspectionAllowed} | Found: ${operationDefinitionsFound.length} | Added: ${addedCount} | Existing: ${existingCount} | Changed: ${changed} \n`
      );

      if (process.env.DEBUG) {
        operationDefinitionsFound.forEach(def =>
          console.log(`${def.operation}: ${def.name.value}`)
        );
      }

      if (changed === 0) {
        process.exit(1);
      }

      if (forceReplace) {
        console.log('Forcing queries replacement...');
        replaceQueries(changedQueries);
        return;
      }

      question(
        'Do you want to continue? This will replace the changed queries on Hasura!, y/n -> '
      ).then((answer: string) => {
        if (answer.toLowerCase() === 'y') {
          replaceQueries(changedQueries);
        }
      });
    }
  )
  .catch(error => console.error(error));
