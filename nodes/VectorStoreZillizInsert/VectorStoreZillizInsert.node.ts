import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { ZillizClient, type ZillizVectorData } from '../shared/ZillizClient';
import { zillizCollectionRLC, zillizDatabaseField } from '../shared/descriptions';

export class VectorStoreZillizInsert implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zilliz Vector Store Insert',
		name: 'vectorStoreZillizInsert',
		icon: 'file:zilliz.svg',
		group: ['input'],
		version: 1,
		description: 'Insert vectors into Zilliz vector database',
		defaults: {
			name: 'Zilliz Insert',
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
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Clear Collection',
						name: 'clearCollection',
						type: 'boolean',
						default: false,
						description: 'Whether to clear the collection before inserting new data',
					},
					{
						displayName: 'Text Field',
						name: 'textField',
						type: 'string',
						default: 'text',
						description: 'Name of the field containing the text content',
					},
					{
						displayName: 'Vector Field',
						name: 'vectorField',
						type: 'string',
						default: 'vector',
						description: 'Name of the field containing the vector data',
					},
					{
						displayName: 'Metadata Fields',
						name: 'metadataFields',
						type: 'string',
						default: '',
						description: 'Comma-separated list of additional fields to include as metadata',
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
				const options = this.getNodeParameter('options', i, {}) as {
					clearCollection?: boolean;
					textField?: string;
					vectorField?: string;
					metadataFields?: string;
				};

				const textField = options.textField || 'text';
				const vectorField = options.vectorField || 'vector';
				const metadataFields = options.metadataFields
					? options.metadataFields.split(',').map((f) => f.trim())
					: [];

				// Clear collection if requested
				if (options.clearCollection) {
					try {
						await zillizClient.deleteVectors(collectionName, 'id >= 0', database);
					} catch (error) {
						// Collection might not exist or be empty, continue
					}
				}

				// Prepare vector data from input
				const item = items[i];
				const vectorData: Partial<ZillizVectorData> = {};

				// Add vector
				if (item.json[vectorField]) {
					vectorData.vector = item.json[vectorField] as number[];
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Vector field '${vectorField}' not found in input data`,
						{ itemIndex: i },
					);
				}

				// Add text
				if (item.json[textField]) {
					vectorData.text = item.json[textField] as string;
				}

				// Add metadata fields
				for (const field of metadataFields) {
					if (item.json[field] !== undefined) {
						vectorData[field] = item.json[field];
					}
				}

				// Add any other fields not explicitly handled
				for (const [key, value] of Object.entries(item.json)) {
					if (key !== vectorField && key !== textField && !metadataFields.includes(key)) {
						vectorData[key] = value;
					}
				}

				const result = await zillizClient.insertVectors(collectionName, [vectorData as ZillizVectorData], database);

				returnData.push({
					json: {
						success: true,
						insertCount: result.insertCount,
						insertIds: result.insertIds,
						collection: collectionName,
						database,
					},
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
