import colors from 'colors/safe';

export const processStepMessage = (message: string): void => {
  console.log(`\n${colors.yellow('===')} ${colors.green(message)} ${colors.yellow('===')}\n`);
};
