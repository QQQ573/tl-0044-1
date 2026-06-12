# 压测说明文档

## 环境准备

### 1. 启动基础设施

```bash
docker-compose up -d
```

确保以下服务正常运行：
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- MinIO: localhost:9000 / localhost:9001
- Mailhog: localhost:1025 / localhost:8025

### 2. 启动后端服务

```bash
cd backend
npm install
npm run migration:run
npm run start:dev
```

服务默认运行在 http://localhost:3000

### 3. 安装压测工具

```bash
cd load-test
npm install
```

## 压测场景

### 场景一：调拨申请创建（50并发）

**测试目的**：验证同一SKU同一批次重复提交防护（Redis分布式锁）

**运行命令**：
```bash
cd load-test
npm run test:create
```

**预期结果**：
- 50并发持续10秒
- 每个请求使用唯一批次号 → 应全部成功（201）
- 若使用相同批次号 → 只有1个成功，其余返回409冲突

**验证点**：
1. Redis分布式锁是否生效
2. 数据库唯一约束是否兜底
3. 并发下的数据一致性

---

### 场景二：审核接口并发（50并发）

**测试目的**：验证乐观锁并发控制

**运行命令**：
```bash
cd load-test
npm run test:approve
```

**预期结果**：
- 50并发持续10秒
- 每条申请只有第一次审核成功（200）
- 后续对同一条申请的审核返回409冲突（乐观锁）
- 冲突响应中包含最新状态供前端刷新

**验证点**：
1. 乐观锁version字段是否自增
2. 并发下是否只有一个审核生效
3. 冲突时是否返回正确的错误信息

---

### 场景三：列表查询（50并发）

**测试目的**：验证查询接口性能

**运行命令**：
```bash
cd load-test
npm run test:query
```

**预期结果**：
- 50并发持续10秒
- 平均响应时间 < 200ms
- P95 响应时间 < 500ms
- 错误率 < 1%

## 压测结果指标说明

| 指标 | 说明 |
|------|------|
| connections | 并发连接数 |
| requests.total | 总请求数 |
| requests.average | 平均每秒请求数（QPS） |
| latency.average | 平均响应时间（ms） |
| latency.p50 | 50%请求响应时间 |
| latency.p95 | 95%请求响应时间 |
| latency.p99 | 99%请求响应时间 |
| 2xx | 成功请求数 |
| 4xx | 客户端错误（含409冲突） |
| 5xx | 服务端错误 |

## 性能优化建议

### 数据库层
1. 确保 `transfers` 表的 `(skuId, batchNo, status)` 复合索引生效
2. 确保 `logistics_tracking` 表的 `(transferId, timestamp)` 索引生效
3. 大表可考虑按时间分表

### 应用层
1. 热点数据可加入 Redis 缓存（如仓库列表、SKU列表）
2. 审批操作可考虑引入消息队列异步处理
3. 附件上传可考虑使用直传模式减少服务端压力

### 部署层
1. 生产环境建议多实例部署 + Nginx 负载均衡
2. 数据库建议主从复制 + 读写分离
3. Redis 建议集群模式

## 扩展压测场景

### 1. 附件上传压测
```bash
# 测试大文件上传吞吐量
# 测试并发上传MinIO连接池
```

### 2. 物流轨迹录入压测
```bash
# 测试在途状态下高并发轨迹点录入
# 验证超时告警是否准确触发
```

### 3. 全链路压测
```bash
# 模拟真实用户操作链路：
# 登录 → 创建申请 → 提交审核 → 审核通过 → 出库 → 录入轨迹 → 入库
```

## 监控建议

压测期间建议监控以下指标：

1. **系统指标**
   - CPU 使用率
   - 内存使用率
   - 网络IO
   - 磁盘IO

2. **数据库指标**
   - 连接数
   - 慢查询
   - 锁等待
   - TPS/QPS

3. **Redis指标**
   - 命中率
   - 连接数
   - 内存使用
   - 命令耗时

4. **应用指标**
   - JVM/Node.js 内存
   - GC 频率
   - 接口响应时间分布
   - 错误率
