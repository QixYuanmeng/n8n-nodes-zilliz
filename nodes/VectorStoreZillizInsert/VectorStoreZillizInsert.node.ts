import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';
import axios from 'axios';

export class VectorStoreZillizInsert implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zilliz Vector Store Insert',
		name: 'vectorStoreZillizInsert',
		icon: 'file:zilliz.svg',
		group: ['AI'],
		version: 1,
		description: 'Insert documents into Zilliz Vector Store with RAG support',
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
				required: true,
				default: '',
				description: 'Name of the collection to insert data into',
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
				description: 'Name of the field containing the embedding vector',
			},
			{
				displayName: 'Metadata Fields',
				name: 'metadataFields',
				type: 'string',
				default: '',
				placeholder: 'field1,field2,field3',
				description: 'Comma-separated list of metadata fields to include',
			},
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
						displayName: 'Batch Size',
						name: 'batchSize',
						type: 'number',
						default: 100,
						description: 'Number of documents to insert in each batch',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const collectionName = this.getNodeParameter('collectionName', 0) as string;
		const textField = this.getNodeParameter('textField', 0) as string;
		const vectorField = this.getNodeParameter('vectorField', 0) as string;
		const metadataFields = this.getNodeParameter('metadataFields', 0) as string;
		const options = this.getNodeParameter('options', 0) as {
			clearCollection?: boolean;
			batchSize?: number;
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

		// Clear collection if requested
		if (options.clearCollection) {
			try {
				await axios.post(`${clusterEndpoint}/v1/vector/collections/${collectionName}/clear`, {}, axiosConfig);
			} catch (error) {
				// Collection might not exist, continue
			}
		}

		const batchSize = options.batchSize || 100;
		const metadataFieldList = metadataFields ? metadataFields.split(',').map(f => f.trim()) : [];

		// Process items in batches
		for (let i = 0; i < items.length; i += batchSize) {
			const batch = items.slice(i, i + batchSize);
			const insertData = [];

			for (const item of batch) {
				const itemData = item.json;

				// Prepare document data
				const document: any = {};

				// Add text content
				if (itemData[textField]) {
					document[textField] = itemData[textField];
				}

				// Add vector
				if (itemData[vectorField] && Array.isArray(itemData[vectorField])) {
					document[vectorField] = itemData[vectorField];
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Vector field '${vectorField}' is missing or not an array`,
						{ itemIndex: i }
					);
				}

				// Add metadata fields
				for (const field of metadataFieldList) {
					if (itemData[field] !== undefined) {
						document[field] = itemData[field];
					}
				}

				// Add unique ID if not present
				if (!document.id) {
					document.id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
				}

				insertData.push(document);
			}

			try {
				const response = await axios.post(
					`${clusterEndpoint}/v1/vector/insert`,
					{
						collectionName,
						data: insertData,
					},
					axiosConfig
				);

				returnData.push({
					json: {
						success: true,
						insertedCount: insertData.length,
						batchIndex: Math.floor(i / batchSize),
						response: response.data,
					},
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							success: false,
							error: error.message,
							batchIndex: Math.floor(i / batchSize),
						},
						pairedItem: { item: i },
					});
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Failed to insert batch: ${error.message}`,
						{ itemIndex: i }
					);
				}
			}
		}

		return [returnData];
	}
}
