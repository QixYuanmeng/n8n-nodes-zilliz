import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ZillizApi implements ICredentialType {
	name = 'zillizApi';

	displayName = 'Zilliz API';

	documentationUrl = 'https://docs.zilliz.com.cn/docs/quick-start';

	properties: INodeProperties[] = [
		{
			displayName: 'Cluster Endpoint',
			name: 'clusterEndpoint',
			type: 'string',
			placeholder: 'https://in03-xxxxxxxxxxxxxxxx.api.gcp-us-west1.zillizcloud.com',
			default: '',
			description: 'The cluster endpoint URL from your Zilliz Cloud console',
			required: true,
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'API Key from your Zilliz Cloud console',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.clusterEndpoint}}',
			url: '/v2/vectordb/collections/list',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: '{}',
		},
	};
}
