import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { ZillizClient } from '../shared/ZillizClient';
import { zillizCollectionRLC, zillizDatabaseField } from '../shared/descriptions';

export class VectorStoreZilliz implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zilliz Vector Store',
		name: 'vectorStoreZilliz',
		icon: 'file:zilliz.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Work with Zilliz vector database for AI applications',
		defaults: {
			name: 'Zilliz Vector Store',
		},
		inputs: ['main'] as any,
		outputs: ['main'] as any,
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
						name: 'Search Vectors',
						value: 'search',
						description: 'Search for similar vectors',
						action: 'Search for similar vectors',
					},
					{
						name: 'List Collections',
						value: 'listCollections',
						description: 'List all collections in the database',
						action: 'List all collections',
					},
				],
				default: 'search',
			},
			zillizDatabaseField,
			{
				...zillizCollectionRLC,
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
			},

			// Search operation fields
			{
				displayName: 'Query Vector',
				name: 'queryVector',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
				default: '',
				description: 'Vector to search for (array of numbers)',
				placeholder: '[0.1, 0.2, 0.3, 0.4, 0.5]',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
				default: 50,
				description: 'Max number of results to return',
			},
			{
				displayName: 'Filter Expression',
				name: 'filter',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
				default: '',
				description: 'Filter expression to apply (e.g., "ID > 100")',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('zillizApi');
		const zillizClient = new ZillizClient({
			apiKey: credentials.apiKey as string,
			clusterEndpoint: credentials.clusterEndpoint as string,
		});

		for (let i = 0; i < items.length; i++) {
			try {
				const database = this.getNodeParameter('zillizDatabase', i, 'default') as string;

				let result: any;

				switch (operation) {
					case 'search':
						const collectionName = this.getNodeParameter('zillizCollection', i, '', {
							extractValue: true,
						}) as string;
						const queryVectorParam = this.getNodeParameter('queryVector', i) as string;
						const limit = this.getNodeParameter('limit', i, 10) as number;
						const filter = this.getNodeParameter('filter', i, '') as string;

						let queryVector: number[];
						try {
							queryVector = JSON.parse(queryVectorParam);
						} catch (error) {
							throw new NodeOperationError(this.getNode(), 'Invalid JSON in Query Vector parameter', {
								itemIndex: i,
							});
						}

						if (!Array.isArray(queryVector)) {
							throw new NodeOperationError(this.getNode(), 'Query Vector must be an array', {
								itemIndex: i,
							});
						}

						const searchResults = await zillizClient.searchVectors(
							collectionName,
							[queryVector],
							limit,
							filter || undefined,
							undefined,
							database,
						);

						result = { results: searchResults[0] || [] };
						break;
					case 'listCollections':
						const collections = await zillizClient.listCollections(database);
						result = { collections };
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
