import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { ZillizClient } from '../shared/ZillizClient';
import { zillizCollectionRLC, zillizDatabaseField } from '../shared/descriptions';

export class VectorStoreZillizLoad implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zilliz Vector Store Load',
		name: 'vectorStoreZillizLoad',
		icon: 'file:zilliz.svg',
		group: ['input'],
		version: 1,
		description: 'Search and load vectors from Zilliz vector database',
		defaults: {
			name: 'Zilliz Load',
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
			zillizDatabaseField,
			zillizCollectionRLC,
			{
				displayName: 'Query Vector',
				name: 'queryVector',
				type: 'json',
				default: '',
				description: 'Vector to search for (array of numbers or field name containing the vector)',
				placeholder: '[0.1, 0.2, 0.3] or use {{$json.vector}} for field reference',
			},
			{
				displayName: 'Top K',
				name: 'topK',
				type: 'number',
				default: 10,
				description: 'Number of most similar vectors to return',
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
						description: 'Filter expression to apply (e.g., "ID > 100 and category == \'tech\'")',
					},
					{
						displayName: 'Output Fields',
						name: 'outputFields',
						type: 'string',
						default: '*',
						description: 'Comma-separated list of fields to return (default: all fields)',
					},
					{
						displayName: 'Score Threshold',
						name: 'scoreThreshold',
						type: 'number',
						default: 0,
						description: 'Minimum similarity score threshold (0-1)',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('zillizApi');
		const zillizClient = new ZillizClient({
			apiKey: credentials.apiKey as string,
			clusterEndpoint: credentials.clusterEndpoint as string,
		});

		for (let i = 0; i < items.length; i++) {
			try {
				const database = this.getNodeParameter('zillizDatabase', i, 'default') as string;
				const collectionName = this.getNodeParameter('zillizCollection', i, '', {
					extractValue: true,
				}) as string;
				const queryVectorParam = this.getNodeParameter('queryVector', i) as string;
				const topK = this.getNodeParameter('topK', i, 10) as number;
				const options = this.getNodeParameter('options', i, {}) as {
					filter?: string;
					outputFields?: string;
					scoreThreshold?: number;
				};

				// Parse query vector
				let queryVector: number[];
				try {
					// Try to parse as JSON array first
					if (queryVectorParam.startsWith('[')) {
						queryVector = JSON.parse(queryVectorParam);
					} else {
						// Otherwise, evaluate as expression (e.g., field reference)
						const resolved = this.evaluateExpression(queryVectorParam, i);
						if (Array.isArray(resolved)) {
							queryVector = resolved as number[];
						} else {
							throw new NodeOperationError(
								this.getNode(),
								'Query vector must be an array of numbers',
								{ itemIndex: i },
							);
						}
					}
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid query vector: ${error.message}`,
						{ itemIndex: i },
					);
				}

				if (!Array.isArray(queryVector) || queryVector.length === 0) {
					throw new NodeOperationError(
						this.getNode(),
						'Query vector must be a non-empty array of numbers',
						{ itemIndex: i },
					);
				}

				// Prepare output fields
				const outputFields = options.outputFields === '*' || !options.outputFields
					? undefined
					: options.outputFields.split(',').map((f) => f.trim());

				// Perform search
				const searchResults = await zillizClient.searchVectors(
					collectionName,
					[queryVector],
					topK,
					options.filter || undefined,
					outputFields,
					database,
				);

				const results = searchResults[0] || [];

				// Apply score threshold if specified
				const filteredResults = options.scoreThreshold
					? results.filter((result) => result.distance >= options.scoreThreshold!)
					: results;

				// Transform results into separate output items
				for (const result of filteredResults) {
					returnData.push({
						json: {
							id: result.id,
							score: result.distance,
							...result.entity,
							_metadata: {
								collection: collectionName,
								database,
								searchVector: queryVector,
							},
						},
						pairedItem: { item: i },
					});
				}

				// If no results found, return empty result
				if (filteredResults.length === 0) {
					returnData.push({
						json: {
							message: 'No results found',
							searchVector: queryVector,
							collection: collectionName,
							database,
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
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
