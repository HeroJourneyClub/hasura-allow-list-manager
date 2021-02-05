const chalk = require('chalk');

export function logger(message: string, color: string = 'white') {
  console.log(chalk[color](message));
}
