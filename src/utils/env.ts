export const detectProdMode = (): string => {
  const args = process.argv.slice(3);
  const prod = args.filter(arg => {
    return [ '--ship', '--prod' ].indexOf(arg.toLowerCase()) !== -1;
  }).length > 0;
  if (prod) {
    process.env.NODE_ENV = 'production';
  } else {
    process.env.NODE_ENV = 'development';
  }
  return process.env.NODE_ENV;
};
