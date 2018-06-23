export const detectProdMode = (): void => {
  const args = process.argv.splice(3);
  const prod = args.filter(arg => {
    return [ '--ship', '--prod' ].indexOf(arg.toLowerCase()) !== -1;
  }).length > 0;
  if (prod) {
    process.env.NODE_ENV = 'production';
  } else {
    process.env.NODE_ENV = 'development';
  }
};
