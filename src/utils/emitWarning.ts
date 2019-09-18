const originalEmitWarning = process.emitWarning;

process.emitWarning = (warning: string | Error, name?: string, ctor?: Function): void => {
  // console.log({ name, warning });
  if (name === 'DEP0097') {
    // Undertaker uses a deprecated approach that causes NodeJS 10 to print
    // this warning to stderr:
    // "Using a domain property in MakeCallback is deprecated. Use the  async_context
    // variant of MakeCallback or the AsyncResource class instead."
    return;
  }
  originalEmitWarning(warning, name, ctor);
};
