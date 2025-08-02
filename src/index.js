import './utils/instrument.js';
import express from 'express';
import userRoutes from './routes/user.js';
import authRoutes from './routes/auth.js';
import './config/env.js';
import {connectDB} from "./db/index.js";
import httpLogger from "./utils/httpLogger.js";
import {errorHandler} from "./middleware/errorHandlerMiddleware.js";

const app = express();
// 放在所有中间件最前面，记录所有请求日志
app.use(httpLogger);
// 解析json数据
app.use(express.json());
// 解析表单
app.use(express.urlencoded({ extended: true }));
// 注册路由
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
// 异常处理中间件
app.use(errorHandler);
// 连接数据库
await connectDB();
// 监听端口
app.listen(process.env.PORT, () => {
  console.log('当前端口号:', process.env.PORT);
  console.log('数据库地址:', process.env.DB_URL);
  console.log('日志等级:', process.env.LOG_LEVEL);
  console.log(`Server is running at http://localhost:${process.env.PORT}`);
});
