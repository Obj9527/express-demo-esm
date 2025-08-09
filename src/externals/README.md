# 外部系统集成分层架构

这个项目采用了清晰的分层架构来处理外部系统集成，主要分为以下几层：

## 📁 目录结构

```
src/externals/
├── java-system/           # Java主系统集成
│   ├── clients/           # HTTP客户端层
│   │   └── BugApiClient.ts
│   ├── services/          # 业务服务层
│   │   └── BugService.ts
│   ├── utils/             # 工具层
│   │   ├── signature.ts
│   │   └── externalErrorHandler.ts
│   └── index.ts           # 统一导出和初始化
└── payment-system/        # 支付系统集成
    └── client.ts
```

## 🏗️ 分层说明

### 1. **clients/** - HTTP客户端层
- **职责**: 负责底层HTTP通信、认证、请求拦截等
- **特点**: 
  - 只关心如何发送请求和处理响应
  - 包含认证逻辑（如签名生成）
  - 提供通用的HTTP方法（GET、POST、PUT、DELETE）
  - 不包含业务逻辑

### 2. **services/** - 业务服务层
- **职责**: 封装业务逻辑，调用clients，处理业务规则
- **特点**:
  - 调用client层发送请求
  - 处理业务相关的数据转换
  - 统一的错误处理
  - 提供类型安全的接口

### 3. **utils/** - 工具层
- **职责**: 通用工具函数，如签名生成、错误处理等
- **特点**:
  - 可复用的工具函数
  - 无状态函数
  - 可以被其他层调用

### 4. **controllers/** - 控制器层
- **职责**: 处理HTTP请求，调用service层，返回响应
- **特点**:
  - 处理请求参数验证
  - 调用service层方法
  - 格式化响应数据

## 🔧 使用示例

### 初始化外部系统

```typescript
import { initializeExternalSystems } from './config/external-systems';

// 在应用启动时初始化
initializeExternalSystems();
```

### 在控制器中使用

```typescript
import { JavaSystemIntegration } from '../externals/java-system';

// 获取服务实例
const bugService = JavaSystemIntegration.getInstance().getBugService();

// 调用业务方法
const bugs = await bugService.getBugs({ page: 1, pageSize: 10 });
```

### 在路由中注册

```typescript
import bugRoutes from './routes/bug';

app.use('/api', bugRoutes);
```

## 🎯 设计原则

1. **单一职责**: 每层只负责自己的职责
2. **依赖注入**: service层依赖client层，通过构造函数注入
3. **类型安全**: 使用TypeScript提供完整的类型定义
4. **错误处理**: 统一的错误处理机制
5. **可测试性**: 每层都可以独立测试
6. **可扩展性**: 易于添加新的外部系统或新的功能

## 🔄 数据流

```
HTTP Request → Controller → Service → Client → External API
                    ↓           ↓        ↓
HTTP Response ← Controller ← Service ← Client ← External API Response
```

## 🚀 优势

1. **清晰的职责分离**: 每层都有明确的职责
2. **易于维护**: 修改某层不影响其他层
3. **易于测试**: 可以针对每层编写单元测试
4. **代码复用**: utils层可以在多个地方复用
5. **类型安全**: 完整的TypeScript类型支持
6. **统一管理**: 外部系统的配置和初始化集中管理

## 🔍 与原架构对比

**原架构问题**:
- client.ts混合了HTTP通信和业务逻辑
- 命名不清晰（client包含了business logic）
- 难以测试和维护

**新架构优势**:
- 清晰的分层和职责分离
- 更好的代码组织
- 易于扩展和维护
- 符合软件设计原则
