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
		displayName: 'Zilliz Vector Store',
		name: 'zilliz',
		icon: 'file:zilliz.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["mode"] }}',
		description: 'Work with your data in Zilliz Cloud Vector Store',
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
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete vectors from collection',
						action: 'Delete vectors from collection',
					},
					{
						name: 'Get Many',
						value: 'load',
						description: 'Load/search vectors from collection',
						action: 'Get many vectors from collection',
					},
					{
						name: 'Insert',
						value: 'insert',
						description: 'Insert vectors into collection',
						action: 'Insert vectors into collection',
					},
					{
						name: 'Retrieve',
						value: 'retrieve',
						description: 'Retrieve vectors with similarity search',
						action: 'Retrieve vectors with similarity search',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update existing vectors in collection',
						action: 'Update vectors in collection',
					},
				],
				default: 'retrieve',
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
			// Insert Mode
			{
				displayName: 'Data Source',
				name: 'dataSource',
				type: 'options',
				displayOptions: {
					show: {
						mode: ['insert'],
					},
				},
				options: [
					{
						name: 'From Previous Node',
						value: 'previous',
						description: 'Use data from previous node',
					},
					{
						name: 'Define Below',
						value: 'define',
						description: 'Define vector data below',
					},
				],
				default: 'previous',
			},
			{
				displayName: 'Vector Data',
				name: 'vectorData',
				type: 'json',
				displayOptions: {
					show: {
						mode: ['insert'],
						dataSource: ['define'],
					},
				},
				default: '[]',
				placeholder: '[{"ID": "1", "vector": [0.1, 0.2, 0.3], "text": "example"}]',
				description:
					'Array of vector objects to insert. Each object should have ID, vector, and optional metadata fields.',
			},
			{
				displayName: 'ID Field',
				name: 'idField',
				type: 'string',
				displayOptions: {
					show: {
						mode: ['insert'],
						dataSource: ['previous'],
					},
				},
				default: 'id',
				description: 'Field name containing the vector ID',
			},
			{
				displayName: 'Vector Field',
				name: 'vectorField',
				type: 'string',
				displayOptions: {
					show: {
						mode: ['insert'],
						dataSource: ['previous'],
					},
				},
				default: 'vector',
				description: 'Field name containing the vector embeddings',
			},
			{
				displayName: 'Metadata Fields',
				name: 'metadataFields',
				type: 'string',
				displayOptions: {
					show: {
						mode: ['insert'],
						dataSource: ['previous'],
					},
				},
				default: '',
				placeholder: 'text,source,category',
				description:
					'Comma-separated list of fields to include as metadata (leave empty for all fields except ID and vector)',
			},
			// Retrieve Mode
			{
				displayName: 'Query Vector',
				name: 'queryVector',
				type: 'json',
				displayOptions: {
					show: {
						mode: ['retrieve'],
					},
				},
				default: '[]',
				placeholder: '[0.1, 0.2, 0.3, ...]',
				description: 'The vector to search for similar items',
				required: true,
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						mode: ['retrieve'],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
			},
			// Load Mode
			{
				displayName: 'Query Type',
				name: 'queryType',
				type: 'options',
				displayOptions: {
					show: {
						mode: ['load'],
					},
				},
				options: [
					{
						name: 'Get by Filter',
						value: 'filter',
						description: 'Query vectors using metadata filter',
					},
					{
						name: 'Get by IDs',
						value: 'ids',
						description: 'Get specific vectors by their IDs',
					},
				],
				default: 'filter',
			},
			{
				displayName: 'Filter Expression',
				name: 'filterExpression',
				type: 'string',
				displayOptions: {
					show: {
						mode: ['load'],
						queryType: ['filter'],
					},
				},
				default: '',
				placeholder: 'category == "documents"',
				description: 'Filter expression to query specific vectors',
			},
			{
				displayName: 'Vector IDs',
				name: 'vectorIds',
				type: 'string',
				displayOptions: {
					show: {
						mode: ['load'],
						queryType: ['ids'],
					},
				},
				default: '',
				placeholder: '1,2,3',
				description: 'Comma-separated list of vector IDs to retrieve',
			},
			{
				displayName: 'Limit',
				name: 'loadLimit',
				type: 'number',
				displayOptions: {
					show: {
						mode: ['load'],
						queryType: ['filter'],
					},
				},
				typeOptions: {
					minValue: 1,
				},
				default: 100,
				description: 'Max number of results to return',
			},
			// Update Mode
			{
				displayName: 'Update Data',
				name: 'updateData',
				type: 'json',
				displayOptions: {
					show: {
						mode: ['update'],
					},
				},
				default: '[]',
				placeholder: '[{"ID": "1", "vector": [0.1, 0.2, 0.3], "text": "updated"}]',
				description: 'Array of vector objects to update',
				required: true,
			},
			// Delete Mode
			{
				displayName: 'Delete Method',
				name: 'deleteMethod',
				type: 'options',
				displayOptions: {
					show: {
						mode: ['delete'],
					},
				},
				options: [
					{
						name: 'By Filter',
						value: 'filter',
						description: 'Delete vectors using filter expression',
					},
					{
						name: 'By IDs',
						value: 'ids',
						description: 'Delete specific vectors by their IDs',
					},
				],
				default: 'filter',
			},
			{
				displayName: 'Delete Filter',
				name: 'deleteFilter',
				type: 'string',
				displayOptions: {
					show: {
						mode: ['delete'],
						deleteMethod: ['filter'],
					},
				},
				default: '',
				placeholder: 'category == "old_data"',
				description: 'Filter expression to specify which vectors to delete',
				required: true,
			},
			{
				displayName: 'Vector IDs to Delete',
				name: 'deleteIds',
				type: 'string',
				displayOptions: {
					show: {
						mode: ['delete'],
						deleteMethod: ['ids'],
					},
				},
				default: '',
				placeholder: '1,2,3',
				description: 'Comma-separated list of vector IDs to delete',
				required: true,
			},
			// Common Options
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Output Fields',
						name: 'outputFields',
						type: 'string',
						default: '',
						placeholder: 'ID,text,category',
						description: 'Comma-separated list of fields to return (leave empty for all fields)',
					},
					{
						displayName: 'Include Vectors',
						name: 'includeVectors',
						type: 'boolean',
						default: false,
						description: 'Whether to include vector values in results',
					},
					{
						displayName: 'Filter Expression',
						name: 'filterExpression',
						type: 'string',
						default: '',
						placeholder: 'category == "documents"',
						description: 'Additional filter to apply to search results',
						displayOptions: {
							show: {
								'/mode': ['retrieve'],
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
		const mode = this.getNodeParameter('mode', 0) as string;
		const collectionName = this.getNodeParameter('collectionName', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any;

				switch (mode) {
					case 'insert':
						responseData = await handleInsert.call(this, i, collectionName, items[i]);
						break;
					case 'retrieve':
						responseData = await handleRetrieve.call(this, i, collectionName);
						break;
					case 'load':
						responseData = await handleLoad.call(this, i, collectionName);
						break;
					case 'update':
						responseData = await handleUpdate.call(this, i, collectionName);
						break;
					case 'delete':
						responseData = await handleDelete.call(this, i, collectionName);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unknown mode: ${mode}`, {
							itemIndex: i,
						});
				}

				// Return multiple items for load/retrieve operations
				if (Array.isArray(responseData)) {
					responseData.forEach((item) => {
						returnData.push({
							json: item,
							pairedItem: { item: i },
						});
					});
				} else {
					returnData.push({
						json: responseData,
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

// Helper functions moved outside the class
async function handleInsert(
	this: IExecuteFunctions,
	itemIndex: number,
	collectionName: string,
	inputItem: INodeExecutionData,
): Promise<any> {
	const dataSource = this.getNodeParameter('dataSource', itemIndex) as string;
	let vectorsToInsert: any[] = [];

	if (dataSource === 'define') {
		vectorsToInsert = this.getNodeParameter('vectorData', itemIndex) as any[];
	} else {
		// Extract from previous node data
		const idField = this.getNodeParameter('idField', itemIndex, 'id') as string;
		const vectorField = this.getNodeParameter('vectorField', itemIndex, 'vector') as string;
		const metadataFieldsParam = this.getNodeParameter('metadataFields', itemIndex, '') as string;

		const metadataFields = metadataFieldsParam
			? metadataFieldsParam.split(',').map((f) => f.trim())
			: Object.keys(inputItem.json).filter((key) => key !== idField && key !== vectorField);

		const vectorData: any = {
			id: inputItem.json[idField],
			vector: inputItem.json[vectorField],
		};

		// Add metadata
		metadataFields.forEach((field) => {
			if (inputItem.json[field] !== undefined) {
				vectorData[field] = inputItem.json[field];
			}
		});

		vectorsToInsert = [vectorData];
	}

	if (!Array.isArray(vectorsToInsert) || vectorsToInsert.length === 0) {
		throw new NodeOperationError(this.getNode(), 'No vector data to insert', {
			itemIndex,
		});
	}

	// Validate vector data
	vectorsToInsert.forEach((vec, index) => {
		if (!vec.id) {
			throw new NodeOperationError(
				this.getNode(),
				`Vector at index ${index} must have an ID field`,
				{
					itemIndex,
				},
			);
		}
		if (!vec.vector || !Array.isArray(vec.vector)) {
			throw new NodeOperationError(
				this.getNode(),
				`Vector at index ${index} must have a vector field with array data`,
				{
					itemIndex,
				},
			);
		}
	});

	const body = {
		collectionName,
		data: vectorsToInsert,
	};

	const response = await zillizApiRequest.call(this, 'POST', '/v2/vectordb/entities/insert', body);

	return {
		success: true,
		insertedCount: vectorsToInsert.length,
		insertIds: response.data?.insertIds || [],
		...response,
	};
}

async function handleRetrieve(
	this: IExecuteFunctions,
	itemIndex: number,
	collectionName: string,
): Promise<any[]> {
	const queryVector = this.getNodeParameter('queryVector', itemIndex) as number[];
	const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
	const options = this.getNodeParameter('options', itemIndex, {}) as any;

	if (!Array.isArray(queryVector) || queryVector.length === 0) {
		throw new NodeOperationError(this.getNode(), 'Query vector must be a non-empty array', {
			itemIndex,
		});
	}

	const body: any = {
		collectionName,
		data: [queryVector],
		limit,
		outputFields: ['*'],
	};

	if (options.filterExpression) {
		body.filter = options.filterExpression;
	}

	if (!options.includeVectors) {
		body.outputFields = ['id', '*'];
	}

	const response = await zillizApiRequest.call(this, 'POST', '/v2/vectordb/entities/search', body);

	if (response.data && response.data[0]) {
		return response.data[0].map((match: any) => ({
			id: match.id,
			score: match.distance,
			...match,
		}));
	}

	return [];
}

async function handleLoad(
	this: IExecuteFunctions,
	itemIndex: number,
	collectionName: string,
): Promise<any[]> {
	const queryType = this.getNodeParameter('queryType', itemIndex) as string;
	const options = this.getNodeParameter('options', itemIndex, {}) as any;

	let body: any = {
		collectionName,
		outputFields: options.outputFields
			? options.outputFields.split(',').map((f: string) => f.trim())
			: ['*'],
	};

	if (queryType === 'filter') {
		const filterExpression = this.getNodeParameter('filterExpression', itemIndex) as string;
		const limit = this.getNodeParameter('loadLimit', itemIndex, 100) as number;

		body.filter = filterExpression;
		body.limit = limit;

		const response = await zillizApiRequest.call(this, 'POST', '/v2/vectordb/entities/query', body);
		return response.data || [];
	} else {
		const vectorIds = this.getNodeParameter('vectorIds', itemIndex) as string;
		const ids = vectorIds.split(',').map((id) => id.trim());

		body.filter = `id in [${ids.map((id) => `"${id}"`).join(',')}]`;

		const response = await zillizApiRequest.call(this, 'POST', '/v2/vectordb/entities/query', body);
		return response.data || [];
	}
}

async function handleUpdate(
	this: IExecuteFunctions,
	itemIndex: number,
	collectionName: string,
): Promise<any> {
	const updateData = this.getNodeParameter('updateData', itemIndex) as any[];

	if (!Array.isArray(updateData) || updateData.length === 0) {
		throw new NodeOperationError(this.getNode(), 'Update data must be a non-empty array', {
			itemIndex,
		});
	}

	// In Zilliz, update is essentially upsert (insert or update)
	const body = {
		collectionName,
		data: updateData,
	};

	const response = await zillizApiRequest.call(this, 'POST', '/v2/vectordb/entities/upsert', body);

	return {
		success: true,
		updatedCount: updateData.length,
		...response,
	};
}

async function handleDelete(
	this: IExecuteFunctions,
	itemIndex: number,
	collectionName: string,
): Promise<any> {
	const deleteMethod = this.getNodeParameter('deleteMethod', itemIndex) as string;
	let filter: string;

	if (deleteMethod === 'filter') {
		filter = this.getNodeParameter('deleteFilter', itemIndex) as string;
	} else {
		const deleteIds = this.getNodeParameter('deleteIds', itemIndex) as string;
		const ids = deleteIds.split(',').map((id) => id.trim());
		filter = `id in [${ids.map((id) => `"${id}"`).join(',')}]`;
	}

	const body = {
		collectionName,
		filter,
	};

	const response = await zillizApiRequest.call(this, 'POST', '/v2/vectordb/entities/delete', body);

	return {
		success: true,
		deletedCount: response.deleteCount || 0,
		filter,
		...response,
	};
}
