# Zilliz AI Agent Integration Guide

本指南展示如何将 Zilliz 节点作为 AI Agent 的工具集成到 n8n 工作流中，实现高效的 RAG 系统。

## 🎯 典型 AI Agent 场景

### 1. 智能客服机器人

#### 工作流架构
```
用户问题 → 问题向量化 → Zilliz 搜索 → 上下文检索 → AI 生成回答 → 返回用户
```

#### 详细步骤

**Step 1: Webhook 接收用户问题**
```javascript
// HTTP Request 节点配置
{
  "method": "POST",
  "url": "/api/chat",
  "body": {
    "question": "如何重置密码？",
    "sessionId": "user_123"
  }
}
```

**Step 2: OpenAI Embeddings 问题向量化**
```javascript
// OpenAI 节点配置
{
  "resource": "embedding",
  "model": "text-embedding-ada-002",
  "input": "{{$json.question}}"
}
```

**Step 3: Zilliz 语义搜索**
```javascript
// Zilliz 节点配置
{
  "operation": "search",
  "collectionName": "faq_knowledge_base",
  "queryVector": "{{$json.data[0].embedding}}",
  "topK": 3,
  "includeMetadata": true,
  "searchFilter": "category == \"password\" or category == \"account\""
}
```

**Step 4: OpenAI Chat 生成回答**
```javascript
// OpenAI Chat 节点配置
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "你是一个专业的客服机器人。基于以下知识库信息回答用户问题：\n{{$('Zilliz').all()[0].json.matches.map(m => m.metadata.text).join('\n')}}"
    },
    {
      "role": "user", 
      "content": "{{$('Webhook').first().json.body.question}}"
    }
  ]
}
```

### 2. 文档知识库 RAG 系统

#### 知识库构建流程
```
文档输入 → 文档分块 → 内容向量化 → Zilliz 存储 → 索引构建
```

**Step 1: 文档分块处理**
```javascript
// Code 节点 - 文档分块
const text = $input.first().json.content;
const chunkSize = 1000;
const chunks = [];

for (let i = 0; i < text.length; i += chunkSize) {
  chunks.push({
    id: `chunk_${i/chunkSize}`,
    text: text.substring(i, i + chunkSize),
    source: $input.first().json.filename,
    chunkIndex: i/chunkSize
  });
}

return chunks.map(chunk => ({ json: chunk }));
```

**Step 2: 批量向量化**
```javascript
// OpenAI Embeddings 节点
{
  "resource": "embedding",
  "model": "text-embedding-ada-002", 
  "input": "{{$json.text}}"
}
```

**Step 3: Zilliz 批量存储**
```javascript
// Zilliz Upsert 节点
{
  "operation": "upsert",
  "collectionName": "document_knowledge_base",
  "vectors": [
    {
      "ID": "{{$json.id}}",
      "vector": "{{$json.embedding}}",
      "metadata": {
        "text": "{{$json.text}}",
        "source": "{{$json.source}}",
        "chunkIndex": "{{$json.chunkIndex}}",
        "timestamp": "{{new Date().toISOString()}}"
      }
    }
  ]
}
```

### 3. 多模态搜索 AI Agent

#### 支持文本和图像的搜索
```
文本查询 → 文本向量化 → Zilliz 搜索 → 结果排序 → 多模态展示
图像查询 → 图像向量化 → Zilliz 搜索 → 相似图像 → 结果返回
```

**图像向量化示例**
```javascript
// HTTP Request 到图像向量化服务
{
  "method": "POST",
  "url": "https://api.openai.com/v1/embeddings", // 或其他图像嵌入服务
  "headers": {
    "Authorization": "Bearer {{$credentials.openai.apiKey}}"
  },
  "body": {
    "model": "clip-vit-base-patch32", // 假设的图像模型
    "input": "{{$json.imageBase64}}"
  }
}
```

## 🔧 高级配置

### 混合搜索策略

#### 语义 + 关键词搜索
```javascript
// 组合多个搜索结果
const semanticResults = $('Zilliz_Semantic').all()[0].json.matches;
const keywordResults = $('Zilliz_Keyword').all()[0].json.matches;

// 结果融合算法
const combinedResults = mergeSearchResults(semanticResults, keywordResults);

return [{ json: { matches: combinedResults } }];
```

### 动态过滤优化

#### 基于用户角色的过滤
```javascript
// Zilliz Search 节点 - 动态过滤
{
  "operation": "search",
  "searchFilter": `access_level <= ${$json.userRole} and department == "${$json.userDepartment}"`,
  "topK": 5
}
```

### 缓存策略

