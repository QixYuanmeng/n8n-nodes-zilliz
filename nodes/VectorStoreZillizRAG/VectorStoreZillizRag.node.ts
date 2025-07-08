import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { ZillizClient, type ZillizVectorData } from '../shared/ZillizClient';
import { zillizCollectionRLC, zillizDatabaseField } from '../shared/descriptions';

export class VectorStoreZillizRag implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zilliz RAG Knowledge Base',
		name: 'vectorStoreZillizRag',
		icon: 'file:zilliz.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Build and manage RAG knowledge base with Zilliz vector database',
		defaults: {
			name: 'Zilliz RAG',
		},
		inputs: ['main'] as any,
		outputs: ['main'] as any,
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
						name: 'Process and Store Documents',
						value: 'processAndStore',
						description: 'Clean, chunk, vectorize and store documents',
						action: 'Process and store documents for RAG',
					},
					{
						name: 'Semantic Search',
						value: 'semanticSearch',
						description: 'Search for relevant documents using natural language',
						action: 'Perform semantic search',
					},
					{
						name: 'Create Knowledge Base',
						value: 'createKnowledgeBase',
						description: 'Create a new knowledge base collection',
						action: 'Create knowledge base collection',
					},
					{
						name: 'Query with Context',
						value: 'queryWithContext',
						description: 'Retrieve context for AI agent queries',
						action: 'Query with context for AI agent',
					},
				],
				default: 'processAndStore',
			},
			zillizDatabaseField,
			zillizCollectionRLC,

			// Document processing fields
			{
				displayName: 'Document Content Field',
				name: 'contentField',
				type: 'string',
				default: 'content',
				description: 'Name of the field containing the document content',
				displayOptions: {
					show: {
						operation: ['processAndStore'],
					},
				},
			},
			{
				displayName: 'Document Title Field',
				name: 'titleField',
				type: 'string',
				default: 'title',
				description: 'Name of the field containing the document title',
				displayOptions: {
					show: {
						operation: ['processAndStore'],
					},
				},
			},
			{
				displayName: 'Text Processing Options',
				name: 'textProcessing',
				type: 'collection',
				placeholder: 'Add Processing Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['processAndStore'],
					},
				},
				options: [
					{
						displayName: 'Chunk Overlap',
						name: 'chunkOverlap',
						type: 'number',
						default: 200,
						description: 'Character overlap between chunks',
						typeOptions: {
							minValue: 0,
							maxValue: 1000,
						},
					},
					{
						displayName: 'Chunk Size',
						name: 'chunkSize',
						type: 'number',
						default: 1000,
						description: 'Maximum characters per text chunk',
						typeOptions: {
							minValue: 100,
							maxValue: 5000,
						},
					},
					{
						displayName: 'Clean Text',
						name: 'cleanText',
						type: 'boolean',
						default: true,
						description: 'Whether to remove extra whitespace and normalize text',
					},
					{
						displayName: 'Min Chunk Size',
						name: 'minChunkSize',
						type: 'number',
						default: 50,
						description: 'Minimum characters required for a chunk',
						typeOptions: {
							minValue: 10,
							maxValue: 500,
						},
					},
					{
						displayName: 'Remove HTML Tags',
						name: 'removeHtml',
						type: 'boolean',
						default: true,
						description: 'Whether to strip HTML tags from content',
					},
				],
			},
			{
				displayName: 'Embedding Settings',
				name: 'embeddingSettings',
				type: 'collection',
				placeholder: 'Add Embedding Setting',
				default: {},
				displayOptions: {
					show: {
						operation: ['processAndStore', 'createKnowledgeBase'],
					},
				},
				options: [
					{
						displayName: 'Vector Dimension',
						name: 'dimension',
						type: 'number',
						default: 1536,
						description: 'Dimension of the embedding vectors (must match your embedding model)',
					},
					{
						displayName: 'Embedding Field',
						name: 'embeddingField',
						type: 'string',
						default: 'embedding',
						description: 'Name of the field containing the vector embeddings',
					},
					{
						displayName: 'Metric Type',
						name: 'metricType',
						type: 'options',
						options: [
							{ name: 'Cosine', value: 'COSINE' },
							{ name: 'Euclidean (L2)', value: 'L2' },
							{ name: 'Inner Product (IP)', value: 'IP' },
						],
						default: 'COSINE',
						description: 'Distance metric for similarity calculation',
					},
				],
			},

			// Search fields
			{
				displayName: 'Query Text',
				name: 'queryText',
				type: 'string',
				default: '',
				description: 'Natural language query for semantic search',
				displayOptions: {
					show: {
						operation: ['semanticSearch', 'queryWithContext'],
					},
				},
			},
			{
				displayName: 'Query Vector',
				name: 'queryVector',
				type: 'json',
				default: '',
				description: 'Pre-computed query vector (if available)',
				displayOptions: {
					show: {
						operation: ['semanticSearch', 'queryWithContext'],
					},
				},
			},
			{
				displayName: 'Search Options',
				name: 'searchOptions',
				type: 'collection',
				placeholder: 'Add Search Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['semanticSearch', 'queryWithContext'],
					},
				},
				options: [
					{
						displayName: 'Max Results',
						name: 'maxResults',
						type: 'number',
						default: 5,
						description: 'Maximum number of relevant documents to return',
						typeOptions: {
							minValue: 1,
							maxValue: 100,
						},
					},
					{
						displayName: 'Similarity Threshold',
						name: 'similarityThreshold',
						type: 'number',
						default: 0.7,
						description: 'Minimum similarity score (0-1)',
						typeOptions: {
							minValue: 0,
							maxValue: 1,
							numberPrecision: 2,
						},
					},
					{
						displayName: 'Filter Expression',
						name: 'filter',
						type: 'string',
						default: '',
						description: 'Additional filter conditions',
					},
					{
						displayName: 'Include Metadata',
						name: 'includeMetadata',
						type: 'boolean',
						default: true,
						description: 'Whether to include document metadata in results',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('zillizApi');
		const zillizClient = new ZillizClient({
			apiKey: credentials.apiKey as string,
			clusterEndpoint: credentials.clusterEndpoint as string,
		});

		for (let i = 0; i < items.length; i++) {
			try {
				const database = this.getNodeParameter('zillizDatabase', i, 'default') as string;
				const collectionName = this.getNodeParameter('zillizCollection', i, '', {
					extractValue: true,
				}) as string;

				let result: any;

				switch (operation) {
					case 'processAndStore':
						result = await handleProcessAndStore(this, zillizClient, i, database, collectionName);
						break;
					case 'semanticSearch':
						result = await handleSemanticSearch(this, zillizClient, i, database, collectionName);
						break;
					case 'createKnowledgeBase':
						result = await handleCreateKnowledgeBase(this, zillizClient, i, database, collectionName);
						break;
					case 'queryWithContext':
						result = await handleQueryWithContext(this, zillizClient, i, database, collectionName);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex: i,
						});
				}

				returnData.push({
					json: result,
					pairedItem: { item: i },
				});
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

// Helper functions
async function handleProcessAndStore(
	executeFunctions: IExecuteFunctions,
	zillizClient: ZillizClient,
	itemIndex: number,
	database: string,
	collectionName: string,
): Promise<any> {
	const item = executeFunctions.getInputData()[itemIndex];
	const contentField = executeFunctions.getNodeParameter('contentField', itemIndex, 'content') as string;
	const titleField = executeFunctions.getNodeParameter('titleField', itemIndex, 'title') as string;
	const textProcessing = executeFunctions.getNodeParameter('textProcessing', itemIndex, {}) as any;
	const embeddingSettings = executeFunctions.getNodeParameter('embeddingSettings', itemIndex, {}) as any;

	// Extract content
	const content = item.json[contentField] as string;
	const title = item.json[titleField] as string || 'Untitled';

	if (!content) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			`Content field '${contentField}' not found or empty`,
			{ itemIndex },
		);
	}

	// Process text
	let processedContent = content;
	if (textProcessing.removeHtml) {
		processedContent = removeHtmlTags(processedContent);
	}
	if (textProcessing.cleanText) {
		processedContent = cleanText(processedContent);
	}

	// Chunk text
	const chunks = chunkText(processedContent, {
		chunkSize: textProcessing.chunkSize || 1000,
		chunkOverlap: textProcessing.chunkOverlap || 200,
		minChunkSize: textProcessing.minChunkSize || 50,
	});

	// Prepare documents for insertion
	const documents: ZillizVectorData[] = [];
	const embeddingField = embeddingSettings.embeddingField || 'embedding';

	for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
		const chunk = chunks[chunkIndex];
		const docData: any = {
			text: chunk,
			title,
			chunk_index: chunkIndex,
			total_chunks: chunks.length,
			char_count: chunk.length,
			source_id: item.json.id || `doc_${Date.now()}_${itemIndex}`,
			created_at: new Date().toISOString(),
		};

		// Add vector if provided
		if (item.json[embeddingField] && Array.isArray(item.json[embeddingField])) {
			// If single embedding provided, use for all chunks (not ideal but functional)
			docData.vector = item.json[embeddingField] as number[];
		} else {
			// Placeholder - in real usage, this would be computed by an embedding node
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`Vector embeddings required. Please compute embeddings using an embedding node before this step.`,
				{ itemIndex },
			);
		}

		// Add metadata
		for (const [key, value] of Object.entries(item.json)) {
			if (key !== contentField && key !== embeddingField && !docData.hasOwnProperty(key)) {
				docData[key] = value;
			}
		}

		documents.push(docData as ZillizVectorData);
	}

	// Insert into Zilliz
	const insertResult = await zillizClient.insertVectors(collectionName, documents, database);

	return {
		success: true,
		processed_document: title,
		chunks_created: chunks.length,
		total_characters: processedContent.length,
		average_chunk_size: Math.round(processedContent.length / chunks.length),
		insert_count: insertResult.insertCount,
		insert_ids: insertResult.insertIds,
		collection: collectionName,
		database,
	};
}

