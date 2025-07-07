import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import { zillizApiRequest } from './GenericFunctions';

export class Zilliz implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zilliz',
		name: 'zilliz',
		icon: 'file:zilliz.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{ $parameter["operation"] }}',
		description: 'Interact with Zilliz Cloud vector database for AI Agent and RAG applications',
		defaults: {
			name: 'Zilliz',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'zillizApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create or Update',
						value: 'upsert',
						description:
							'Create a new record, or update the current one if it already exists (upsert)',
						action: 'Upsert vectors',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete vectors from collection',
						action: 'Delete vectors',
					},
					{
						name: 'Query',
						value: 'query',
						description: 'Query vectors by metadata filter',
						action: 'Query vectors',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search for similar vectors',
						action: 'Search vectors',
					},
					{
						name: 'Setup Collection',
						value: 'setupCollection',
						description: 'Create or manage collection',
						action: 'Setup collection',
					},
				],
				default: 'upsert',
			},
			{
				displayName: 'Collection Name',
				name: 'collectionName',
				type: 'string',
				default: '',
				placeholder: 'my_collection',
				description: 'Name of the Zilliz collection to operate on',
				required: true,
			},
			// Upsert Operation
			{
				displayName: 'Vectors',
				name: 'vectors',
				type: 'json',
				default: '[]',
				placeholder: '[{"ID": "1", "vector": [0.1, 0.2, 0.3], "metadata": {"text": "example"}}]',
				description:
					'Array of vector objects to upsert. Each object should have ID, vector, and optional metadata fields.',
				displayOptions: {
					show: {
						operation: ['upsert'],
					},
				},
				required: true,
			},
			// Search Operation
			{
				displayName: 'Query Vector',
				name: 'queryVector',
				type: 'json',
				default: '[]',
				placeholder: '[0.1, 0.2, 0.3, ...]',
				description: 'The vector to search for similar items',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
				required: true,
			},
			{
				displayName: 'Top K',
				name: 'topK',
				type: 'number',
				default: 10,
				description: 'Number of most similar results to return',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Search Filter',
				name: 'searchFilter',
				type: 'string',
				default: '',
				placeholder: 'category == "documents"',
				description: 'Optional filter expression to apply during search',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Include Metadata',
				name: 'includeMetadata',
				type: 'boolean',
				default: true,
				description: 'Whether to include metadata in search results',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Include Vectors',
				name: 'includeVectors',
				type: 'boolean',
				default: false,
				description: 'Whether to include vector values in search results',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
			},
			// Query Operation
			{
				displayName: 'Query Filter',
				name: 'queryFilter',
				type: 'string',
				default: '',
				placeholder: 'ID in ["1", "2", "3"] or category == "documents"',
				description: 'Filter expression to query specific vectors',
				displayOptions: {
					show: {
						operation: ['query'],
					},
				},
				required: true,
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						operation: ['query'],
					},
				},
			},
			{
				displayName: 'Output Fields',
				name: 'outputFields',
				type: 'string',
				default: '',
				placeholder: 'ID, text, category',
				description: 'Comma-separated list of fields to return (leave empty for all fields)',
				displayOptions: {
					show: {
						operation: ['query'],
					},
				},
			},
			// Delete Operation
			{
				displayName: 'Delete Filter',
				name: 'deleteFilter',
				type: 'string',
				default: '',
				placeholder: 'ID in ["1", "2", "3"]',
				description: 'Filter expression to specify which vectors to delete',
				displayOptions: {
					show: {
						operation: ['delete'],
					},
				},
				required: true,
			},
			// Setup Collection Operation
			{
				displayName: 'Setup Action',
				name: 'setupAction',
				type: 'options',
				options: [
					{
						name: 'Create Collection',
						value: 'create',
						description: 'Create a new collection',
					},
					{
						name: 'Drop Collection',
						value: 'drop',
						description: 'Delete the collection',
					},
					{
						name: 'Get Collection Info',
						value: 'info',
						description: 'Get collection information',
					},
				],
				default: 'create',
				displayOptions: {
					show: {
						operation: ['setupCollection'],
					},
				},
			},
			{
				displayName: 'Vector Dimension',
				name: 'dimension',
				type: 'number',
				default: 768,
				description: 'Dimension of the vectors (required for creating collection)',
				displayOptions: {
					show: {
						operation: ['setupCollection'],
						setupAction: ['create'],
					},
				},
			},
			{
				displayName: 'Metric Type',
				name: 'metricType',
				type: 'options',
				options: [
					{
						name: 'L2 (Euclidean)',
						value: 'L2',
					},
					{
						name: 'IP (Inner Product)',
						value: 'IP',
					},
					{
						name: 'COSINE',
						value: 'COSINE',
					},
				],
				default: 'COSINE',
				description: 'Metric type for vector similarity calculation',
				displayOptions: {
					show: {
						operation: ['setupCollection'],
						setupAction: ['create'],
					},
				},
			},
			{
				displayName: 'Index Type',
				name: 'indexType',
				type: 'options',
				options: [
					{
						name: 'AUTOINDEX',
						value: 'AUTOINDEX',
					},
					{
						name: 'HNSW',
						value: 'HNSW',
					},
					{
						name: 'IVF_FLAT',
						value: 'IVF_FLAT',
					},
					{
						name: 'IVF_PQ',
						value: 'IVF_PQ',
					},
					{
						name: 'IVF_SQ8',
						value: 'IVF_SQ8',
					},
				],
				default: 'AUTOINDEX',
				description: 'Index type for vector search optimization',
				displayOptions: {
					show: {
						operation: ['setupCollection'],
						setupAction: ['create'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0);
		const collectionName = this.getNodeParameter('collectionName', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any;

				switch (operation) {
					case 'upsert':
						responseData = await upsertVectors.call(this, i, collectionName);
						break;
					case 'search':
						responseData = await searchVectors.call(this, i, collectionName);
						break;
					case 'query':
						responseData = await queryVectors.call(this, i, collectionName);
						break;
					case 'delete':
						responseData = await deleteVectors.call(this, i, collectionName);
						break;
					case 'setupCollection':
						responseData = await setupCollection.call(this, i, collectionName);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
				}

				returnData.push({
					json: responseData,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

async function upsertVectors(
	this: IExecuteFunctions,
	itemIndex: number,
	collectionName: string,
): Promise<any> {
	const vectors = this.getNodeParameter('vectors', itemIndex) as any[];

	if (!Array.isArray(vectors) || vectors.length === 0) {
		throw new NodeOperationError(this.getNode(), 'Vectors parameter must be a non-empty array', {
			itemIndex,
		});
	}

	// Transform vectors to Zilliz format
	const data = vectors.map((vec) => {
		if (!vec.id && !vec.ID) {
			throw new NodeOperationError(this.getNode(), 'Each vector must have id or ID field', {
				itemIndex,
			});
		}
		if (!vec.vector) {
			throw new NodeOperationError(this.getNode(), 'Each vector must have vector field', {
				itemIndex,
			});
		}

		const result: any = {
			id: vec.id || vec.ID,
			vector: vec.vector,
		};

		// Add metadata fields
		if (vec.metadata) {
			Object.assign(result, vec.metadata);
		}

		return result;
	});

	const body = {
		collectionName,
		data,
	};

	return await zillizApiRequest.call(this, 'POST', '/v2/vectordb/entities/insert', body);
}

async function searchVectors(
	this: IExecuteFunctions,
	itemIndex: number,
	collectionName: string,
): Promise<any> {
	const queryVector = this.getNodeParameter('queryVector', itemIndex) as number[];
	const topK = this.getNodeParameter('topK', itemIndex, 10) as number;
	const searchFilter = this.getNodeParameter('searchFilter', itemIndex, '') as string;
	const includeMetadata = this.getNodeParameter('includeMetadata', itemIndex, true) as boolean;
	const includeVectors = this.getNodeParameter('includeVectors', itemIndex, false) as boolean;

	if (!Array.isArray(queryVector) || queryVector.length === 0) {
		throw new NodeOperationError(this.getNode(), 'Query vector must be a non-empty array', {
			itemIndex,
		});
	}

	const body: any = {
		collectionName,
		data: [queryVector],
		limit: topK,
		outputFields: ['*'],
	};

	if (searchFilter) {
		body.filter = searchFilter;
	}

	if (!includeVectors) {
		body.outputFields = body.outputFields.filter((field: string) => field !== 'vector');
	}

	const response = await zillizApiRequest.call(this, 'POST', '/v2/vectordb/entities/search', body);

	// Transform response to be more user-friendly
	if (response.data && response.data[0]) {
		return {
			matches: response.data[0].map((match: any) => ({
				id: match.id,
				score: match.distance,
				metadata: includeMetadata ? match : undefined,
				vector: includeVectors ? match.vector : undefined,
			})),
			searchStats: {
				totalResults: response.data[0].length,
				topK,
			},
		};
	}

	return response;
}

async function queryVectors(
	this: IExecuteFunctions,
	itemIndex: number,
	collectionName: string,
): Promise<any> {
	const queryFilter = this.getNodeParameter('queryFilter', itemIndex) as string;
	const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
	const outputFields = this.getNodeParameter('outputFields', itemIndex, '') as string;

	const body: any = {
		collectionName,
		filter: queryFilter,
		limit,
		outputFields: outputFields ? outputFields.split(',').map((f) => f.trim()) : ['*'],
	};

	const response = await zillizApiRequest.call(this, 'POST', '/v2/vectordb/entities/query', body);

	return {
		results: response.data || [],
		queryStats: {
			totalResults: response.data ? response.data.length : 0,
			filter: queryFilter,
			limit,
		},
	};
}

async function deleteVectors(
	this: IExecuteFunctions,
	itemIndex: number,
	collectionName: string,
): Promise<any> {
	const deleteFilter = this.getNodeParameter('deleteFilter', itemIndex) as string;

	const body = {
		collectionName,
		filter: deleteFilter,
	};

	const response = await zillizApiRequest.call(this, 'POST', '/v2/vectordb/entities/delete', body);

	return {
		success: true,
		deletedCount: response.deleteCount || 0,
		filter: deleteFilter,
	};
}

async function setupCollection(
	this: IExecuteFunctions,
	itemIndex: number,
	collectionName: string,
): Promise<any> {
	const setupAction = this.getNodeParameter('setupAction', itemIndex) as string;

	switch (setupAction) {
		case 'create':
			return await createCollection.call(this, itemIndex, collectionName);
		case 'drop':
			return await dropCollection.call(this, collectionName);
		case 'info':
			return await getCollectionInfo.call(this, collectionName);
		default:
			throw new NodeOperationError(this.getNode(), `Unknown setup action: ${setupAction}`, {
				itemIndex,
			});
	}
}

async function createCollection(
	this: IExecuteFunctions,
	itemIndex: number,
	collectionName: string,
): Promise<any> {
	const dimension = this.getNodeParameter('dimension', itemIndex) as number;
	const metricType = this.getNodeParameter('metricType', itemIndex, 'COSINE') as string;
	const indexType = this.getNodeParameter('indexType', itemIndex, 'AUTOINDEX') as string;

	const body = {
		collectionName,
		dimension,
		metricType,
		primaryField: 'id',
		vectorField: 'vector',
	};

	// First create the collection
	await zillizApiRequest.call(this, 'POST', '/v2/vectordb/collections/create', body);

	// Then create index if not AUTOINDEX
	if (indexType !== 'AUTOINDEX') {
		const indexBody = {
			collectionName,
			indexParams: [
				{
					fieldName: 'vector',
					indexName: 'vector_index',
					indexConfig: {
						index_type: indexType,
						metric_type: metricType,
					},
				},
			],
		};

		await zillizApiRequest.call(this, 'POST', '/v2/vectordb/indexes/create', indexBody);
	}

	// Load the collection
	await zillizApiRequest.call(this, 'POST', '/v2/vectordb/collections/load', {
		collectionName,
	});

	return {
		success: true,
		collectionName,
		dimension,
		metricType,
		indexType,
		message: 'Collection created and loaded successfully',
	};
}

async function dropCollection(this: IExecuteFunctions, collectionName: string): Promise<any> {
	const body = {
		collectionName,
	};

	await zillizApiRequest.call(this, 'POST', '/v2/vectordb/collections/drop', body);

	return {
		success: true,
		collectionName,
		message: 'Collection dropped successfully',
	};
}

async function getCollectionInfo(this: IExecuteFunctions, collectionName: string): Promise<any> {
	const body = {
		collectionName,
	};

	const response = await zillizApiRequest.call(
		this,
		'POST',
		'/v2/vectordb/collections/describe',
		body,
	);

	return {
		collectionName,
		info: response,
	};
}
