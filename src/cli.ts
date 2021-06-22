import { Command } from 'commander';

const program = new Command();

program
  .option('-h, --host <host>', 'Hasura URI host')
  .option('-s, --admin-secret <key>', 'Hasura adming secret key')
  .option('-p, --path <path>', 'Source path with gql or graphql files')
  .option(
    '-f, --force-replace',
    'Replace change queries, not asking for continue'
  )
  .option('-i, --allow-introspection', 'Send Introspection query')
  .option('-r, --reset', 'Delete all allow lists before running insert');

export function getParams(args: string[]) {
  program.parse(args);

  return program.opts();
}
