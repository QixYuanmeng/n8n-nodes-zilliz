# n8n-nodes-zilliz

n8n社区节点包，用于连接Zilliz向量数据库云服务，专为AI Agent和RAG应用设计。

## 🚀 功能特性

### 基础向量操作
- **向量插入**: 将向量数据插入到Zilliz集合中
- **向量搜索**: 基于相似度搜索向量数据
- **向量查询**: 使用过滤条件查询向量数据
- **集合管理**: 创建、列出和管理向量集合

### 🎯 RAG 知识库构建
- **文档清洗**: 自动清理HTML标签、标准化文本格式
- **智能分块**: 支持可配置的文本分块策略，保持语义完整性
- **向量化存储**: 批量处理文档，保存向量和元数据
- **语义检索**: 高效的相似度搜索和结果过滤
- **AI Agent集成**: 为AI Agent优化的上下文格式化输出

### 技术特性
- **完全兼容**: 支持Zilliz Cloud的RESTful API
- **批量处理**: 支持大规模数据的高效处理
- **错误处理**: 完善的错误处理和重试机制
- **类型安全**: 完整的TypeScript类型定义

## 安装

```bash
npm install n8n-nodes-zilliz
```

## 配置

### 凭证设置

1. 在n8n中创建新的凭证
2. 选择 "Zilliz Cloud API"
3. 填入以下信息：
   - **API Key**: 您的Zilliz Cloud API密钥
   - **Cluster Endpoint**: 您的集群端点URL (例如: https://your-cluster-id.api.region.zillizcloud.com)

### 获取凭证信息

1. 登录 [Zilliz Cloud控制台](https://cloud.zilliz.com.cn/)
2. 创建或选择一个集群
3. 在API Keys页面生成API密钥
4. 从集群详情页面复制集群端点URL

## 节点说明

### 1. Zilliz Vector Store Insert

**用途**: 专门用于向向量数据库插入数据

**特点**:
- 支持批量插入
- 自动处理元数据字段
- 可选择清空集合
- 支持自定义批次大小

### 2. Zilliz Vector Store Load

**用途**: 从向量数据库搜索和加载数据

**特点**:
- 向量相似度搜索
- 支持结果过滤
- 可配置返回字段
- 高级搜索参数

### 3. Zilliz Vector Store

**用途**: 综合向量数据库操作节点

**支持操作**:
- Insert Vectors: 插入向量
- Search Vectors: 搜索向量
- Query Vectors: 查询向量
- Delete Vectors: 删除向量
- Create Collection: 创建集合
- List Collections: 列出集合

### 4. Zilliz Vector Store RAG 🎯

**用途**: 专为RAG（检索增强生成）应用设计的综合节点，支持完整的知识库构建和检索流程

**主要操作**:

#### createKnowledgeBase - 创建知识库
为RAG应用创建优化的向量集合

#### processAndStore - 文档处理和存储
完整的文档处理流程：清洗→分块→存储

#### semanticSearch - 语义搜索
基于向量相似度进行语义搜索

#### queryWithContext - AI Agent上下文查询
为AI Agent优化的上下文格式化输出

**RAG工作流示例**:
1. **文档** → **Embedding节点** → **RAG processAndStore**
2. **用户查询** → **Embedding节点** → **RAG queryWithContext** → **AI Agent**

详细使用指南请参考: [USAGE.md](./USAGE.md)

## 使用示例

### 示例1: 文档向量化存储

1. **Document → Text Splitter → Embeddings → Zilliz Insert**
   - 文档分割成块
   - 生成向量嵌入
   - 存储到Zilliz

### 示例2: 语义搜索

1. **HTTP Request → Embeddings → Zilliz Load**
   - 接收用户查询
   - 生成查询向量
   - 搜索相似内容

### 示例3: RAG应用

1. **User Input → Embeddings → Zilliz Load → LLM**
   - 用户输入
   - 向量搜索相关文档
   - 结合上下文生成回答

## 过滤表达式

支持Zilliz的过滤语法:

```javascript
// 数值过滤
"id > 100 and id < 1000"

// 字符串过滤
"category == 'technology'"

// 组合过滤
"score > 0.8 and category in ['tech', 'science']"

// 元数据过滤
"$meta['custom_field'] == 'value'"
```

## 故障排除

### 常见问题

1. **连接失败**: 检查API密钥和集群端点
2. **插入失败**: 验证数据格式和字段类型
3. **搜索无结果**: 检查向量维度和相似度阈值
4. **权限错误**: 确认API密钥有相应操作权限

### 调试技巧

1. 启用"Continue on Fail"查看详细错误
2. 使用"List Collections"测试基本连接
3. 检查向量维度是否匹配集合配置

## 版本历史

### v0.3.2 (当前版本)
- ✅ 修复所有TypeScript类型错误
- ✅ 完善package.json配置
- ✅ 优化构建流程
- ✅ 完整的n8n节点兼容性

### v0.3.1
- ✅ 添加RAG专用节点
- ✅ 支持文档处理和分块
- ✅ 改进错误处理

### v0.2.5
- ✅ 初始版本发布
- ✅ 基础向量操作支持

## 贡献

欢迎提交Issue和Pull Request到项目仓库。

## 许可证

MIT License

## 相关链接

- [Zilliz Cloud官网](https://zilliz.com.cn/cloud)
- [Zilliz API文档](https://docs.zilliz.com.cn/reference/restful)
- [n8n社区节点文档](https://docs.n8n.io/integrations/community-nodes/)