async function handleSemanticSearch(
	executeFunctions: IExecuteFunctions,
	zillizClient: ZillizClient,
	itemIndex: number,
	database: string,
	collectionName: string,
): Promise<any> {
	const queryText = executeFunctions.getNodeParameter('queryText', itemIndex) as string;
	const queryVectorParam = executeFunctions.getNodeParameter('queryVector', itemIndex, '') as string;
	const searchOptions = executeFunctions.getNodeParameter('searchOptions', itemIndex, {}) as any;

	let queryVector: number[];

	// Get query vector
	if (queryVectorParam) {
		try {
			queryVector = JSON.parse(queryVectorParam);
		} catch (error) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				'Invalid JSON in Query Vector parameter',
				{ itemIndex },
			);
		}
	} else if (!queryText) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			'Either Query Text or Query Vector must be provided',
			{ itemIndex },
		);
	} else {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			'Query vector required. Please compute embeddings for the query text using an embedding node.',
			{ itemIndex },
		);
	}

	// Perform search
	const searchResults = await zillizClient.searchVectors(
		collectionName,
		[queryVector],
		searchOptions.maxResults || 5,
		searchOptions.filter || undefined,
		searchOptions.includeMetadata ? undefined : ['text', 'title', 'chunk_index'],
		database,
	);

	// Filter by similarity threshold
	const filteredResults = searchResults[0].filter(
		(result) => result.distance >= (searchOptions.similarityThreshold || 0.7),
	);

	// Format results for RAG usage
	const formattedResults = filteredResults.map((result, index) => ({
		rank: index + 1,
		similarity_score: result.distance,
		document_id: result.id,
		title: result.entity.title,
		text_chunk: result.entity.text,
		chunk_index: result.entity.chunk_index,
		metadata: searchOptions.includeMetadata ? result.entity : undefined,
	}));

	return {
		query: queryText || 'Vector query',
		total_results: filteredResults.length,
		search_results: formattedResults,
		context_text: formattedResults.map(r => r.text_chunk).join('\n\n'),
		collection: collectionName,
		database,
	};
}