#### Redis 缓存热门查询
```javascript
// Function 节点 - 查询缓存检查
const queryHash = crypto.createHash('md5').update($json.query).digest('hex');
const cacheKey = `search_cache:${queryHash}`;

// 检查缓存
const cachedResult = await $('Redis').get(cacheKey);
if (cachedResult) {
  return [{ json: JSON.parse(cachedResult) }];
}

// 如果没有缓存，继续执行搜索
return [$input.first()];
```

## 📊 性能优化

### 1. 批量操作优化
```javascript
// 优化前：逐个插入
for (const doc of documents) {
  await zillizUpsert(doc);
}

// 优化后：批量插入
const batchSize = 100;
for (let i = 0; i < documents.length; i += batchSize) {
  const batch = documents.slice(i, i + batchSize);
  await zillizBatchUpsert(batch);
}
```

### 2. 搜索参数调优
```javascript
{
  "topK": 5,              // 较小的 K 值提高响应速度
  "includeVectors": false, // 不返回向量数据减少传输
  "outputFields": ["text", "source"] // 只返回需要的字段
}
```

## 🛡️ 错误处理

### AI Agent 容错机制
```javascript
// Function 节点 - 错误处理
try {
  const searchResults = $('Zilliz').all()[0].json.matches;
  
  if (!searchResults || searchResults.length === 0) {
    return [{
      json: {
        response: "抱歉，我暂时找不到相关信息。请尝试换个问法。",
        fallback: true
      }
    }];
  }
  
  return [{ json: { searchResults, success: true } }];
  
} catch (error) {
  return [{
    json: {
      response: "系统暂时无法处理您的请求，请稍后重试。",
      error: error.message,
      fallback: true
    }
  }];
}
```

## 🎨 用户体验优化

### 渐进式搜索结果
```javascript
// WebSocket 节点 - 实时结果推送
{
  "event": "search_progress",
  "data": {
    "status": "searching",
    "progress": 50,
    "partialResults": searchResults.slice(0, 2)
  }
}
```

### 搜索结果排序
```javascript
// Function 节点 - 智能排序
const results = $json.matches.map(match => ({
  ...match,
  relevanceScore: calculateRelevance(match, $json.query),
  recencyScore: calculateRecency(match.metadata.timestamp),
  popularityScore: match.metadata.viewCount || 0
}));

// 综合排序
results.sort((a, b) => {
  const scoreA = a.relevanceScore * 0.6 + a.recencyScore * 0.3 + a.popularityScore * 0.1;
  const scoreB = b.relevanceScore * 0.6 + b.recencyScore * 0.3 + b.popularityScore * 0.1;
  return scoreB - scoreA;
});

return [{ json: { matches: results } }];
```

## 🔄 部署和监控

### 生产环境配置
```javascript
// 环境变量配置
{
  "zillizCluster": "{{$env.ZILLIZ_CLUSTER_ENDPOINT}}",
  "maxRetries": 3,
  "timeoutMs": 30000,
  "batchSize": 100
}
```

### 监控指标
- 搜索延迟
- 搜索准确率
- 缓存命中率
- 用户满意度评分

### 日志记录
```javascript
// Function 节点 - 结构化日志
const logEntry = {
  timestamp: new Date().toISOString(),
  sessionId: $json.sessionId,
  query: $json.query,
  searchLatency: $json.searchTime,
  resultCount: $json.matches.length,
  userFeedback: $json.feedback
};

console.log(JSON.stringify(logEntry));
```

## 📈 扩展场景

### 1. 多语言支持
```javascript
// 语言检测和处理
const language = detectLanguage($json.query);
const collectionName = `knowledge_base_${language}`;
```

### 2. 个性化推荐
```javascript
// 基于用户历史的个性化搜索
{
  "searchFilter": `category in ${JSON.stringify(userPreferences)} or tags overlap ["${userTags.join('","')}"]`
}
```

### 3. 实时学习
```javascript
// 基于用户反馈优化搜索
if ($json.userFeedback === 'positive') {
  // 增加相关文档的权重
  await updateDocumentWeight($json.documentId, +0.1);
}
```

## 💡 最佳实践总结

1. **分层架构**: 将知识检索、内容生成、结果优化分离
2. **缓存策略**: 合理使用缓存减少重复计算
3. **错误恢复**: 实现优雅的降级和重试机制
4. **监控告警**: 建立完善的性能和质量监控
5. **用户反馈**: 持续收集和利用用户反馈优化系统

这个指南帮助您构建企业级的 AI Agent 系统，充分利用 Zilliz 的向量搜索能力。
