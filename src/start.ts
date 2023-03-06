#!/usr/bin/env node
import { run } from './run';
import { getParams } from './cli';

const options = getParams(process.argv);

const hasuraUri = options.host;
const adminSecret = options.adminSecret;
const sourcePath = options.path;
const forceReplace = options.forceReplace;
const allowIntrospection = !!options.allowInstrospection;
const resetAllowList = !!options.reset
const version = options.version

if (sourcePath === undefined) {
  throw new Error('Source path must be passed as first argument');
}

if (hasuraUri === undefined) {
  throw new Error('Hasura URI must be passed as the second argument');
}

run(hasuraUri, adminSecret, sourcePath, allowIntrospection, resetAllowList, forceReplace, version)
  .then(
    ({
      operationDefinitionsFound,
      addedCount,
      existingCount,
      updated,
    }) => {
      console.log(
        `Introspection allowed: ${allowIntrospection} | Found: ${operationDefinitionsFound.length} | Added: ${addedCount} | Existing: ${existingCount} | Updated: ${updated} \n`
      );

      if (process.env.DEBUG) {
        operationDefinitionsFound.forEach(def =>
          console.log(`${def.operation}: ${def.name.value}`)
        );
      }

      process.exit(0);
    }
  )
  .catch(error => {
    console.error(error);
    process.exitCode = -1
  }
);
