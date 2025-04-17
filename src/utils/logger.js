// src/utils/logger.js
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create log file name with current date
const getLogFileName = () => {
  const date = new Date();
  return path.join(logsDir, `bot-${format(date, 'yyyy-MM-dd')}.log`);
};

const logToFile = (level, message) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  
  fs.appendFileSync(getLogFileName(), logEntry);
};

const logger = {
  info: (message) => {
    console.log(`\x1b[36m[INFO]\x1b[0m ${message}`);
    logToFile('info', message);
  },
  
  warn: (message) => {
    console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`);
    logToFile('warn', message);
  },
  
  error: (message, error = null) => {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
    if (error) {
      console.error(error);
      logToFile('error', `${message} - ${error.message}\n${error.stack}`);
    } else {
      logToFile('error', message);
    }
  },
  
  debug: (message) => {
    if (process.env.DEBUG === 'true') {
      console.debug(`\x1b[90m[DEBUG]\x1b[0m ${message}`);
      logToFile('debug', message);
    }
  }
};

module.exports = logger;