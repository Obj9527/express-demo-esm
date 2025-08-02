import { createLogger, format, transports } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

// 通用格式
const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) =>
        `${timestamp} [${level.toUpperCase()}] ${message}`
    )
)

// Info 日志：按天滚动
const infoTransport = new DailyRotateFile({
    filename: 'logs/info-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,
    maxSize: '20m',
    maxFiles: '7d', // 保留 7 天
    level: 'info'
})

// Warn 日志：按天滚动
// const warnTransport = new DailyRotateFile({
//     filename: 'logs/warn-%DATE%.log',
//     datePattern: 'YYYY-MM-DD',
//     zippedArchive: false,
//     maxSize: '20m',
//     maxFiles: '14d', // 错误日志可保留更久
//     level: 'warn'
// })

// Error 日志：按天滚动
const errorTransport = new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,
    maxSize: '20m',
    maxFiles: '14d', // 错误日志可保留更久
    level: 'error'
})

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) =>
            `${timestamp} [${level.toUpperCase()}] ${message}`
        )
    ),
    transports: [
        new transports.Console(),
        infoTransport,
        errorTransport
    ]
})

export default logger