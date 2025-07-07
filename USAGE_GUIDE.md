# Zilliz n8n Node 使用指南

## 快速开始

### 1. 设置凭据

在 n8n 中添加新的 Zilliz API 凭据：

- **Cluster Endpoint**: 您的 Zilliz Cloud 集群端点
  ```
  https://your-cluster-id.api.region.zillizcloud.com
  ```

- **Authentication Method**: 选择认证方式
  - **API Key**: 使用 API 密钥（推荐）
  - **Username and Password**: 使用用户名和密码

### 2. 基本工作流示例

#### 示例 1: 创建集合并插入数据

```javascript
// 工作流步骤：
// 1. Start Node
// 2. Zilliz Node (Create Collection)
// 3. Zilliz Node (Insert Data)
// 4. Zilliz Node (Search)

// 第一步：创建集合
{
  "resource": "collection",
  "operation": "create",
  "collectionName": "documents",
  "schema": {
    "schemaOptions": {
      "enableAutoId": false,
      "enableDynamicField": true
    }
  },
  "fields": [
    {
      "fieldName": "id",
      "dataType": "INT64",
      "isPrimary": true
    },
    {
      "fieldName": "vector",
      "dataType": "FLOAT_VECTOR",
      "dimension": 384
    },
    {
      "fieldName": "text",
      "dataType": "VARCHAR",
      "maxLength": 1000
    }
  ]
}

// 第二步：插入数据
{
  "resource": "vector",
  "operation": "insert",
  "collectionName": "documents",
  "data": [
    {
      "id": 1,
      "vector": [0.1, 0.2, 0.3, /* ... 384个维度 */],
      "text": "人工智能是计算机科学的一个分支"
    },
    {
      "id": 2,
      "vector": [0.4, 0.5, 0.6, /* ... 384个维度 */],
      "text": "机器学习是人工智能的子领域"
    }
  ]
}

// 第三步：搜索相似向量
{
  "resource": "vector",
  "operation": "search",
  "collectionName": "documents",
  "searchVector": [0.15, 0.25, 0.35, /* ... 384个维度 */],
  "limit": 5,
  "outputFields": "id,text"
}
```

#### 示例 2: AI Agent 知识库工作流

```javascript
// 工作流：文档处理 -> 向量化 -> 存储 -> 搜索

// 1. HTTP Request Node (获取文档)
// 2. Function Node (文本分块)
// 3. OpenAI Node (生成向量)
// 4. Zilliz Node (插入向量)
// 5. Manual Trigger (搜索测试)
// 6. OpenAI Node (查询向量化)
// 7. Zilliz Node (搜索相似文档)

// Function Node - 文本分块
const text = $input.first().json.content;
const chunks = text.match(/.{1,500}/g) || [];
return chunks.map((chunk, index) => ({
  json: {
    id: index + 1,
    text: chunk.trim()
  }
}));

// Zilliz Insert Node
{
  "resource": "vector",
  "operation": "insert",
  "collectionName": "knowledge_base",
  "data": "={{ $json.data }}" // 来自前面的向量化数据
}

// Zilliz Search Node
{
  "resource": "vector",
  "operation": "search",
  "collectionName": "knowledge_base",
  "searchVector": "={{ $json.embedding }}", // 来自查询向量化
  "limit": 3,
  "outputFields": "text,metadata",
  "filter": "category == 'technical'"
}
```

### 3. 常用过滤表达式

```javascript
// 数值比较
"score > 0.8"
"id in [1, 2, 3, 4, 5]"
"price between 100 and 500"

// 字符串匹配
"category == 'tech'"
"title like 'AI%'"
"tag in ['machine-learning', 'deep-learning']"

// 组合条件
"category == 'tech' and score > 0.7"
"(type == 'article' or type == 'paper') and published_date > '2023-01-01'"

// 动态字段（使用 $meta）
"$meta['custom_field'] == 'value'"
"custom_field == 'value'" // 也可以直接使用
```

### 4. 错误处理

```javascript
// 在 Function Node 中处理 Zilliz 响应
if ($input.first().json.error) {
  throw new Error(`Zilliz error: ${$input.first().json.error}`);
}

// 检查搜索结果
const results = $input.first().json.data;
if (!results || results.length === 0) {
  return [{
    json: { message: "No similar documents found" }
  }];
}

return results.map(result => ({
  json: {
    id: result.id,
    score: result.distance,
    content: result.entity.text
  }
}));
```

### 5. 性能优化建议

1. **批量操作**: 一次插入多条数据而不是逐条插入
2. **字段选择**: 只返回需要的字段以减少传输时间
3. **过滤优化**: 使用索引字段进行过滤
4. **向量维度**: 根据实际需求选择合适的向量维度

### 6. 集成示例

#### 与 OpenAI 集成
```javascript
// OpenAI Embeddings -> Zilliz Insert
{
  "model": "text-embedding-ada-002",
  "input": "{{ $json.text }}"
}
// 结果传递给 Zilliz Insert Node
```

#### 与 Webhooks 集成
```javascript
// Webhook -> Zilliz Search -> HTTP Response
// 实现实时搜索 API
```

#### 与数据库集成
```javascript
// MySQL/PostgreSQL -> Vector Generation -> Zilliz
// 实现现有数据的向量化搜索
```

## 故障排除

### 常见错误

1. **认证失败**: 检查集群端点和认证信息
2. **向量维度不匹配**: 确保插入的向量维度与集合定义一致
3. **JSON 格式错误**: 验证 JSON 数据格式
4. **集合不存在**: 先创建集合再进行向量操作

### 调试技巧

1. 使用 "Set" node 检查中间数据
2. 启用节点的 "Continue on Fail" 选项
3. 查看 n8n 执行日志
4. 使用 Zilliz Cloud 控制台验证数据