async function handleCreateKnowledgeBase(
	executeFunctions: IExecuteFunctions,
	zillizClient: ZillizClient,
	itemIndex: number,
	database: string,
	collectionName: string,
): Promise<any> {
	const embeddingSettings = executeFunctions.getNodeParameter('embeddingSettings', itemIndex, {}) as any;

	const dimension = embeddingSettings.dimension || 1536;
	const metricType = embeddingSettings.metricType || 'COSINE';

	await zillizClient.createCollection(collectionName, dimension, metricType, 'AUTOINDEX', database);

	return {
		success: true,
		message: `Knowledge base collection '${collectionName}' created successfully`,
		collection: collectionName,
		database,
		dimension,
		metric_type: metricType,
	};
}

async function handleQueryWithContext(
	executeFunctions: IExecuteFunctions,
	zillizClient: ZillizClient,
	itemIndex: number,
	database: string,
	collectionName: string,
): Promise<any> {
	// This is similar to semantic search but optimized for AI agent context
	const searchResult = await handleSemanticSearch(executeFunctions, zillizClient, itemIndex, database, collectionName);

	// Format for AI agent consumption
	const contextChunks = searchResult.search_results.map((result: any) => ({
		content: result.text_chunk,
		source: result.title,
		relevance: result.similarity_score,
	}));

	const contextText = contextChunks
		.map((chunk: any, index: number) =>
			`[Context ${index + 1}] (Relevance: ${chunk.relevance.toFixed(3)}, Source: ${chunk.source})\n${chunk.content}`
		)
		.join('\n\n---\n\n');

	return {
		query: searchResult.query,
		context_chunks: contextChunks,
		context_text: contextText,
		total_context_length: contextText.length,
		sources: [...new Set(contextChunks.map((c: any) => c.source))],
		collection: collectionName,
		database,
	};
}

// Utility functions
function removeHtmlTags(text: string): string {
	return text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
}

function cleanText(text: string): string {
	return text
		.replace(/\s+/g, ' ') // Replace multiple whitespace with single space
		.replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single
		.trim();
}

function chunkText(text: string, options: {
	chunkSize: number;
	chunkOverlap: number;
	minChunkSize: number;
}): string[] {
	const { chunkSize, chunkOverlap, minChunkSize } = options;
	const chunks: string[] = [];
	let start = 0;

	while (start < text.length) {
		let end = Math.min(start + chunkSize, text.length);

		// Try to end at a sentence boundary
		if (end < text.length) {
			const sentenceEnd = text.lastIndexOf('.', end);
			const paragraphEnd = text.lastIndexOf('\n', end);
			const boundaryEnd = Math.max(sentenceEnd, paragraphEnd);

			if (boundaryEnd > start + minChunkSize) {
				end = boundaryEnd + 1;
			}
		}

		const chunk = text.slice(start, end).trim();
		if (chunk.length >= minChunkSize) {
			chunks.push(chunk);
		}

		start = Math.max(start + chunkSize - chunkOverlap, end);
	}

	return chunks;
}
