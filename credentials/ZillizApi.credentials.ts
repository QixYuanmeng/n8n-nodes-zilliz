import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	IAuthenticateGeneric,
} from 'n8n-workflow';

export class ZillizApi implements ICredentialType {
	name = 'zillizApi';

	displayName = 'Zilliz API';

	documentationUrl = 'https://docs.zilliz.com.cn/docs/quick-start';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Your Zilliz API Key',
		},
		{
			displayName: 'Cluster Endpoint',
			name: 'clusterEndpoint',
			required: true,
			type: 'string',
			default: '',
			placeholder: 'https://in03-xxxxx.api.gcp-us-west1.zillizcloud.com',
			description: 'Your Zilliz cluster endpoint URL',
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
			baseURL: '={{ $credentials.clusterEndpoint }}',
			url: '/v1/vector/collections',
			method: 'GET',
		},
	};
}
