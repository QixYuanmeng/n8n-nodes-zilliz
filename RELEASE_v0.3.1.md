# 🎉 n8n-nodes-zilliz v0.3.1 发布公告

## 修复内容

### 🔧 关键修复
- **修复包加载错误**: 解决了 n8n 中 "The specified package could not be loaded" 的错误
- **补充 RAG 节点导出**: 在 `index.js` 中添加了缺失的 `VectorStoreZillizRAG` 节点导出
- **版本更新**: 更新到 v0.3.1 以修复加载问题

## 功能特性（完整版本）

### 🎯 RAG 知识库构建
- ✅ **文档清洗**: 自动清理 HTML 标签、标准化文本格式
- ✅ **智能分块**: 支持可配置的文本分块策略，保持语义完整性
- ✅ **向量化存储**: 批量处理文档，保存向量和元数据
- ✅ **语义检索**: 高效的相似度搜索和结果过滤
- ✅ **AI Agent 集成**: 为 AI Agent 优化的上下文格式化输出

### 📦 包含的节点
1. **VectorStoreZilliz** - 基础向量数据库操作
2. **VectorStoreZillizInsert** - 向量数据插入
3. **VectorStoreZillizLoad** - 向量数据搜索和查询
4. **VectorStoreZillizRAG** - RAG 知识库构建和检索 🆕

### 🚀 RAG 节点操作
- `createKnowledgeBase` - 创建优化的知识库集合
- `processAndStore` - 文档处理、分块、向量化存储
- `semanticSearch` - 语义相似度搜索
- `queryWithContext` - AI Agent 上下文查询

## 安装方法

### npm 安装
```bash
npm install n8n-nodes-zilliz@0.3.1
```

### n8n 社区节点安装
1. 打开 n8n 管理界面
2. 进入 **Settings** → **Community Nodes**
3. 输入包名: `n8n-nodes-zilliz`
4. 点击 **Install**

## 快速开始

### 1. 配置凭证
- **API Key**: 您的 Zilliz Cloud API 密钥
- **Cluster Endpoint**: 集群端点 URL

### 2. RAG 工作流示例
```
文档输入 → OpenAI Embeddings → RAG processAndStore → 知识库
用户查询 → OpenAI Embeddings → RAG queryWithContext → AI Agent → 回答
```

## 文档链接

- **完整文档**: [README.md](https://github.com/QixYuanmeng/n8n-nodes-zilliz/blob/master/README.md)
- **RAG 使用指南**: [RAG_GUIDE.md](https://github.com/QixYuanmeng/n8n-nodes-zilliz/blob/master/RAG_GUIDE.md)
- **使用示例**: [USAGE.md](https://github.com/QixYuanmeng/n8n-nodes-zilliz/blob/master/USAGE.md)
- **GitHub 仓库**: https://github.com/QixYuanmeng/n8n-nodes-zilliz
- **npm 包**: https://www.npmjs.com/package/n8n-nodes-zilliz

## 支持的用例

### 🎯 AI Agent & RAG 应用
- 企业文档问答系统
- 智能客服知识库
- 技术文档助手
- 学术研究辅助工具

### 🔧 向量数据库操作
- 向量数据存储和检索
- 语义相似度搜索
- 大规模向量数据管理
- 集合和索引管理

## 技术特性
- **完整的 TypeScript 支持**
- **Zilliz Cloud RESTful API 兼容**
- **批量数据处理能力**
- **完善的错误处理**
- **n8n 最佳实践遵循**

## 反馈和支持

如有问题或建议，请通过以下方式联系：
- **GitHub Issues**: https://github.com/QixYuanmeng/n8n-nodes-zilliz/issues
- **邮箱**: 3286046540@qq.com

---

**感谢使用 n8n-nodes-zilliz！** 🙏

现在您可以在 n8n 中构建强大的 RAG 应用和 AI Agent 工作流了！
