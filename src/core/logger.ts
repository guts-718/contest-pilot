type Level = "INFO" | "WARN" | "ERROR" | "DEBUG";

function format(level: Level, module: string, message: string) {
  const time = new Date().toISOString();
  return `[${time}] [${level}] [${module}] ${message}`;
}

export const logger = {
  info(module: string, msg: string) {
    console.log(format("INFO", module, msg));
  },

  warn(module: string, msg: string) {
    console.warn(format("WARN", module, msg));
  },

  error(module: string, msg: string) {
    console.error(format("ERROR", module, msg));
  },

  debug(module: string, msg: string) {
    if (process.env.DEBUG === "true") {
      console.log(format("DEBUG", module, msg));
    }
  }
};