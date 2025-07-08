import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

export interface ZillizVectorData {
	id?: string | number;
	vector: number[];
	[key: string]: any;
}

export interface ZillizSearchResult {
	id: string | number;
	distance: number;
	entity: Record<string, any>;
}

export interface ZillizCollection {
	collectionName: string;
	description?: string;
	fieldsSchema?: any[];
}

export class ZillizClient {
	private httpClient: AxiosInstance;

	constructor(credentials: { apiKey: string; clusterEndpoint: string }) {
		this.httpClient = axios.create({
			baseURL: credentials.clusterEndpoint as string,
			headers: {
				'Authorization': `Bearer ${credentials.apiKey}`,
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
		});
	}

	async listCollections(database = 'default'): Promise<ZillizCollection[]> {
		const response: AxiosResponse = await this.httpClient.post('/v2/vectordb/collections/list', {
			dbName: database,
		});
		return response.data.data || [];
	}

	async createCollection(
		collectionName: string,
		dimension: number,
		metricType = 'COSINE',
		indexType = 'AUTOINDEX',
		database = 'default',
	): Promise<void> {
		const schema = {
			fields: [
				{
					fieldName: 'id',
					dataType: 'Int64',
					isPrimary: true,
					autoID: true,
				},
				{
					fieldName: 'vector',
					dataType: 'FloatVector',
					dimension,
				},
				{
					fieldName: 'text',
					dataType: 'VarChar',
					maxLength: 65535,
				},
			],
		};

		const indexParams = [
			{
				fieldName: 'vector',
				indexName: 'vector_index',
				metricType,
				indexType,
			},
		];

		await this.httpClient.post('/v2/vectordb/collections/create', {
			dbName: database,
			collectionName,
			schema,
			indexParams,
		});
	}

	async insertVectors(
		collectionName: string,
		data: ZillizVectorData[],
		database = 'default',
	): Promise<{ insertCount: number; insertIds: (string | number)[] }> {
		const response: AxiosResponse = await this.httpClient.post('/v2/vectordb/entities/insert', {
			dbName: database,
			collectionName,
			data,
		});
		return response.data.data;
	}

	async searchVectors(
		collectionName: string,
		vectors: number[][],
		limit = 10,
		filter?: string,
		outputFields?: string[],
		database = 'default',
	): Promise<ZillizSearchResult[][]> {
		const response: AxiosResponse = await this.httpClient.post('/v2/vectordb/entities/search', {
			dbName: database,
			collectionName,
			data: vectors,
			limit,
			filter,
			outputFields: outputFields || ['*'],
		});
		return response.data.data;
	}

	async queryVectors(
		collectionName: string,
		filter: string,
		outputFields?: string[],
		limit = 100,
		database = 'default',
	): Promise<any[]> {
		const response: AxiosResponse = await this.httpClient.post('/v2/vectordb/entities/query', {
			dbName: database,
			collectionName,
			filter,
			outputFields: outputFields || ['*'],
			limit,
		});
		return response.data.data;
	}

	async deleteVectors(
		collectionName: string,
		filter: string,
		database = 'default',
	): Promise<{ deleteCount: number }> {
		const response: AxiosResponse = await this.httpClient.post('/v2/vectordb/entities/delete', {
			dbName: database,
			collectionName,
			filter,
		});
		return response.data.data;
	}

	async dropCollection(collectionName: string, database = 'default'): Promise<void> {
		await this.httpClient.post('/v2/vectordb/collections/drop', {
			dbName: database,
			collectionName,
		});
	}

	async getCollectionStats(collectionName: string, database = 'default'): Promise<any> {
		const response: AxiosResponse = await this.httpClient.post('/v2/vectordb/collections/describe', {
			dbName: database,
			collectionName,
		});
		return response.data.data;
	}
}
