import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError, NodeConnectionType } from 'n8n-workflow';
import axios from 'axios';

export class VectorStoreZillizInsert implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zilliz Vector Store Insert',
		name: 'vectorStoreZillizInsert',
		icon: 'file:zilliz.svg',
		group: ['transform'],
		version: 1,
		description: 'Insert vectors into Zilliz Vector Store',
		defaults: {
			name: 'Zilliz Vector Store Insert',
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
				description: 'Name of the collection to insert vectors into',
			},
			{
				displayName: 'Input Data Mode',
				name: 'inputMode',
				type: 'options',
				options: [
					{
						name: 'From Input Data',
						value: 'inputData',
						description: 'Use data from the input',
					},
					{
						name: 'Specify Data',
						value: 'specifyData',
						description: 'Manually specify the data to insert',
					},
				],
				default: 'inputData',
				description: 'How to provide the data for insertion',
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
						inputMode: ['specifyData'],
					},
				},
			},
			{
				displayName: 'Vector Field',
				name: 'vectorField',
				type: 'string',
				default: 'vector',
				description: 'Field name that contains the vector data',
				displayOptions: {
					show: {
						inputMode: ['inputData'],
					},
				},
			},
			{
				displayName: 'ID Field',
				name: 'idField',
				type: 'string',
				default: 'id',
				description: 'Field name that contains the ID (optional, will auto-generate if not provided)',
				displayOptions: {
					show: {
						inputMode: ['inputData'],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Batch Size',
						name: 'batchSize',
						type: 'number',
						default: 100,
						description: 'Number of vectors to insert in each batch',
						typeOptions: {
							minValue: 1,
							maxValue: 1000,
						},
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('zillizApi');
		const collectionName = this.getNodeParameter('collectionName', 0) as string;
		const inputMode = this.getNodeParameter('inputMode', 0) as string;
		const options = this.getNodeParameter('options', 0) as any;

		const baseURL = credentials.clusterEndpoint as string;
		const apiKey = credentials.apiKey as string;

		const headers = {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		};

		let dataToInsert: any[] = [];

		if (inputMode === 'specifyData') {
			dataToInsert = this.getNodeParameter('data', 0) as any[];
			if (!Array.isArray(dataToInsert) || dataToInsert.length === 0) {
				throw new NodeOperationError(this.getNode(), 'Data must be a non-empty array');
			}
		} else {
			// Extract data from input items
			const vectorField = this.getNodeParameter('vectorField', 0) as string;
			const idField = this.getNodeParameter('idField', 0) as string;

			for (let i = 0; i < items.length; i++) {
				const item = items[i].json;
				
				if (!item[vectorField]) {
					throw new NodeOperationError(this.getNode(), `Vector field '${vectorField}' not found in item ${i}`, {
						itemIndex: i,
					});
				}

				const vectorData: any = {
					...item,
				};

				// Ensure we have an id field
				if (idField && item[idField]) {
					vectorData.id = item[idField];
				} else if (!vectorData.id) {
					vectorData.id = i + 1; // Auto-generate ID
				}

				dataToInsert.push(vectorData);
			}
		}

		const batchSize = options.batchSize || 100;
		const batches = [];

		// Split data into batches
		for (let i = 0; i < dataToInsert.length; i += batchSize) {
			batches.push(dataToInsert.slice(i, i + batchSize));
		}

		let totalInserted = 0;
		const results = [];

		for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
			const batch = batches[batchIndex];

			try {
				const requestBody = {
					collectionName,
					data: batch,
				};

				const response = await axios.post(`${baseURL}/v2/vectordb/entities/insert`, requestBody, { headers });
				const result = response.data;
				
				totalInserted += batch.length;
				results.push({
					batchIndex: batchIndex + 1,
					batchSize: batch.length,
					...result,
				});

			} catch (error: any) {
				if (this.continueOnFail()) {
					results.push({
						batchIndex: batchIndex + 1,
						batchSize: batch.length,
						error: error.message,
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), `Failed to insert batch ${batchIndex + 1}: ${error.message}`);
			}
		}

		returnData.push({
			json: {
				success: true,
				totalItems: dataToInsert.length,
				totalBatches: batches.length,
				totalInserted,
				results,
			},
		});

		return [returnData];
	}
}
