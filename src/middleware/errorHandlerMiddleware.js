import logger from '../utils/logger.js';
import { BusinessError } from '../utils/error.js';
import * as Sentry from '@sentry/node';

export function errorHandler(err, req, res, next) {
  if (err instanceof BusinessError) {
    // 业务错误
    logger.info(`[业务错误] ${err.message}`);
    res.status(200).json({
      code: err.code,
      message: err.message,
      data: null,
    });
  } else {
    // 系统错误
    logger.error(`[系统错误] ${err.stack}`);
    Sentry.captureException(err);
    res.status(500).json({
      code: 5000,
      message: '服务器内部错误，请稍后再试',
      data: null,
    });
  }
}
