# Zilliz RAG Knowledge Base Guide

这个插件完全支持构建 RAG（Retrieval-Augmented Generation）知识库。通过 `VectorStoreZillizRAG` 节点，你可以实现完整的 RAG 工作流程。

## 🚀 RAG 功能特性

### 1. 数据清洗和预处理
- **HTML 标签清理**：自动去除 HTML 标签和实体
- **文本标准化**：清理多余空格、规范化换行
- **智能分块**：支持多种分块策略，保持语义完整性

### 2. 文档分块处理
- **可配置分块大小**：支持 100-5000 字符的分块大小
- **重叠策略**：分块间可配置重叠，避免语义断裂
- **边界检测**：优先在句子或段落边界分块
- **最小分块限制**：过滤过小的无效分块

### 3. 向量化存储
- **批量插入**：支持大量文档的高效存储
- **元数据保存**：保留文档标题、来源、分块信息等
- **自动索引**：分块编号、字符统计、时间戳等

### 4. 语义检索
- **相似度搜索**：基于向量的语义相似度检索
- **结果过滤**：支持相似度阈值过滤
- **元数据查询**：可包含或排除元数据信息
- **结果排序**：按相似度分数排序

### 5. AI Agent 集成
- **上下文格式化**：为 AI Agent 优化的上下文输出
- **来源标注**：每个检索结果包含来源和相关性分数
- **去重处理**：自动去除重复来源

## 📋 RAG 工作流程

### 步骤 1: 创建知识库
```json
{
  "operation": "createKnowledgeBase",
  "zillizDatabase": "default",
  "zillizCollection": "my_knowledge_base",
  "embeddingSettings": {
    "dimension": 1536,
    "metricType": "COSINE"
  }
}
```

### 步骤 2: 处理并存储文档
```json
{
  "operation": "processAndStore",
  "contentField": "content",
  "titleField": "title",
  "textProcessing": {
    "cleanText": true,
    "removeHtml": true,
    "chunkSize": 1000,
    "chunkOverlap": 200,
    "minChunkSize": 50
  },
  "embeddingSettings": {
    "embeddingField": "embedding"
  }
}
```

### 步骤 3: 语义检索查询
```json
{
  "operation": "semanticSearch",
  "queryText": "用户的问题",
  "queryVector": "[0.1, 0.2, ...]",
  "searchOptions": {
    "maxResults": 5,
    "similarityThreshold": 0.7,
    "includeMetadata": true
  }
}
```

### 步骤 4: AI Agent 上下文查询
```json
{
  "operation": "queryWithContext",
  "queryText": "AI Agent 的查询",
  "queryVector": "[0.1, 0.2, ...]",
  "searchOptions": {
    "maxResults": 3,
    "similarityThreshold": 0.8
  }
}
```

## 🔧 与 Embedding 节点的配合

### 推荐工作流
1. **文档输入** → **Embedding 节点** → **RAG processAndStore**
2. **用户查询** → **Embedding 节点** → **RAG queryWithContext** → **AI Agent**

### Embedding 节点集成示例
```
[文档] → [OpenAI Embeddings] → [Zilliz RAG Store]
[查询] → [OpenAI Embeddings] → [Zilliz RAG Search] → [OpenAI Chat]
```

## 📊 输出格式

### processAndStore 输出
```json
{
  "success": true,
  "processed_document": "文档标题",
  "chunks_created": 15,
  "total_characters": 12000,
  "average_chunk_size": 800,
  "insert_count": 15,
  "insert_ids": ["id1", "id2", ...],
  "collection": "knowledge_base",
  "database": "default"
}
```

### queryWithContext 输出
```json
{
  "query": "用户问题",
  "context_chunks": [
    {
      "content": "相关文本内容",
      "source": "文档标题",
      "relevance": 0.95
    }
  ],
  "context_text": "[Context 1] (Relevance: 0.950, Source: 文档1)\n文本内容\n\n---\n\n[Context 2]...",
  "total_context_length": 2048,
  "sources": ["文档1", "文档2"],
  "collection": "knowledge_base",
  "database": "default"
}
```

## 🎯 使用场景

### 1. 文档问答系统
- 企业内部文档检索
- 技术文档助手
- 产品手册查询

### 2. 智能客服
- FAQ 自动回答
- 客服知识库检索
- 多轮对话上下文

### 3. 内容推荐
- 相似文章推荐
- 个性化内容发现
- 主题相关性分析

### 4. 研究助手
- 学术论文检索
- 研究资料整理
- 文献综述辅助

## ⚡ 性能优化建议

### 分块策略
- **短文档**：chunk_size: 500, overlap: 100
- **长文档**：chunk_size: 1200, overlap: 200
- **技术文档**：chunk_size: 800, overlap: 150

### 检索策略
- **精确查询**：similarity_threshold: 0.85+
- **广泛检索**：similarity_threshold: 0.7+
- **探索性查询**：similarity_threshold: 0.6+

### 批量处理
- **大量文档**：使用批量处理节点
- **实时查询**：单独的检索工作流
- **数据更新**：增量更新策略

## 🔍 调试和监控

### 常见问题
1. **向量缺失**：确保使用 Embedding 节点生成向量
2. **分块过小**：调整 minChunkSize 参数
3. **检索结果少**：降低 similarityThreshold
4. **性能问题**：优化分块大小和索引策略

### 监控指标
- 分块数量和平均大小
- 检索响应时间
- 相似度分数分布
- 上下文长度统计

这个 RAG 节点为 n8n 提供了完整的向量数据库 RAG 解决方案，可以与各种 AI 服务和 Embedding 提供商无缝集成。
