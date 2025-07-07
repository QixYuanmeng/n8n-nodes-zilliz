# n8n-nodes-zilliz

这是一个用于连接 Zilliz Cloud 向量数据库的 n8n 社区节点。Zilliz Cloud 是一个完全托管的向量数据库服务，专为 AI 应用程序设计。

## 功能特性

### Collection（集合）操作
- **List**: 列出所有集合
- **Create**: 创建新的集合
- **Get**: 获取集合详细信息
- **Delete**: 删除集合

### Vector（向量）操作
- **Insert**: 向集合中插入向量数据
- **Search**: 基于向量进行相似性搜索
- **Query**: 使用过滤条件查询向量
- **Delete**: 从集合中删除向量

## 安装

```bash
npm install n8n-nodes-zilliz
```

## 凭据配置

在使用此节点之前，您需要配置 Zilliz API 凭据：

1. **集群端点**: 您的 Zilliz Cloud 集群端点 URL
   - 格式: `https://your-cluster-id.api.region.zillizcloud.com`

2. **认证方式**: 选择以下任一方式
   - **API Key**: 使用 Zilliz Cloud API 密钥
   - **Username and Password**: 使用集群用户名和密码

## 使用示例

### 创建集合

1. 选择 `Collection` 资源和 `Create` 操作
2. 输入集合名称
3. 配置字段定义：
   ```json
   [
     {
       "fieldName": "id",
       "dataType": "INT64",
       "isPrimary": true
     },
     {
       "fieldName": "vector",
       "dataType": "FLOAT_VECTOR",
       "dimension": 128
     },
     {
       "fieldName": "text",
       "dataType": "VARCHAR",
       "maxLength": 512
     }
   ]
   ```

### 插入向量数据

1. 选择 `Vector` 资源和 `Insert` 操作
2. 输入集合名称
3. 提供数据（JSON 格式）：
   ```json
   [
     {
       "id": 1,
       "vector": [0.1, 0.2, 0.3, ...],
       "text": "这是一个示例文本"
     },
     {
       "id": 2, 
       "vector": [0.4, 0.5, 0.6, ...],
       "text": "另一个示例文本"
     }
   ]
   ```

### 向量搜索

1. 选择 `Vector` 资源和 `Search` 操作
2. 输入集合名称
3. 提供搜索向量：
   ```json
   [0.1, 0.2, 0.3, ...]
   ```
4. 设置搜索参数：
   - **Limit**: 返回结果数量限制
   - **Filter**: 过滤条件（可选）
   - **Output Fields**: 要返回的字段列表

### 查询向量

1. 选择 `Vector` 资源和 `Query` 操作
2. 输入集合名称
3. 设置查询参数：
   - **Filter**: 过滤条件（必需）
   - **Limit**: 返回结果数量限制
   - **Output Fields**: 要返回的字段列表

## API 文档

更多关于 Zilliz Cloud RESTful API 的信息，请参考：
- [Zilliz Cloud 快速开始](https://docs.zilliz.com.cn/docs/quick-start)
- [Zilliz Cloud RESTful API 参考](https://docs.zilliz.com.cn/reference/restful)

## 支持的数据类型

- **INT64**: 64位整数
- **VARCHAR**: 可变长度字符串
- **FLOAT_VECTOR**: 浮点向量
- **BINARY_VECTOR**: 二进制向量
- **FLOAT**: 浮点数
- **DOUBLE**: 双精度浮点数
- **BOOL**: 布尔值

## 常见用例

1. **AI Agent 知识库**: 存储和检索文档向量
2. **推荐系统**: 基于用户偏好向量进行推荐
3. **图像搜索**: 存储和搜索图像特征向量
4. **语义搜索**: 基于文本语义进行搜索

## 注意事项

- 在插入数据后立即进行搜索可能返回空结果，建议等待一段时间
- 向量字段必须创建索引才能进行搜索
- 确保向量维度与集合定义一致
- 过滤表达式的语法请参考 Zilliz Cloud 文档

## 许可证

MIT

## 贡献

欢迎提交 issue 和 pull request！
