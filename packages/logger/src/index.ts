import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export interface LoggerOptions {
  service: string;
  level?: string;
  enableFileTransport?: boolean;
  logDir?: string;
}

const createLogger = (options: LoggerOptions): winston.Logger => {
  const {
    service,
    level = process.env.LOG_LEVEL || 'info',
    enableFileTransport = process.env.NODE_ENV !== 'development',
    logDir = 'logs',
  } = options;

  const commonFormat = winston.format.printf(({ timestamp, level, service, message, ...meta }) => {
    return `${timestamp} [${service}] ${level.toUpperCase()}: ${message}${
      Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''
    }`;
  });

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.label({ label: service }),
        commonFormat,
      ),
    }),
  ];

  if (enableFileTransport) {
    transports.push(
      new DailyRotateFile({
        dirname: logDir,
        filename: `${service}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );
  }

  return winston.createLogger({
    level,
    transports,
    defaultMeta: { service },
  });
};

export const logger = (service: string, options?: Partial<LoggerOptions>) =>
  createLogger({ service, ...options });

export type CampusLogger = winston.Logger;
