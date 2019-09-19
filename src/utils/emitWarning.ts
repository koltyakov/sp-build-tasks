const originalEmitWarning: any = process.emitWarning;

process.emitWarning = (...args: any[]): void => {
  const isDEP0097 = args.filter((a) => {
    if (typeof a === 'string' && a === 'DEP0097') {
      return true;
    }
    return false;
  }).length > 0;
  if (isDEP0097) {
    // Undertaker uses a deprecated approach that causes NodeJS 10 to print
    // this warning to stderr:
    // "Using a domain property in MakeCallback is deprecated. Use the  async_context
    // variant of MakeCallback or the AsyncResource class instead."
    return;
  }
  originalEmitWarning(...args);
};
