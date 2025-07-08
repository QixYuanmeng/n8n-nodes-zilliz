# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.5] - 2024-01-07

### Added
- Initial release of n8n-nodes-zilliz
- Three main nodes for Zilliz vector database operations:
  - **VectorStoreZilliz**: Basic vector operations (search, list collections)
  - **VectorStoreZillizInsert**: Specialized for inserting vector data
  - **VectorStoreZillizLoad**: Specialized for searching and loading vectors
- Support for Zilliz Cloud RESTful API
- Comprehensive credential management for API key and cluster endpoint
- Vector similarity search with filtering capabilities
- Batch vector insertion with metadata support
- Collection management operations
- Error handling and validation

### Features
- **Vector Operations**:
  - Insert vectors with metadata
  - Similarity search with configurable parameters
  - Query vectors with filter expressions
  - List collections in database
  
- **Advanced Filtering**:
  - Numeric comparisons (>, <, >=, <=, ==, !=)
  - String matching and pattern matching
  - Array membership checks (in, not in)
  - Complex boolean logic (and, or, not)
  - Metadata field filtering

- **Data Format Support**:
  - JSON array format for vectors
  - Field reference support ({{$json.fieldName}})
  - Flexible metadata handling
  - Automatic type conversion

- **Configuration Options**:
  - Customizable field mappings
  - Configurable output fields
  - Score threshold filtering
  - Batch processing support

### Technical Details
- Built with TypeScript for type safety
- Uses Axios for HTTP requests
- Follows n8n community node standards
- Comprehensive error handling
- Input validation and sanitization
- Proper credential management

### Documentation
- Comprehensive README with setup instructions
- Detailed usage guide (USAGE.md)
- Example workflow templates
- API reference documentation
- Troubleshooting guide

### Compatibility
- n8n version: 1.0.0+
- Node.js version: 20.15+
- Zilliz Cloud API: v2

## [Unreleased]

### Planned Features
- Support for bulk operations
- Advanced indexing options
- Collection creation and schema management
- Vector dimension validation
- Performance optimization
- Additional metric types support
- Hybrid search capabilities
- Vector upsert operations

### Known Issues
- None reported

## Development Notes

### Architecture
```
n8n-nodes-zilliz/
├── credentials/           # Credential types
│   └── ZillizApi.credentials.ts
├── nodes/                # Node implementations
│   ├── shared/           # Shared utilities
│   │   ├── ZillizClient.ts
│   │   └── descriptions.ts
│   ├── VectorStoreZilliz/
│   ├── VectorStoreZillizInsert/
│   └── VectorStoreZillizLoad/
├── dist/                 # Compiled output
├── package.json          # Package configuration
└── README.md            # Main documentation
```

### Build Process
1. TypeScript compilation (`tsc`)
2. Icon copying (`gulp build:icons`)
3. Linting (`eslint`)
4. Testing (planned)

### Contributing Guidelines
- Follow TypeScript strict mode
- Use ESLint configuration
- Add tests for new features
- Update documentation
- Follow semantic versioning

---

For more information, visit the [project repository](https://github.com/QixYuanmeng/n8n-nodes-zilliz).
