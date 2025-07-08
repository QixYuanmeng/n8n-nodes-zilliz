// Test script to verify node loading
const path = require('path');

console.log('Testing node loading...');

try {
  // Test loading the main VectorStoreZilliz node
  const VectorStoreZilliz = require('./dist/nodes/VectorStoreZilliz/VectorStoreZilliz.node.js');
  console.log('✅ VectorStoreZilliz loaded successfully:', VectorStoreZilliz.VectorStoreZilliz.name);
  
  // Test loading the Insert node
  const VectorStoreZillizInsert = require('./dist/nodes/VectorStoreZillizInsert/VectorStoreZillizInsert.node.js');
  console.log('✅ VectorStoreZillizInsert loaded successfully:', VectorStoreZillizInsert.VectorStoreZillizInsert.name);
  
  // Test loading the Load node
  const VectorStoreZillizLoad = require('./dist/nodes/VectorStoreZillizLoad/VectorStoreZillizLoad.node.js');
  console.log('✅ VectorStoreZillizLoad loaded successfully:', VectorStoreZillizLoad.VectorStoreZillizLoad.name);
  
  // Test loading the RAG node
  const VectorStoreZillizRag = require('./dist/nodes/VectorStoreZillizRag/VectorStoreZillizRag.node.js');
  console.log('✅ VectorStoreZillizRag loaded successfully:', VectorStoreZillizRag.VectorStoreZillizRag.name);
  
  // Test loading credentials
  const ZillizApi = require('./dist/credentials/ZillizApi.credentials.js');
  console.log('✅ ZillizApi credentials loaded successfully:', ZillizApi.ZillizApi.name);
  
  console.log('\n🎉 All modules loaded successfully!');
  
} catch (error) {
  console.error('❌ Error loading modules:', error);
  process.exit(1);
}
