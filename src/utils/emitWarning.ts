const originalEmitWarning: any = process.emitWarning;

(process.emitWarning as any) = (warning: string | Error, type?: string, code?: string, ctor?: Function): void => {
  if (code === 'DEP0097') {
    // Undertaker uses a deprecated approach that causes NodeJS 10 to print
    // this warning to stderr:
    // "Using a domain property in MakeCallback is deprecated. Use the  async_context
    // variant of MakeCallback or the AsyncResource class instead."
    return;
  }
  originalEmitWarning(warning, type, code, ctor);
};
