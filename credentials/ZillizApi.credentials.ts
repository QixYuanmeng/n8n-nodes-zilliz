import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ZillizApi implements ICredentialType {
	name = 'zillizApi';
	displayName = 'Zilliz API';
	documentationUrl = 'https://docs.zilliz.com.cn/reference/restful';
	properties: INodeProperties[] = [
		{
			displayName: 'Cluster Endpoint',
			name: 'clusterEndpoint',
			type: 'string',
			default: '',
			placeholder: 'https://your-cluster-id.api.region.zillizcloud.com',
			description: 'The endpoint URL of your Zilliz Cloud cluster',
			required: true,
		},
		{
			displayName: 'Authentication Method',
			name: 'authMethod',
			type: 'options',
			options: [
				{
					name: 'API Key',
					value: 'apiKey',
				},
				{
					name: 'Username and Password',
					value: 'userPass',
				},
			],
			default: 'apiKey',
			description: 'Method to authenticate with Zilliz Cloud',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'The API key for your Zilliz Cloud account',
			displayOptions: {
				show: {
					authMethod: ['apiKey'],
				},
			},
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			description: 'Username for your Zilliz Cloud cluster',
			displayOptions: {
				show: {
					authMethod: ['userPass'],
				},
			},
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Password for your Zilliz Cloud cluster',
			displayOptions: {
				show: {
					authMethod: ['userPass'],
				},
			},
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: {
					$if: {
						'={{ $credentials.authMethod === "apiKey" }}': '=Bearer {{ $credentials.apiKey }}',
						$else: '=Bearer {{ $credentials.username }}:{{ $credentials.password }}',
					},
				},
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.clusterEndpoint }}',
			url: '/v2/vectordb/collections/list',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: '{}',
		},
	};
}
