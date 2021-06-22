import { createInterface, Interface } from 'readline';

let readline: Interface | null = null

export function question(message: string) {
  if (readline == null) {
      readline = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      readline.on('close', function () {
        console.log('\nClosing...');
        process.exit(0);
      })
  }

  return new Promise<string>(resolve => {
    readline.question(message, answer => {
      resolve(answer);
      readline.resume();
    });
  });
}
