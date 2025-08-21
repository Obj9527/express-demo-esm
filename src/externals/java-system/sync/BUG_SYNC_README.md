# Bug数据同步服务

本服务提供了Bug数据的双重同步策略：**WebHook实时推送** + **轮询兜底机制**。

## 🚀 快速开始

### 1. 启动应用
```bash
npm run start
```

### 2. 检查同步状态
```bash
curl http://localhost:3000/api/bugs/sync/status
```

### 3. 查看服务健康状态
```bash
curl http://localhost:3000/api/bugs/sync/health
```

## 📋 API接口

### 同步状态查询
```bash
GET /api/bugs/sync/status
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "strategy": "both",
    "polling": {
      "enabled": true,
      "interval": 300000,
      "status": {
        "isRunning": true
      }
    },
    "webhook": {
      "enabled": true,
      "lastReceived": "2025-08-14T10:30:00.000Z",
      "isHealthy": true,
      "timeout": 300000
    }
  },
  "timestamp": "2025-08-14T10:35:00.000Z"
}
```

### 手动触发同步
```bash
POST /api/bugs/sync/trigger
```

### WebHook接收端点
```bash
POST /api/bugs/sync/webhook
```
**注意**: 这个端点供Java系统调用，需要正确的签名验证。

### 服务控制
```bash
# 停止同步服务
POST /api/bugs/sync/stop

# 重启同步服务
POST /api/bugs/sync/restart

# 健康检查
GET /api/bugs/sync/health
```

## ⚙️ 配置说明

### 环境变量配置

在 `.env` 文件中配置以下变量：

```bash
# Bug同步配置
BUG_WEBHOOK_SECRET=your-webhook-secret     # WebHook签名密钥
BUG_SYNC_INTERVAL=300000                   # 轮询间隔（毫秒）

# Java系统API配置
JAVA_SYSTEM_BASE_URL=http://localhost:8080/api
JAVA_SYSTEM_API_KEY=your-api-key
JAVA_SYSTEM_SECRET_KEY=your-secret-key
```

### 同步策略配置

```typescript
const config: BugSyncConfig = {
  strategy: 'both',                    // 'polling' | 'webhook' | 'both'
  polling: {
    intervalMs: 5 * 60 * 1000,        // 5分钟轮询一次
    enabled: true
  },
  webhook: {
    enabled: true,
    secretKey: 'your-secret-key'
  },
  fallbackToPolling: true              // WebHook失败时自动启用轮询
}
```

## 🔄 同步策略说明

### 1. 双重策略 (`both`) - 推荐
- **主要方式**: WebHook实时接收Bug变更
- **兜底机制**: 定期轮询确保数据完整性
- **智能调度**: WebHook正常时降低轮询频率，故障时加强轮询

### 2. 仅WebHook (`webhook`)
- 完全依赖Java系统推送
- 实时性最佳，资源消耗最低
- 适用于网络稳定的环境

### 3. 仅轮询 (`polling`)
- 定期主动拉取数据
- 可靠性高，不依赖外部推送
- 适用于简单的集成场景

## 📊 监控与诊断

### 日志查看
```bash
# 查看实时日志
tail -f logs/info-$(date +%Y-%m-%d).log

# 查看错误日志
tail -f logs/error-$(date +%Y-%m-%d).log
```

### 关键监控指标
- **WebHook健康状态**: 最近5分钟是否收到推送
- **轮询执行状态**: 轮询任务是否正常运行
- **同步成功率**: 数据同步的成功比例
- **数据延迟**: 数据从Java系统到本地的延迟时间

### 常见问题诊断

#### WebHook未接收到数据
1. 检查Java系统是否正确配置WebHook URL
2. 验证网络连接和防火墙设置
3. 确认签名密钥配置正确

#### 轮询同步失败
1. 检查Java系统API是否可访问
2. 验证API密钥和签名配置
3. 查看错误日志获取详细信息

## 🔧 开发和调试

### 本地开发
```bash
# 开发模式启动
npm run dev

# 查看TypeScript编译
npm run build
```

### 测试WebHook
```bash
# 模拟WebHook请求
curl -X POST http://localhost:3000/api/bugs/sync/webhook \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -H "x-timestamp: $(date +%s)000" \
  -H "x-signature: your-calculated-signature" \
  -d '{
    "eventType": "bug.updated",
    "entityType": "bug",
    "entityId": "BUG-123",
    "action": "updated",
    "data": { "id": "BUG-123", "status": "resolved" },
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }'
```

### 性能调优
- 调整轮询间隔 `BUG_SYNC_INTERVAL`
- 优化批量处理大小
- 配置合适的超时时间

## 🚨 生产部署注意事项

1. **安全配置**
   - 使用强密码作为WebHook密钥
   - 定期更换API密钥
   - 启用HTTPS传输

2. **监控告警**
   - 配置同步失败告警
   - 监控WebHook接收频率
   - 设置数据延迟告警

3. **容错处理**
   - 确保fallbackToPolling启用
   - 配置合适的重试策略
   - 定期检查数据完整性

4. **性能优化**
   - 根据业务量调整同步频率
   - 配置数据库连接池
   - 启用日志轮转
