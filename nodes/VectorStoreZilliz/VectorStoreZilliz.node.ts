import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';
import axios from 'axios';

export class VectorStoreZilliz implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zilliz Vector Store',
		name: 'vectorStoreZilliz',
		icon: 'file:zilliz.svg',
		group: ['AI'],
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
						action: 'Create collection',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete documents from the vector store',
						action: 'Delete documents',
					},
					{
						name: 'Get Collection Info',
						value: 'getCollectionInfo',
						description: 'Get information about a collection',
						action: 'Get collection information',
					},
					{
						name: 'Insert',
						value: 'insert',
						description: 'Insert documents into the vector store',
						action: 'Insert documents',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search for similar documents',
						action: 'Search documents',
					},
				],
				default: 'search',
			},
			{
				displayName: 'Collection Name',
				name: 'collectionName',
				type: 'string',
				required: true,
				default: '',
				description: 'Name of the collection to work with',
			},
			// Insert operation fields
			{
				displayName: 'Data',
				name: 'data',
				type: 'json',
				displayOptions: {
					show: {
						operation: ['insert'],
					},
				},
				default: '[]',
				description: 'Array of data objects to insert',
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
				default: '[]',
				description: 'Vector to search for similar documents',
			},
			{
				displayName: 'Search Limit',
				name: 'searchLimit',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
				default: 10,
				description: 'Maximum number of results to return',
			},
			{
				displayName: 'Output Fields',
				name: 'outputFields',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['search'],
					},
				},
				default: '*',
				description: 'Comma-separated list of fields to return (use * for all fields)',
			},
			// Delete operation fields
			{
				displayName: 'Filter Expression',
				name: 'filterExpression',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['delete'],
					},
				},
				default: '',
				description: 'Filter expression to select documents to delete',
			},
			// Create collection fields
			{
				displayName: 'Dimension',
				name: 'dimension',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['createCollection'],
					},
				},
				default: 1536,
				description: 'Dimension of the vector field',
			},
			{
				displayName: 'Index Type',
				name: 'indexType',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['createCollection'],
					},
				},
				options: [
					{
						name: 'AUTOINDEX',
						value: 'AUTOINDEX',
					},
					{
						name: 'HNSW',
						value: 'HNSW',
					},
					{
						name: 'IVF_FLAT',
						value: 'IVF_FLAT',
					},
					{
						name: 'IVF_PQ',
						value: 'IVF_PQ',
					},
					{
						name: 'IVF_SQ8',
						value: 'IVF_SQ8',
					},
				],
				default: 'AUTOINDEX',
				description: 'Type of index to create',
			},
			{
				displayName: 'Metric Type',
				name: 'metricType',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['createCollection'],
					},
				},
				options: [
					{
						name: 'COSINE',
						value: 'COSINE',
					},
					{
						name: 'IP',
						value: 'IP',
					},
					{
						name: 'L2',
						value: 'L2',
					},
				],
				default: 'COSINE',
				description: 'Distance metric for similarity calculation',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;
		const collectionName = this.getNodeParameter('collectionName', 0) as string;

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

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: any;

				switch (operation) {
					case 'insert':
						const data = this.getNodeParameter('data', i) as any[];
						responseData = await insertDocuments(clusterEndpoint, collectionName, data, axiosConfig);
						break;

					case 'search':
						const queryVector = this.getNodeParameter('queryVector', i) as number[];
						const searchLimit = this.getNodeParameter('searchLimit', i) as number;
						const outputFields = this.getNodeParameter('outputFields', i) as string;
						responseData = await searchDocuments(
							clusterEndpoint,
							collectionName,
							queryVector,
							searchLimit,
							outputFields,
							axiosConfig,
						);
						break;

					case 'delete':
						const filterExpression = this.getNodeParameter('filterExpression', i) as string;
						responseData = await deleteDocuments(clusterEndpoint, collectionName, filterExpression, axiosConfig);
						break;

					case 'getCollectionInfo':
						responseData = await getCollectionInfo(clusterEndpoint, collectionName, axiosConfig);
						break;

					case 'createCollection':
						const dimension = this.getNodeParameter('dimension', i) as number;
						const indexType = this.getNodeParameter('indexType', i) as string;
						const metricType = this.getNodeParameter('metricType', i) as string;
						responseData = await createCollection(
							clusterEndpoint,
							collectionName,
							dimension,
							indexType,
							metricType,
							axiosConfig,
						);
						break;

					default:
						throw new NodeOperationError(this.getNode(), `Operation "${operation}" is not supported`, {
							itemIndex: i,
						});
				}

				returnData.push({
					json: responseData,
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						pairedItem: { item: i },
					});
				} else {
					throw error;
				}
			}
		}

		return [returnData];
	}
}

async function insertDocuments(
	clusterEndpoint: string,
	collectionName: string,
	data: any[],
	axiosConfig: any,
): Promise<any> {
	const url = `${clusterEndpoint}/v1/vector/insert`;
	const requestBody = {
		collectionName,
		data,
	};

	const response = await axios.post(url, requestBody, axiosConfig);
	return response.data;
}

async function searchDocuments(
	clusterEndpoint: string,
	collectionName: string,
	queryVector: number[],
	limit: number,
	outputFields: string,
	axiosConfig: any,
): Promise<any> {
	const url = `${clusterEndpoint}/v1/vector/search`;
	const requestBody = {
		collectionName,
		vector: queryVector,
		limit,
		outputFields: outputFields === '*' ? ['*'] : outputFields.split(',').map(f => f.trim()),
	};

	const response = await axios.post(url, requestBody, axiosConfig);
	return response.data;
}

async function deleteDocuments(
	clusterEndpoint: string,
	collectionName: string,
	filter: string,
	axiosConfig: any,
): Promise<any> {
	const url = `${clusterEndpoint}/v1/vector/delete`;
	const requestBody = {
		collectionName,
		filter,
	};

	const response = await axios.post(url, requestBody, axiosConfig);
	return response.data;
}

async function getCollectionInfo(clusterEndpoint: string, collectionName: string, axiosConfig: any): Promise<any> {
	const url = `${clusterEndpoint}/v1/vector/collections/${collectionName}`;
	const response = await axios.get(url, axiosConfig);
	return response.data;
}

async function createCollection(
	clusterEndpoint: string,
	collectionName: string,
	dimension: number,
	indexType: string,
	metricType: string,
	axiosConfig: any,
): Promise<any> {
	const url = `${clusterEndpoint}/v1/vector/collections`;
	const requestBody = {
		collectionName,
		dimension,
		indexType,
		metricType,
	};

	const response = await axios.post(url, requestBody, axiosConfig);
	return response.data;
}
