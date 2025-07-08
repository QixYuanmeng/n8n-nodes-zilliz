import type { INodeProperties } from 'n8n-workflow';

export const zillizCollectionRLC: INodeProperties = {
	displayName: 'Collection Name',
	name: 'zillizCollection',
	type: 'resourceLocator',
	default: { mode: 'string', value: '' },
	required: true,
	modes: [
		{
			displayName: 'Collection',
			name: 'string',
			type: 'string',
			placeholder: 'e.g. my_collection',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^[a-zA-Z][a-zA-Z0-9_]*$',
						errorMessage: 'Collection name must start with a letter and contain only letters, numbers, and underscores',
					},
				},
			],
		},
	],
	description: 'Name of the Zilliz collection to use',
};

export const zillizDatabaseField: INodeProperties = {
	displayName: 'Database Name',
	name: 'zillizDatabase',
	type: 'string',
	default: 'default',
	description: 'Name of the Zilliz database (default: "default")',
};

export const zillizMetricTypeField: INodeProperties = {
	displayName: 'Metric Type',
	name: 'metricType',
	type: 'options',
	options: [
		{
			name: 'Cosine',
			value: 'COSINE',
		},
		{
			name: 'Euclidean (L2)',
			value: 'L2',
		},
		{
			name: 'Inner Product (IP)',
			value: 'IP',
		},
	],
	default: 'COSINE',
	description: 'Distance metric used for similarity search',
};

export const zillizIndexTypeField: INodeProperties = {
	displayName: 'Index Type',
	name: 'indexType',
	type: 'options',
	options: [
		{
			name: 'Auto Index',
			value: 'AUTOINDEX',
		},
		{
			name: 'IVF Flat',
			value: 'IVF_FLAT',
		},
		{
			name: 'HNSW',
			value: 'HNSW',
		},
	],
	default: 'AUTOINDEX',
	description: 'Type of index to create for the vector field',
};
