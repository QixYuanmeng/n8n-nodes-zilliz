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
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Zilliz Cloud vector database',
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
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Collection',
						value: 'collection',
					},
					{
						name: 'Vector',
						value: 'vector',
					},
				],
				default: 'collection',
			},
			// Collection operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['collection'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new collection',
						action: 'Create a collection',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a collection',
						action: 'Delete a collection',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get collection details',
						action: 'Get a collection',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all collections',
						action: 'List collections',
					},
				],
				default: 'list',
			},
			// Vector operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['vector'],
					},
				},
				options: [
					{
						name: 'Insert',
						value: 'insert',
						description: 'Insert vectors into a collection',
						action: 'Insert vectors',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search for similar vectors',
						action: 'Search vectors',
					},
					{
						name: 'Query',
						value: 'query',
						description: 'Query vectors with filters',
						action: 'Query vectors',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete vectors from collection',
						action: 'Delete vectors',
					},
				],
				default: 'search',
			},
			// Collection name field
			{
				displayName: 'Collection Name',
				name: 'collectionName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['create', 'delete', 'get'],
						resource: ['collection'],
					},
				},
				description: 'Name of the collection',
			},
			{
				displayName: 'Collection Name',
				name: 'collectionName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['vector'],
					},
				},
				description: 'Name of the collection to operate on',
			},
			// Collection schema (for create operation)
			{
				displayName: 'Schema',
				name: 'schema',
				type: 'fixedCollection',
				default: {},
				displayOptions: {
					show: {
						operation: ['create'],
						resource: ['collection'],
					},
				},
				description: 'Schema definition for the collection',
				typeOptions: {
					multipleValues: false,
				},
				options: [
					{
						name: 'schemaOptions',
						displayName: 'Schema Options',
						values: [
							{
								displayName: 'Enable Auto ID',
								name: 'enableAutoId',
								type: 'boolean',
								default: true,
								description: 'Whether to automatically generate IDs for entities',
							},
							{
								displayName: 'Enable Dynamic Field',
								name: 'enableDynamicField',
								type: 'boolean',
								default: true,
								description: 'Whether to enable dynamic fields',
							},
						],
					},
				],
			},
			// Fields definition for collection creation
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'fixedCollection',
				default: {},
				displayOptions: {
					show: {
						operation: ['create'],
						resource: ['collection'],
					},
				},
				description: 'Field definitions for the collection',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'field',
						displayName: 'Field',
						values: [
							{
								displayName: 'Data Type',
								name: 'dataType',
								type: 'options',
								options: [
									{
										name: 'BINARY_VECTOR',
										value: 'BINARY_VECTOR',
									},
									{
										name: 'BOOL',
										value: 'BOOL',
									},
									{
										name: 'DOUBLE',
										value: 'DOUBLE',
									},
									{
										name: 'FLOAT',
										value: 'FLOAT',
									},
									{
										name: 'FLOAT_VECTOR',
										value: 'FLOAT_VECTOR',
									},
									{
										name: 'INT64',
										value: 'INT64',
									},
									{
										name: 'VARCHAR',
										value: 'VARCHAR',
									},
								],
								default: 'VARCHAR',
								required: true,
								description: 'Data type of the field',
							},
							{
								displayName: 'Dimension',
								name: 'dimension',
								type: 'number',
								default: 128,
								displayOptions: {
									show: {
										dataType: ['FLOAT_VECTOR', 'BINARY_VECTOR'],
									},
								},
								description: 'Dimension of the vector field',
							},
							{
								displayName: 'Field Name',
								name: 'fieldName',
								type: 'string',
								default: '',
								required: true,
								description: 'Name of the field',
							},
							{
								displayName: 'Is Primary',
								name: 'isPrimary',
								type: 'boolean',
								default: false,
								description: 'Whether this field is the primary key',
							},
							{
								displayName: 'Max Length',
								name: 'maxLength',
								type: 'number',
								default: 256,
								displayOptions: {
									show: {
										dataType: ['VARCHAR'],
									},
								},
								description: 'Maximum length for VARCHAR field',
							},
						],
					},
				],
			},
			// Vector data for insert operation
			{
				displayName: 'Data',
				name: 'data',
				type: 'json',
				default: '[]',
				displayOptions: {
					show: {
						operation: ['insert'],
						resource: ['vector'],
					},
				},
				description:
					'Array of data objects to insert. Each object should contain vector and metadata fields.',
			},
			// Search parameters
			{
				displayName: 'Search Vector',
				name: 'searchVector',
				type: 'json',
				default: '[]',
				displayOptions: {
					show: {
						operation: ['search'],
						resource: ['vector'],
					},
				},
				description: 'Vector to search for (array of numbers)',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				displayOptions: {
					show: {
						operation: ['search', 'query'],
						resource: ['vector'],
					},
				},
				description: 'Max number of results to return',
				typeOptions: {
					minValue: 1,
				},
			},
			{
				displayName: 'Filter',
				name: 'filter',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['search', 'query', 'delete'],
						resource: ['vector'],
					},
				},
				description: 'Filter expression for the operation',
			},
			{
				displayName: 'Output Fields',
				name: 'outputFields',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['search', 'query'],
						resource: ['vector'],
					},
				},
				description: 'Comma-separated list of fields to return in results',
			},
			// Delete by IDs
			{
				displayName: 'IDs',
				name: 'ids',
				type: 'json',
				default: '[]',
				displayOptions: {
					show: {
						operation: ['delete'],
						resource: ['vector'],
					},
				},
				description: 'Array of IDs to delete (optional if filter is provided)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;

				if (resource === 'collection') {
					responseData = await executeCollectionOperation.call(this, i);
				} else if (resource === 'vector') {
					responseData = await executeVectorOperation.call(this, i);
				} else {
					throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not known!`, {
						itemIndex: i,
					});
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);

				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

async function executeCollectionOperation(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<any> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;

	switch (operation) {
		case 'list':
			return await zillizApiRequest.call(this, 'POST', '/v2/vectordb/collections/list', {});

		case 'get':
			const getCollectionName = this.getNodeParameter('collectionName', itemIndex) as string;
			return await zillizApiRequest.call(this, 'POST', '/v2/vectordb/collections/describe', {
				collectionName: getCollectionName,
			});

		case 'create':
			const createCollectionName = this.getNodeParameter('collectionName', itemIndex) as string;
			const schema = this.getNodeParameter('schema', itemIndex) as any;
			const fields = this.getNodeParameter('fields', itemIndex) as any;

			const createBody: any = {
				collectionName: createCollectionName,
				schema: {
					autoId: schema?.schemaOptions?.enableAutoId ?? true,
					enableDynamicField: schema?.schemaOptions?.enableDynamicField ?? true,
					fields: [],
				},
			};

			if (fields.field && Array.isArray(fields.field)) {
				createBody.schema.fields = fields.field.map((field: any) => {
					const fieldDef: any = {
						fieldName: field.fieldName,
						dataType: field.dataType,
						isPrimary: field.isPrimary || false,
					};

					if (field.dataType === 'FLOAT_VECTOR' || field.dataType === 'BINARY_VECTOR') {
						fieldDef.dimension = field.dimension || 128;
					}

					if (field.dataType === 'VARCHAR') {
						fieldDef.maxLength = field.maxLength || 256;
					}

					return fieldDef;
				});
			}

			return await zillizApiRequest.call(
				this,
				'POST',
				'/v2/vectordb/collections/create',
				createBody,
			);

		case 'delete':
			const deleteCollectionName = this.getNodeParameter('collectionName', itemIndex) as string;
			return await zillizApiRequest.call(this, 'POST', '/v2/vectordb/collections/drop', {
				collectionName: deleteCollectionName,
			});

		default:
			throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not known!`, {
				itemIndex,
			});
	}
}

