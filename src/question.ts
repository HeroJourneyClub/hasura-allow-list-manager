import { createInterface } from 'readline';

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.on('close', function () {
  console.log('\nClosing...');
  process.exit(1);
});

export function question(message: string) {
  return new Promise(resolve => {
    readline.question(message, answer => {
      resolve(answer);
      readline.close();
    });
  });
}
