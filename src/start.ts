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
const maxVersion = options.versionMaxVersion;
const maxVersionDay = options.versionMaxDay;

if (sourcePath === undefined) {
  throw new Error('Source path must be passed as first argument');
}

if (hasuraUri === undefined) {
  throw new Error('Hasura URI must be passed as the second argument');
}

run(hasuraUri, adminSecret, sourcePath, allowIntrospection, resetAllowList, forceReplace, version, maxVersion, maxVersionDay)
  .then(
    ({
      operationDefinitionsFound,
      addedCount,
      existingCount,
      updated,
      removedQueries,
    }) => {
      console.log(
        `Introspection allowed: ${allowIntrospection} | Found: ${operationDefinitionsFound.length} | Added: ${addedCount} | Existing: ${existingCount} | Updated: ${updated} | Removed: ${removedQueries} \n`
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