async function executeVectorOperation(this: IExecuteFunctions, itemIndex: number): Promise<any> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const collectionName = this.getNodeParameter('collectionName', itemIndex) as string;

	switch (operation) {
		case 'insert':
			const insertData = this.getNodeParameter('data', itemIndex) as string;
			let parsedData;
			try {
				parsedData = JSON.parse(insertData);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid JSON in data parameter', {
					itemIndex,
				});
			}

			return await zillizApiRequest.call(this, 'POST', '/v2/vectordb/entities/insert', {
				collectionName,
				data: parsedData,
			});

		case 'search':
			const searchVector = this.getNodeParameter('searchVector', itemIndex) as string;
			const searchLimit = this.getNodeParameter('limit', itemIndex) as number;
			const searchFilter = this.getNodeParameter('filter', itemIndex) as string;
			const outputFields = this.getNodeParameter('outputFields', itemIndex) as string;

			let parsedSearchVector;
			try {
				parsedSearchVector = JSON.parse(searchVector);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid JSON in search vector parameter', {
					itemIndex,
				});
			}

			const searchBody: any = {
				collectionName,
				data: [parsedSearchVector],
				limit: searchLimit,
			};

			if (searchFilter) {
				searchBody.filter = searchFilter;
			}

			if (outputFields) {
				searchBody.outputFields = outputFields.split(',').map((f) => f.trim());
			}

			return await zillizApiRequest.call(this, 'POST', '/v2/vectordb/entities/search', searchBody);

		case 'query':
			const queryLimit = this.getNodeParameter('limit', itemIndex) as number;
			const queryFilter = this.getNodeParameter('filter', itemIndex) as string;
			const queryOutputFields = this.getNodeParameter('outputFields', itemIndex) as string;

			const queryBody: any = {
				collectionName,
				limit: queryLimit,
			};

			if (queryFilter) {
				queryBody.filter = queryFilter;
			}

			if (queryOutputFields) {
				queryBody.outputFields = queryOutputFields.split(',').map((f) => f.trim());
			}

			return await zillizApiRequest.call(this, 'POST', '/v2/vectordb/entities/query', queryBody);

		case 'delete':
			const deleteFilter = this.getNodeParameter('filter', itemIndex) as string;
			const deleteIds = this.getNodeParameter('ids', itemIndex) as string;

			const deleteBody: any = {
				collectionName,
			};

			if (deleteIds) {
				try {
					deleteBody.ids = JSON.parse(deleteIds);
				} catch (error) {
					throw new NodeOperationError(this.getNode(), 'Invalid JSON in IDs parameter', {
						itemIndex,
					});
				}
			}

			if (deleteFilter) {
				deleteBody.filter = deleteFilter;
			}

			return await zillizApiRequest.call(this, 'POST', '/v2/vectordb/entities/delete', deleteBody);

		default:
			throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not known!`, {
				itemIndex,
			});
	}
}
