import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError, NodeConnectionType } from 'n8n-workflow';
import axios from 'axios';

export class VectorStoreZillizLoad implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zilliz Vector Store Load',
		name: 'vectorStoreZillizLoad',
		icon: 'file:zilliz.svg',
		group: ['transform'],
		version: 1,
		description: 'Search and load vectors from Zilliz Vector Store',
		defaults: {
			name: 'Zilliz Vector Store Load',
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
				displayName: 'Collection Name',
				name: 'collectionName',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'my_collection',
				description: 'Name of the collection to search in',
			},
			{
				displayName: 'Vector Field Name',
				name: 'vectorFieldName',
				type: 'string',
				default: 'vector',
				description: 'Name of the vector field in the collection',
			},
			{
				displayName: 'Query Mode',
				name: 'queryMode',
				type: 'options',
				options: [
					{
						name: 'Vector Search',
						value: 'vectorSearch',
						description: 'Search by similarity to a vector',
					},
					{
						name: 'Scalar Query',
						value: 'scalarQuery',
						description: 'Query by scalar field conditions',
					},
				],
				default: 'vectorSearch',
				description: 'Type of query to perform',
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
						queryMode: ['vectorSearch'],
					},
				},
			},
			{
				displayName: 'Query Vector Source',
				name: 'vectorSource',
				type: 'options',
				options: [
					{
						name: 'Specify Vector',
						value: 'specify',
						description: 'Manually specify the query vector',
					},
					{
						name: 'From Input Data',
						value: 'input',
						description: 'Extract vector from input data',
					},
				],
				default: 'specify',
				displayOptions: {
					show: {
						queryMode: ['vectorSearch'],
					},
				},
			},
			{
				displayName: 'Vector Field in Input',
				name: 'inputVectorField',
				type: 'string',
				default: 'vector',
				description: 'Field name in input data that contains the query vector',
				displayOptions: {
					show: {
						queryMode: ['vectorSearch'],
						vectorSource: ['input'],
					},
				},
			},
			{
				displayName: 'Filter Expression',
				name: 'filter',
				type: 'string',
				default: '',
				description: 'Filter expression for metadata filtering',
				placeholder: 'ID > 100 AND category == "text"',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
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
						description: 'Comma-separated list of fields to return in results (use * for all fields)',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						default: 0,
						description: 'Number of results to skip (for pagination)',
						typeOptions: {
							minValue: 0,
						},
					},
					{
						displayName: 'Include Distance',
						name: 'includeDistance',
						type: 'boolean',
						default: true,
						description: 'Whether to include similarity distance in results',
						displayOptions: {
							show: {
								'/queryMode': ['vectorSearch'],
							},
						},
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
				const collectionName = this.getNodeParameter('collectionName', i) as string;
				const vectorFieldName = this.getNodeParameter('vectorFieldName', i) as string;
				const queryMode = this.getNodeParameter('queryMode', i) as string;
				const filter = this.getNodeParameter('filter', i) as string;
				const options = this.getNodeParameter('options', i) as any;

				const baseURL = credentials.clusterEndpoint as string;
				const apiKey = credentials.apiKey as string;

				const headers = {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				};

				let result;

				if (queryMode === 'vectorSearch') {
					const vectorSource = this.getNodeParameter('vectorSource', i) as string;
					let queryVector: number[];

					if (vectorSource === 'input') {
						const inputVectorField = this.getNodeParameter('inputVectorField', i) as string;
						const inputData = items[i].json;
						
						if (!inputData[inputVectorField]) {
							throw new NodeOperationError(this.getNode(), `Vector field '${inputVectorField}' not found in input data`, {
								itemIndex: i,
							});
						}
						
						queryVector = inputData[inputVectorField] as number[];
					} else {
						queryVector = this.getNodeParameter('queryVector', i) as number[];
					}

					if (!Array.isArray(queryVector) || queryVector.length === 0) {
						throw new NodeOperationError(this.getNode(), 'Query vector must be a non-empty array', {
							itemIndex: i,
						});
					}

					const searchRequestBody = {
						collectionName,
						data: [queryVector],
						annsField: vectorFieldName,
						limit: options.limit || 50,
						offset: options.offset || 0,
						outputFields: options.outputFields ? options.outputFields.split(',').map((f: string) => f.trim()) : ['*'],
						...(filter && { filter }),
					};

					try {
						const response = await axios.post(`${baseURL}/v2/vectordb/entities/search`, searchRequestBody, { headers });
						result = response.data;
						
						// Process results to flatten the structure
						if (result.data && Array.isArray(result.data) && result.data.length > 0) {
							const searchResults = result.data[0] || [];
							const processedResults = searchResults.map((item: any) => ({
								...item.entity,
								...(options.includeDistance !== false && { distance: item.distance }),
								id: item.id,
							}));
							
							result.results = processedResults;
							result.total = processedResults.length;
						}
					} catch (error: any) {
						throw new NodeOperationError(this.getNode(), `Failed to search vectors: ${error.message}`, {
							itemIndex: i,
						});
					}
				} else {
					// Scalar query
					if (!filter) {
						throw new NodeOperationError(this.getNode(), 'Filter expression is required for scalar queries', {
							itemIndex: i,
						});
					}

					const queryRequestBody = {
						collectionName,
						filter,
						limit: options.limit || 50,
						offset: options.offset || 0,
						outputFields: options.outputFields ? options.outputFields.split(',').map((f: string) => f.trim()) : ['*'],
					};

					try {
						const response = await axios.post(`${baseURL}/v2/vectordb/entities/query`, queryRequestBody, { headers });
						result = response.data;
						
						// Process results
						if (result.data && Array.isArray(result.data)) {
							result.results = result.data;
							result.total = result.data.length;
						}
					} catch (error: any) {
						throw new NodeOperationError(this.getNode(), `Failed to query entities: ${error.message}`, {
							itemIndex: i,
						});
					}
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
