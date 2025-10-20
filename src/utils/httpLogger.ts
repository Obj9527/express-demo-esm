import morgan from 'morgan';
import logger from './logger.js';

// 将 Morgan 的日志输出到 Winston
const stream = {
  write: (message: string) => logger.info(message.trim()),
};

const httpLogger = morgan('combined', { stream });

export { httpLogger };
