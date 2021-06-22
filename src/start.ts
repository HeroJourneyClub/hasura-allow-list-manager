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
const resetAllowList = !!options.reset

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
      process.exit(0);
    })
    .catch(e => {
      console.log('Error on update queries!', e);
      process.exit(1);
    });
}

run(hasuraUri, adminSecret, sourcePath, allowIntrospection, resetAllowList)
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
        process.exit(0);
        return;
      }

      if (forceReplace) {
        console.log('Forcing queries replacement...');
        replaceQueries(changedQueries);
        return;
      }

      question(
        'Do you want to continue? This will replace the changed queries on Hasura! y/n -> '
      ).then(answer => {
        if (answer.toLowerCase().trim() === 'y') {
          replaceQueries(changedQueries);
        } else {
          process.exit(0);
        }
      });
    }
  )
  .catch(error => console.error(error));
