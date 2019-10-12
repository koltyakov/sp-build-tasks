export const detectProdMode = (): string => {
  const args = process.argv.slice(3);
  const prod = args.filter((arg) => {
    return [ '--ship', '--prod' ].indexOf(arg.toLowerCase()) !== -1;
  }).length > 0;
  if (prod) {
    process.env.NODE_ENV = 'production';
  } else {
    process.env.NODE_ENV = 'development';
  }
  return process.env.NODE_ENV;
};

// Hashed string is in the following format:
// `styles/themes/{{SPBUILD_CUSTOM_THEME:default}}/index.scss`
// where `{{ENV_VAR_NAME:default_value}}`
export const compileEnvHashedString = (template: string): string => {
  const r = /{{(.*?)}}/g;
  const matches: [RegExp, string][] = [];
  let match = r.exec(template);
  while (match !== null) {
    const repl = match[1];
    const [ envVar, defaultValue ] = repl.split(':');
    const value = process.env[envVar] || defaultValue || '';
    matches.push([new RegExp(`{{${repl}}}`, 'g'), value]);
    match = r.exec(template);
  }
  matches.forEach(([r, v]) => template = template.replace(r, v));
  return template;
};
