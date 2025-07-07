import { IExecuteFunctions, IHttpRequestMethods, IHttpRequestOptions } from 'n8n-workflow';

export async function zillizApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	resource: string,
	body: any = {},
): Promise<any> {
	const credentials = await this.getCredentials('zillizApi');

	const options: IHttpRequestOptions = {
		method,
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body,
		url: `${credentials.clusterEndpoint}${resource}`,
		json: true,
	};

	try {
		return await this.helpers.httpRequestWithAuthentication.call(this, 'zillizApi', options);
	} catch (error) {
		throw error;
	}
}
