import "reflect-metadata"
import express from "express"
import { AppDataSource } from "./config/database"

const app = express()

// 初始化数据库连接
AppDataSource.initialize()
  .then(() => {
    console.log("数据库连接成功")
  })
  .catch((error) => console.log("数据库连接失败:", error))

// 中间件配置
app.use(express.json())

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})
