# Zilliz n8n Nodes Usage Examples

## Example 1: Basic Vector Search Workflow

This example demonstrates how to create a collection, insert vectors, and perform similarity search.

### Step 1: Create Collection

**Node**: Zilliz Vector Store  
**Operation**: Create Collection

Parameters:
- Collection Name: `document_embeddings`
- Vector Field Name: `embedding`
- Vector Dimension: `1536` (for OpenAI embeddings)
- Metric Type: `COSINE`

### Step 2: Insert Vectors

**Node**: Zilliz Vector Store Insert  
**Input Data Mode**: Specify Data

Sample data:
```json
[
  {
    "embedding": [0.1, 0.2, 0.3, ..., 0.1536],
    "id": 1,
    "text": "Introduction to machine learning",
    "category": "education",
    "author": "John Doe"
  },
  {
    "embedding": [0.2, 0.1, 0.4, ..., 0.2536],
    "id": 2,
    "text": "Advanced neural networks",
    "category": "education", 
    "author": "Jane Smith"
  }
]
```

### Step 3: Search Similar Vectors

**Node**: Zilliz Vector Store Load  
**Query Mode**: Vector Search

Parameters:
- Collection Name: `document_embeddings`
- Vector Field Name: `embedding`
- Query Vector: `[0.15, 0.25, 0.35, ..., 0.1536]`
- Limit: `5`
- Filter Expression: `category == "education"`

## Example 2: Processing External Data

### Workflow: Text Processing Pipeline

1. **HTTP Request** → Get text data from API
2. **Code Node** → Generate embeddings using OpenAI API
3. **Zilliz Vector Store Insert** → Store embeddings
4. **Zilliz Vector Store Load** → Search similar content

### Code Node Example (Generate Embeddings)

```javascript
// In Code Node (Python)
import openai

openai.api_key = "your-openai-api-key"

for item in $input.all():
    text = item.json.text
    
    response = openai.Embedding.create(
        input=text,
        model="text-embedding-ada-002"
    )
    
    embedding = response.data[0].embedding
    
    item.json.embedding = embedding
    
return $input.all()
```

### Insert Node Configuration

**Node**: Zilliz Vector Store Insert  
**Input Data Mode**: From Input Data

Parameters:
- Collection Name: `processed_documents`
- Vector Field: `embedding`
- ID Field: `id`

## Example 3: Search with Metadata Filtering

### Complex Query Example

**Node**: Zilliz Vector Store Load  
**Query Mode**: Vector Search

Parameters:
- Filter Expression: `author == "John Doe" AND category in ["education", "research"] AND id > 100`
- Output Fields: `text,author,category,score`
- Limit: `10`
- Include Distance: `true`

## Example 4: Batch Processing Large Datasets

### For Large Data Ingestion

**Node**: Zilliz Vector Store Insert

Options:
- Batch Size: `500` (adjust based on your data size)
- Input Data Mode: From Input Data

This will automatically split your data into batches of 500 items each.

## Error Handling

Add these settings to handle errors gracefully:

1. **Continue on Fail**: Enable this option in node settings
2. **Error Workflow**: Create a separate workflow to handle failed operations
3. **Retry Logic**: Use the Merge node to retry failed operations

## Performance Tips

1. **Batch Size**: For large datasets, use batch sizes between 100-1000
2. **Indexing**: Ensure proper indexes are created for your query patterns
3. **Filtering**: Use specific filters to reduce search scope
4. **Output Fields**: Only return fields you need to reduce bandwidth

## Common Filter Expressions

```
# Numeric comparisons
id > 100
score >= 0.8

# String operations
author == "John Doe"
category != "draft"
title like "AI%"

# Array operations
id in [1, 2, 3, 4, 5]
category in ["tech", "science"]

# Compound expressions
author == "John Doe" AND category == "published"
(score > 0.8) OR (author == "expert")
```
