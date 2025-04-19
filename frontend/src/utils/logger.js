class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    this.currentLevel = this.levels.info;
  }

  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.currentLevel = this.levels[level];
    }
  }

  error(message, meta = {}) {
    if (this.currentLevel >= this.levels.error) {
      console.error(`[ERROR] ${message}`, meta);
    }
  }

  warn(message, meta = {}) {
    if (this.currentLevel >= this.levels.warn) {
      console.warn(`[WARN] ${message}`, meta);
    }
  }

  info(message, meta = {}) {
    if (this.currentLevel >= this.levels.info) {
      console.info(`[INFO] ${message}`, meta);
    }
  }

  debug(message, meta = {}) {
    if (this.currentLevel >= this.levels.debug) {
      console.debug(`[DEBUG] ${message}`, meta);
    }
  }

  log(level, message, meta = {}) {
    switch (level) {
      case 'error':
        this.error(message, meta);
        break;
      case 'warn':
        this.warn(message, meta);
        break;
      case 'info':
        this.info(message, meta);
        break;
      case 'debug':
        this.debug(message, meta);
        break;
      default:
        console.log(`[${level.toUpperCase()}] ${message}`, meta);
    }
  }
}

export const loggerInstance = new Logger();
export default loggerInstance; 