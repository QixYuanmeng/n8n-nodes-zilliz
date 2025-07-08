module.exports = {
	credentials: [
		require('./dist/credentials/ZillizApi.credentials.js'),
	],
	nodes: [
		require('./dist/nodes/VectorStoreZilliz/VectorStoreZilliz.node.js'),
		require('./dist/nodes/VectorStoreZillizInsert/VectorStoreZillizInsert.node.js'),
		require('./dist/nodes/VectorStoreZillizLoad/VectorStoreZillizLoad.node.js'),
		require('./dist/nodes/VectorStoreZillizRag/VectorStoreZillizRag.node.js'),
	],
};
