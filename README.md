# n8n-nodes-zilliz

This is an n8n community node. It lets you use Zilliz Cloud vector database in your n8n workflows.

Zilliz Cloud is a fully managed vector database service built on Milvus, designed for storing, indexing, and searching massive vector datasets for AI applications.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This package provides three nodes for working with Zilliz Cloud:

### Zilliz Vector Store
- **List Collections**: List all collections in your Zilliz Cloud instance
- **Create Collection**: Create a new vector collection with specified schema
- **Delete Collection**: Remove a collection from your Zilliz Cloud instance
- **Insert Vectors**: Insert vector data into a collection
- **Search Vectors**: Perform similarity search using vector queries

### Zilliz Vector Store Insert
Specialized node for inserting vector data with additional features:
- Batch processing for large datasets
- Support for both manual data specification and input data extraction
- Automatic ID generation
- Configurable batch sizes

### Zilliz Vector Store Load
Specialized node for querying and retrieving data:
- Vector similarity search
- Scalar field queries with filter expressions
- Pagination support with offset and limit
- Configurable output fields
- Distance calculation inclusion

## Credentials

To use these nodes, you need to set up Zilliz API credentials:

1. Sign up for a [Zilliz Cloud account](https://cloud.zilliz.com.cn/signup)
2. Create a cluster in your Zilliz Cloud console
3. Generate an API key from your cluster settings
4. Get your cluster endpoint URL

In n8n:
1. Go to **Credentials** → **New** → **Zilliz API**
2. Enter your **Cluster Endpoint** (e.g., `https://in03-xxxxxxxx.api.gcp-us-west1.zillizcloud.com`)
3. Enter your **API Key**
4. Test the connection

## Compatibility

- **Minimum n8n version**: 1.0.0
- **Tested with**: n8n 1.0.0+
- **Node.js**: 20.15+

## Usage

### Basic Vector Search Workflow

1. **Create Collection**: Use the Zilliz Vector Store node to create a collection with your desired vector dimensions
2. **Insert Data**: Use the Zilliz Vector Store Insert node to add your vector embeddings
3. **Search**: Use the Zilliz Vector Store Load node to perform similarity searches

### Example Data Format

When inserting vectors, your data should follow this format:

```json
[
  {
    "vector": [0.1, 0.2, 0.3, ...],
    "id": 1,
    "text": "Sample document text",
    "category": "document",
    "metadata": "additional info"
  }
]
```

### Filter Expressions

You can use filter expressions for refined searches:

- `id > 100` - Filter by ID
- `category == "document"` - Exact match
- `id in [1, 2, 3]` - Multiple values
- `category like "doc%"` - Pattern matching
- `id > 100 AND category == "text"` - Compound conditions

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Zilliz Cloud Documentation](https://docs.zilliz.com.cn/docs/quick-start)
* [Zilliz Cloud REST API Reference](https://docs.zilliz.com.cn/reference/restful)
* [Zilliz Cloud Console](https://cloud.zilliz.com.cn/)

## Version History

### 0.1.0
- Initial release
- Support for basic vector operations (create, insert, search, delete collections)
- Three specialized nodes for different use cases
- RESTful API integration
- Batch processing support
- Comprehensive error handling
