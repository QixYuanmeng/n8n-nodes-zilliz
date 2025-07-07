# n8n-nodes-zilliz

一个专为 AI Agent 和 RAG 系统设计的 Zilliz Cloud 向量数据库 n8n 社区节点，提供类似 Pinecone 的 AI Agent 工具体验。

## 🚀 为什么选择这个节点？

与传统的数据库节点不同，这个节点专门为 **AI Agent** 和 **RAG 系统**设计，提供：

- 🤖 **AI Agent 工具接口**: 像 Pinecone 节点一样，作为 AI Agent 的专用工具
- 📚 **RAG 系统优化**: 专门针对检索增强生成场景优化的操作
- � **简化的工作流**: 减少复杂的数据库操作，专注于 AI 应用场景
- ⚡ **高性能向量搜索**: 基于 Zilliz Cloud 的企业级向量数据库

## 🎯 核心 AI Agent 操作

### 🛠️ Setup Collection
为 AI Agent 创建向量存储
```
目标：为 RAG 系统准备数据存储
用例：初始化知识库、创建文档索引
```

### 📝 Create or Update (Upsert)
智能文档存储和更新
```
目标：存储知识库内容
用例：导入文档、更新知识库、增量学习
示例数据格式：
[{
  "ID": "doc_1",
  "vector": [0.1, 0.2, 0.3, ...],  // OpenAI 嵌入向量
  "metadata": {
    "text": "这是文档内容",
    "source": "knowledge_base.pdf",
    "category": "技术文档"
  }
}]
```

### 🔍 Search
语义搜索和相似度检索
```
目标：为 AI Agent 提供相关上下文
用例：RAG 检索、相似文档查找、知识检索
输入：查询向量 + Top-K + 过滤条件
输出：相似度得分 + 元数据 + 文档内容
```

### 📋 Query
基于元数据的精确查询
```
目标：按条件检索特定文档
用例：按标签查找、按来源筛选、条件查询
示例过滤：category == "FAQ" and source == "user_manual"
```

### 🗑️ Delete
清理和维护向量存储
```
目标：删除过时或无效的文档
用例：知识库清理、内容更新、空间管理
```

## 🔧 快速开始

### 1. 安装
```bash
npm install n8n-nodes-zilliz
```

### 2. 配置凭据
- **Cluster Endpoint**: `https://your-cluster-id.api.region.zillizcloud.com`
- **Authentication**: API Key 或 用户名密码

### 3. RAG 工作流示例

