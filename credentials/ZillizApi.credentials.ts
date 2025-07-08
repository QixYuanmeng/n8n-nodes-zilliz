import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ZillizApi implements ICredentialType {
	name = 'zillizApi';

	displayName = 'Zilliz Cloud API';

	documentationUrl = 'https://docs.zilliz.com.cn/docs/quick-start';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Zilliz Cloud API key',
		},
		{
			displayName: 'Cluster Endpoint',
			name: 'clusterEndpoint',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'https://your-cluster-id.api.region.zillizcloud.com',
			description: 'The endpoint URL of your Zilliz cluster',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Authorization': '=Bearer {{$credentials.apiKey}}',
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.clusterEndpoint}}',
			url: '/v2/vectordb/collections/list',
			method: 'GET',
		},
	};
}
