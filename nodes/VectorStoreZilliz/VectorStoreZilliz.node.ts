import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError, NodeConnectionType } from 'n8n-workflow';
import axios from 'axios';

export class VectorStoreZilliz implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zilliz Vector Store',
		name: 'vectorStoreZilliz',
		icon: 'file:zilliz.svg',
		group: ['transform'],
		version: 1,
		description: 'Work with your data in Zilliz Vector Store',
		defaults: {
			name: 'Zilliz Vector Store',
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
						name: 'Create Collection',
						value: 'createCollection',
						description: 'Create a new collection',
						action: 'Create a new collection',
					},
					{
						name: 'Delete Collection',
						value: 'deleteCollection',
						description: 'Delete a collection',
						action: 'Delete a collection',
					},
					{
						name: 'Insert Vectors',
						value: 'insert',
						description: 'Insert vectors into collection',
						action: 'Insert vectors into collection',
					},
					{
						name: 'List Collections',
						value: 'listCollections',
						description: 'List all collections',
						action: 'List all collections',
					},
					{
						name: 'Search Vectors',
						value: 'search',
						description: 'Search for similar vectors',
						action: 'Search for similar vectors',
					},
				],
				default: 'search',
			},
			{
				displayName: 'Collection Name',
				name: 'collectionName',
				type: 'string',
				default: '',
				placeholder: 'my_collection',
				description: 'Name of the collection to work with',
				displayOptions: {
					show: {
						operation: ['insert', 'search', 'deleteCollection'],
					},
				},
			},
			{
				displayName: 'Collection Name',
				name: 'newCollectionName',
				type: 'string',
				default: '',
				placeholder: 'my_new_collection',
				description: 'Name of the collection to create',
				displayOptions: {
					show: {
						operation: ['createCollection'],
					},
				},
			},
			{
				displayName: 'Vector Field Name',
				name: 'vectorFieldName',
				type: 'string',
				default: 'vector',
				description: 'Name of the vector field in the collection',
				displayOptions: {
					show: {
						operation: ['insert', 'search', 'createCollection'],
					},
				},
			},
			{
				displayName: 'Vector Dimension',
				name: 'dimension',
				type: 'number',
				default: 1536,
				description: 'Dimension of the vectors',
				displayOptions: {
					show: {
						operation: ['createCollection'],
					},
				},
			},
			{
				displayName: 'Metric Type',
				name: 'metricType',
				type: 'options',
				options: [
					{
						name: 'Cosine',
						value: 'COSINE',
					},
					{
						name: 'L2 (Euclidean)',
						value: 'L2',
					},
					{
						name: 'Inner Product',
						value: 'IP',
					},
				],
				default: 'COSINE',
				description: 'Distance metric for similarity search',
				displayOptions: {
					show: {
						operation: ['createCollection'],
					},
				},
			},
			{
				displayName: 'Data',
				name: 'data',
				type: 'json',
				default: '[]',
				description: 'Array of objects to insert. Each object should have vector field and optional metadata.',
				placeholder: '[{"vector": [0.1, 0.2, ...], "ID": 1, "text": "sample text"}]',
				displayOptions: {
					show: {
						operation: ['insert'],
					},
				},
			},
			{
				displayName: 'Query Vector',
				name: 'queryVector',
				type: 'json',
				default: '[]',
				description: 'Vector to search for similar vectors',
				placeholder: '[0.1, 0.2, 0.3, ...]',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Search Options',
				name: 'searchOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 50,
						description: 'Max number of results to return',
					},
					{
						displayName: 'Output Fields',
						name: 'outputFields',
						type: 'string',
						default: '*',
						description: 'Comma-separated list of fields to return in results',
					},
					{
						displayName: 'Filter Expression',
						name: 'filter',
						type: 'string',
						default: '',
						description: 'Filter expression for metadata filtering',
						placeholder: 'ID > 100',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const credentials = await this.getCredentials('zillizApi');
				const operation = this.getNodeParameter('operation', i) as string;

				const baseURL = credentials.clusterEndpoint as string;
				const apiKey = credentials.apiKey as string;

				const headers = {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				};

				let result;

				switch (operation) {
					case 'listCollections':
						try {
							const response = await axios.post(`${baseURL}/v2/vectordb/collections/list`, {}, { headers });
							result = response.data;
						} catch (error: any) {
							throw new NodeOperationError(this.getNode(), `Failed to list collections: ${error.message}`);
						}
						break;

					case 'createCollection':
						const collectionName = this.getNodeParameter('newCollectionName', i) as string;
						const vectorFieldName = this.getNodeParameter('vectorFieldName', i) as string;
						const dimension = this.getNodeParameter('dimension', i) as number;
						const metricType = this.getNodeParameter('metricType', i) as string;

						const requestBody = {
							collectionName,
							schema: {
								fields: [
									{
										fieldName: 'id',
										dataType: 'Int64',
										isPrimary: true,
										elementTypeParams: {},
									},
									{
										fieldName: vectorFieldName,
										dataType: 'FloatVector',
										elementTypeParams: {
											dim: dimension.toString(),
										},
									},
								],
							},
							indexParams: [
								{
									fieldName: vectorFieldName,
									indexName: `${vectorFieldName}_index`,
									params: {
										index_type: 'AUTOINDEX',
										metric_type: metricType,
									},
								},
							],
						};

						try {
							const response = await axios.post(`${baseURL}/v2/vectordb/collections/create`, requestBody, { headers });
							result = response.data;
						} catch (error: any) {
							throw new NodeOperationError(this.getNode(), `Failed to create collection: ${error.message}`, {
								itemIndex: i,
							});
						}
						break;

					case 'deleteCollection':
						const deleteCollectionName = this.getNodeParameter('collectionName', i) as string;

						try {
							const response = await axios.post(`${baseURL}/v2/vectordb/collections/drop`, 
								{ collectionName: deleteCollectionName }, 
								{ headers }
							);
							result = response.data;
						} catch (error: any) {
							throw new NodeOperationError(this.getNode(), `Failed to delete collection: ${error.message}`, {
								itemIndex: i,
							});
						}
						break;

					case 'insert':
						const insertCollectionName = this.getNodeParameter('collectionName', i) as string;
						const data = this.getNodeParameter('data', i) as any[];

						if (!Array.isArray(data) || data.length === 0) {
							throw new NodeOperationError(this.getNode(), 'Data must be a non-empty array', {
								itemIndex: i,
							});
						}

						const insertRequestBody = {
							collectionName: insertCollectionName,
							data,
						};

						try {
							const response = await axios.post(`${baseURL}/v2/vectordb/entities/insert`, insertRequestBody, { headers });
							result = response.data;
						} catch (error: any) {
							throw new NodeOperationError(this.getNode(), `Failed to insert vectors: ${error.message}`, {
								itemIndex: i,
							});
						}
						break;

					case 'search':
						const searchCollectionName = this.getNodeParameter('collectionName', i) as string;
						const queryVector = this.getNodeParameter('queryVector', i) as number[];
						const searchVectorFieldName = this.getNodeParameter('vectorFieldName', i) as string;
						const searchOptions = this.getNodeParameter('searchOptions', i) as any;

						if (!Array.isArray(queryVector) || queryVector.length === 0) {
							throw new NodeOperationError(this.getNode(), 'Query vector must be a non-empty array', {
								itemIndex: i,
							});
						}

						const searchRequestBody = {
							collectionName: searchCollectionName,
							data: [queryVector],
							annsField: searchVectorFieldName,
							limit: searchOptions.limit || 50,
							outputFields: searchOptions.outputFields ? searchOptions.outputFields.split(',').map((f: string) => f.trim()) : ['*'],
							...(searchOptions.filter && { filter: searchOptions.filter }),
						};

						try {
							const response = await axios.post(`${baseURL}/v2/vectordb/entities/search`, searchRequestBody, { headers });
							result = response.data;
						} catch (error: any) {
							throw new NodeOperationError(this.getNode(), `Failed to search vectors: ${error.message}`, {
								itemIndex: i,
							});
						}
						break;

					default:
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
				}

				returnData.push({
					json: result,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
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