#### 基本 RAG 工作流
```
文档输入 → OpenAI Embeddings → Zilliz Upsert → 存储完成
### 2. 配置认证
在 n8n 中创建 Zilliz API 凭证：
- **Cluster Endpoint**: https://your-cluster.zillizcloud.com  
- **Authentication**: API Key 或 用户名/密码

### 3. 第一个 AI Agent 工作流

#### 📋 RAG 系统完整流程
```
文档输入 → OpenAI Embeddings → Zilliz Upsert → 知识库构建
查询输入 → OpenAI Embeddings → Zilliz Search → 检索结果 → OpenAI Chat → 回答
```

#### 🛠️ 具体配置示例

**步骤 1: 设置集合（一次性）**
```javascript
// Zilliz - Setup Collection
{
  "operation": "setupCollection",
  "setupAction": "create",
  "collectionName": "ai_knowledge_base",
  "dimension": 1536,        // OpenAI ada-002 维度
  "metricType": "COSINE",   // 余弦相似度
  "indexType": "AUTOINDEX"  // 自动索引优化
}
```

**步骤 2: 知识库构建**
```javascript
// 文档 → OpenAI Embeddings → Zilliz Create or Update
{
  "operation": "upsert",
  "collectionName": "ai_knowledge_base",
  "vectors": [
    {
      "ID": "doc_{{$json.id}}",
      "vector": "={{$json.embedding}}", // 来自 OpenAI Embeddings
      "metadata": {
        "text": "{{$json.content}}",
        "source": "{{$json.source}}",
        "category": "{{$json.category}}",
        "timestamp": "{{new Date().toISOString()}}"
      }
    }
  ]
}
```

**步骤 3: AI Agent 检索**
```javascript
// 用户查询 → OpenAI Embeddings → Zilliz Search
{
  "operation": "search",
  "collectionName": "ai_knowledge_base",
  "queryVector": "={{$json.embedding}}", // 查询的向量化结果
  "topK": 3,                             // 返回最相关的3个结果
  "includeMetadata": true,               // 包含文档内容
  "includeVectors": false,               // 不需要返回向量
  "searchFilter": ""                     // 可选：category == "FAQ"
}
```

**步骤 4: AI 生成回答**
```javascript
// Zilliz 检索结果 → OpenAI Chat (Context + Query)
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system", 
      "content": "基于以下上下文回答用户问题：\n{{$('Zilliz').all().map(item => item.json.matches.map(m => m.metadata.text).join('\n')).join('\n')}}"
    },
    {
      "role": "user",
      "content": "{{$json.query}}"
    }
  ]
}
```

## 🔄 AI Agent 工作流模板

### 模板 1: 智能客服机器人
```
1. Webhook (接收用户问题)
2. OpenAI Embeddings (问题向量化)
3. Zilliz Search (检索相关 FAQ)
4. OpenAI Chat (生成个性化回答)
5. HTTP Response (返回回答)
```

### 模板 2: 文档知识库更新
```
1. HTTP Request (获取新文档)
2. Text Splitter (文档分块)
3. OpenAI Embeddings (文档向量化)
4. Zilliz Upsert (批量存储)
5. Slack (通知更新完成)
```

### 模板 3: 语义搜索API
```
1. Webhook (搜索请求)
2. OpenAI Embeddings (查询向量化)
3. Zilliz Search (语义检索)
4. Data Transform (结果格式化)
5. HTTP Response (返回检索结果)
```

## 🛠️ 高级用法

### 批量文档处理
```javascript
{
  "operation": "upsert",
  "vectors": [
    {
      "ID": "doc1",
      "vector": [0.1, 0.2, ...],
      "metadata": {"text": "内容1", "category": "tech"}
    },
    {
      "ID": "doc2", 
      "vector": [0.3, 0.4, ...],
      "metadata": {"text": "内容2", "category": "science"}
    }
  ]
}
```

### 智能过滤查询
```javascript
{
  "operation": "query",
  "queryFilter": "category == \"FAQ\" and timestamp > \"2024-01-01\"",
  "outputFields": "ID, text, category",
  "limit": 50
}
```

## 🔗 与其他 AI 节点集成

### ✅ OpenAI Embeddings
```
Text Input → OpenAI Embeddings → Zilliz Upsert/Search
```

### ✅ 从 Pinecone 迁移
Zilliz 节点提供与 Pinecone 相似的 API 体验，迁移简单快速。

### ✅ LangChain 工具链
```
LangChain Text Splitter → OpenAI Embeddings → Zilliz Vector Store
```

## � 输出格式

### Search 操作返回
```javascript
{
  "matches": [
    {
      "id": "doc_001",
      "score": 0.95,              // 相似度得分
      "metadata": {               // 文档元数据
        "text": "文档内容...",
        "source": "knowledge_base.pdf",
        "category": "技术文档"
      }
    }
  ],
  "searchStats": {
    "totalResults": 3,
    "topK": 5
  }
}
```

### Query 操作返回
```javascript
{
  "results": [
    {
      "ID": "doc_001",
      "text": "查询到的文档内容",
      "category": "FAQ",
      "timestamp": "2024-01-01"
    }
  ],
  "queryStats": {
    "totalResults": 1,
    "filter": "category == \"FAQ\"",
    "limit": 50
  }
}
```

## 🚨 使用建议

- **向量维度一致性**: 确保所有向量维度与集合配置一致（如 OpenAI ada-002 使用 1536 维）
- **相似度指标**: 推荐使用 COSINE 相似度用于文本嵌入场景
- **批量处理**: 大批量操作建议分批处理，每批不超过 1000 条记录
- **元数据设计**: 合理设计元数据结构，支持后续的过滤和查询需求
- **错误处理**: 在 AI Agent 工作流中启用"Continue on Fail"以提高鲁棒性

## 💡 最佳实践

### 🎯 向量维度选择
- **OpenAI ada-002**: 1536 维，适合通用文本嵌入
- **OpenAI text-embedding-3-small**: 1536 维，更高效
- **自定义模型**: 根据具体模型确定维度

### 🔍 搜索优化
- 使用适当的 Top-K 值（通常 3-10 个结果）
- 结合元数据过滤提高检索精度
- 在 AI Agent 中缓存常用查询结果

### 📊 监控和维护
- 定期检查集合大小和性能
- 监控搜索延迟和准确性
- 及时清理过时的文档数据

## 🌟 与 Pinecone 对比

| 特性 | Zilliz | Pinecone |
|------|--------|----------|
| 🔧 易用性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 💰 成本 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 🚀 性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 🌍 部署选择 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 🔍 过滤功能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## 📖 学习资源

- [Zilliz Cloud 官方文档](https://docs.zilliz.com.cn/)
- [OpenAI Embeddings 指南](https://platform.openai.com/docs/guides/embeddings)
- [RAG 系统设计最佳实践](https://docs.zilliz.com.cn/docs/rag-overview)
- [向量数据库选型指南](https://zilliz.com/learn/what-is-vector-database)

## 🤝 社区支持

- **GitHub Issues**: [报告问题和建议](https://github.com/QixYuanmeng/n8n-nodes-zilliz/issues)
- **讨论区**: [n8n 社区论坛](https://community.n8n.io/)
- **技术支持**: [Zilliz 技术支持](https://zilliz.com/support)

## 🔄 版本历史

- **v0.1.0**: 初始版本，支持基础向量操作
- **当前版本**: AI Agent 优化版本，提供类 Pinecone 体验

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE.md) 文件了解详情。
