import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';
import axios from 'axios';

export class VectorStoreZillizLoad implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zilliz Vector Store Load',
		name: 'vectorStoreZillizLoad',
		icon: 'file:zilliz.svg',
		group: ['AI'],
		version: 1,
		description: 'Load and search documents from Zilliz Vector Store',
		defaults: {
			name: 'Zilliz Vector Store Load',
		},
		// @ts-ignore - Using legacy format for compatibility
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
				required: true,
				default: '',
				description: 'Name of the collection to search in',
			},
			{
				displayName: 'Query Vector',
				name: 'queryVector',
				type: 'json',
				default: '[]',
				description: 'Vector to search for similar documents (array of numbers)',
			},
			{
				displayName: 'Search Limit',
				name: 'searchLimit',
				type: 'number',
				default: 10,
				description: 'Maximum number of results to return',
			},
			{
				displayName: 'Output Fields',
				name: 'outputFields',
				type: 'string',
				default: '*',
				description: 'Comma-separated list of fields to return (use * for all fields)',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Filter Expression',
						name: 'filter',
						type: 'string',
						default: '',
						description: 'Filter expression to limit search results',
					},
					{
						displayName: 'Search Parameters',
						name: 'searchParams',
						type: 'json',
						default: '{}',
						description: 'Additional search parameters as JSON object',
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
				const collectionName = this.getNodeParameter('collectionName', i) as string;
				const queryVector = this.getNodeParameter('queryVector', i) as number[];
				const searchLimit = this.getNodeParameter('searchLimit', i) as number;
				const outputFields = this.getNodeParameter('outputFields', i) as string;
				const options = this.getNodeParameter('options', i) as {
					filter?: string;
					searchParams?: any;
				};

				const credentials = await this.getCredentials('zillizApi');
				const clusterEndpoint = credentials.clusterEndpoint as string;
				const apiKey = credentials.apiKey as string;

				const axiosConfig = {
					headers: {
						'Authorization': `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
				};

				// Prepare search request
				const searchRequest: any = {
					collectionName,
					vector: queryVector,
					limit: searchLimit,
					outputFields: outputFields === '*' ? ['*'] : outputFields.split(',').map(f => f.trim()),
				};

				// Add filter if provided
				if (options.filter) {
					searchRequest.filter = options.filter;
				}

				// Add additional search parameters
				if (options.searchParams) {
					Object.assign(searchRequest, options.searchParams);
				}

				const response = await axios.post(
					`${clusterEndpoint}/v1/vector/search`,
					searchRequest,
					axiosConfig
				);

				const searchResults = response.data;

				// Process results
				if (searchResults.data && Array.isArray(searchResults.data)) {
					searchResults.data.forEach((result: any, resultIndex: number) => {
						returnData.push({
							json: {
								...result,
								searchIndex: resultIndex,
								searchQuery: {
									vector: queryVector,
									limit: searchLimit,
									collection: collectionName,
								},
							},
							pairedItem: { item: i },
						});
					});
				} else {
					returnData.push({
						json: {
							results: searchResults,
							searchQuery: {
								vector: queryVector,
								limit: searchLimit,
								collection: collectionName,
							},
						},
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						pairedItem: { item: i },
					});
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Search failed: ${error.message}`,
						{ itemIndex: i }
					);
				}
			}
		}

		return [returnData];
	}
}
