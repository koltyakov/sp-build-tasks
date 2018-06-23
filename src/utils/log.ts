import * as colors from 'colors';

export const processStepMessage = (message: string): void => {
  console.log(`\n${colors.yellow('===')} ${colors.green(message)} ${colors.yellow('===')}\n`);
};
