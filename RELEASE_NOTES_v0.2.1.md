# Release Notes v0.2.1

## 🐛 Bug Fixes

### Fixed Node Structure Issues
- **CRITICAL**: Fixed TypeScript compilation errors with method calls in execute function
- **CRITICAL**: Resolved `this` context issues in private methods
- **Structure**: Moved helper functions outside the class to fix scope problems
- **Types**: Fixed method signature issues and parameter validation

### Code Quality Improvements
- **Lint**: Fixed all ESLint rule violations for consistent code style
- **Format**: Applied Prettier formatting for better code readability
- **Types**: Improved TypeScript type safety and error handling
- **Validation**: Enhanced parameter validation with proper error messages

### Parameter Alignment
- **Naming**: Updated parameter names to use "ID" instead of "id" for consistency
- **Defaults**: Aligned default values with n8n Pinecone node standards
- **Options**: Fixed parameter ordering to match n8n conventions

## 🔧 Technical Changes

### Method Refactoring
- Moved `handleInsert`, `handleRetrieve`, `handleLoad`, `handleUpdate`, `handleDelete` functions outside the class
- Fixed function binding using `.call(this, ...)` pattern
- Improved error handling and validation logic
- Enhanced parameter extraction and processing

### API Integration
- Maintained full compatibility with Zilliz Cloud RESTful API v2
- Preserved all vector operations: insert, search, query, delete, upsert
- Collection management operations remain functional
- Authentication and error handling improved

## 🚀 What's Working Now

### Core Operations
- ✅ **Insert Mode**: Add vectors to collection with field mapping
- ✅ **Retrieve Mode**: Similarity search with query vectors
- ✅ **Load Mode**: Get vectors by filter or IDs
- ✅ **Update Mode**: Upsert existing vectors
- ✅ **Delete Mode**: Remove vectors by filter or IDs

### Data Handling
- ✅ **Field Mapping**: ID, vector, and metadata field mapping from previous nodes
- ✅ **Batch Processing**: Multiple items processing in single execution
- ✅ **Error Handling**: Graceful error handling with `continueOnFail` support
- ✅ **Validation**: Input validation for vectors and parameters

### Compatibility
- ✅ **AI Agent Workflows**: Seamless integration with AI Agent chains
- ✅ **RAG Systems**: Optimized for Retrieval-Augmented Generation
- ✅ **Pinecone Migration**: Similar parameter structure for easy migration

## 📦 Installation

```bash
npm install n8n-nodes-zilliz@0.2.1
```

## 🔗 Related Issues

This release fixes the critical issues reported in v0.2.0:
- TypeScript compilation errors
- Method binding issues
- Parameter validation problems
- Code style inconsistencies

## 🔄 Migration from v0.2.0

No breaking changes - existing workflows will continue to work.
The fix is purely technical and doesn't affect the user interface or API.

## 🎯 Next Steps

- [ ] Add comprehensive unit tests
- [ ] Implement collection management operations
- [ ] Add bulk operations support
- [ ] Enhance error reporting and debugging
- [ ] Add more advanced filtering options
