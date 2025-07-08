import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

// Helper functions
function cleanText(text: string): string {
	return text
		// Remove multiple whitespaces
		.replace(/\s+/g, ' ')
		// Remove special characters but keep basic punctuation
		.replace(/[^\w\s\.\,\!\?\;\:\-\(\)]/g, '')
		// Remove multiple line breaks
		.replace(/\n\s*\n/g, '\n')
		// Trim whitespace
		.trim();
}

function chunkText(text: string, maxSize: number, overlap: number, splitBy: string): string[] {
	const chunks: string[] = [];

	if (splitBy === 'paragraphs') {
		const paragraphs = text.split(/\n\s*\n/);
		let currentChunk = '';

		for (const paragraph of paragraphs) {
			if (currentChunk.length + paragraph.length <= maxSize) {
				currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
			} else {
				if (currentChunk) {
					chunks.push(currentChunk);
					// Handle overlap
					const words = currentChunk.split(' ');
					const overlapWords = words.slice(-Math.floor(overlap / 6)); // Approximate words for overlap
					currentChunk = overlapWords.join(' ') + '\n\n' + paragraph;
				} else {
					currentChunk = paragraph;
				}
			}
		}
		if (currentChunk) chunks.push(currentChunk);

	} else if (splitBy === 'sentences') {
		const sentences = text.split(/[.!?]+\s+/);
		let currentChunk = '';

		for (const sentence of sentences) {
			const sentenceWithPunct = sentence + (sentences.indexOf(sentence) < sentences.length - 1 ? '. ' : '');
			if (currentChunk.length + sentenceWithPunct.length <= maxSize) {
				currentChunk += sentenceWithPunct;
			} else {
				if (currentChunk) {
					chunks.push(currentChunk.trim());
					// Handle overlap
					const lastSentences = currentChunk.split(/[.!?]+\s+/).slice(-2);
					currentChunk = lastSentences.join('. ') + '. ' + sentenceWithPunct;
				} else {
					currentChunk = sentenceWithPunct;
				}
			}
		}
		if (currentChunk) chunks.push(currentChunk.trim());

	} else {
		// Character-based chunking
		for (let i = 0; i < text.length; i += maxSize - overlap) {
			const end = Math.min(i + maxSize, text.length);
			chunks.push(text.substring(i, end));
		}
	}

	return chunks.filter(chunk => chunk.trim().length > 0);
}

export class VectorStoreZillizRag implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zilliz RAG Text Processor',
		name: 'vectorStoreZillizRag',
		icon: 'file:zilliz.svg',
		group: ['AI'],
		version: 1,
		description: 'Process text for RAG: clean, chunk, and prepare for embedding',
		defaults: {
			name: 'Zilliz RAG Text Processor',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Clean Text',
						value: 'cleanText',
						description: 'Clean and normalize text content',
						action: 'Clean text content',
					},
					{
						name: 'Chunk Text',
						value: 'chunkText',
						description: 'Split text into smaller chunks',
						action: 'Split text into chunks',
					},
					{
						name: 'Clean and Chunk',
						value: 'cleanAndChunk',
						description: 'Clean text and split into chunks',
						action: 'Clean and chunk text',
					},
				],
				default: 'cleanAndChunk',
			},
			{
				displayName: 'Text Field',
				name: 'textField',
				type: 'string',
				default: 'text',
				description: 'Name of the field containing the text to process',
			},
			{
				displayName: 'Chunk Size',
				name: 'chunkSize',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['chunkText', 'cleanAndChunk'],
					},
				},
				default: 1000,
				description: 'Maximum number of characters per chunk',
			},
			{
				displayName: 'Chunk Overlap',
				name: 'chunkOverlap',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['chunkText', 'cleanAndChunk'],
					},
				},
				default: 200,
				description: 'Number of characters to overlap between chunks',
			},
			{
				displayName: 'Split By',
				name: 'splitBy',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['chunkText', 'cleanAndChunk'],
					},
				},
				options: [
					{
						name: 'Sentences',
						value: 'sentences',
					},
					{
						name: 'Paragraphs',
						value: 'paragraphs',
					},
					{
						name: 'Characters',
						value: 'characters',
					},
				],
				default: 'sentences',
				description: 'How to split the text into chunks',
			},
			{
				displayName: 'Preserve Metadata',
				name: 'preserveMetadata',
				type: 'boolean',
				default: true,
				description: 'Whether to preserve metadata fields in each chunk',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const operation = this.getNodeParameter('operation', 0) as string;
		const textField = this.getNodeParameter('textField', 0) as string;
		const preserveMetadata = this.getNodeParameter('preserveMetadata', 0) as boolean;

		for (let i = 0; i < items.length; i++) {
			try {
				const item = items[i];
				const inputText = item.json[textField] as string;

				if (!inputText || typeof inputText !== 'string') {
					throw new NodeOperationError(
						this.getNode(),
						`Text field '${textField}' is missing or not a string`,
						{ itemIndex: i }
					);
				}

				let processedText = inputText;

				// Clean text if needed
				if (operation === 'cleanText' || operation === 'cleanAndChunk') {
					processedText = cleanText(processedText);
				}

				// Create base metadata
				const baseMetadata = preserveMetadata ? { ...item.json } : {};
				delete baseMetadata[textField];

				if (operation === 'cleanText') {
					// Just return cleaned text
					returnData.push({
						json: {
							...baseMetadata,
							[textField]: processedText,
							originalLength: inputText.length,
							cleanedLength: processedText.length,
						},
						pairedItem: { item: i },
					});
				} else if (operation === 'chunkText' || operation === 'cleanAndChunk') {
					// Split into chunks
					const chunkSize = this.getNodeParameter('chunkSize', i) as number;
					const chunkOverlap = this.getNodeParameter('chunkOverlap', i) as number;
					const splitBy = this.getNodeParameter('splitBy', i) as string;

					const chunks = chunkText(processedText, chunkSize, chunkOverlap, splitBy);

					chunks.forEach((chunk: string, chunkIndex: number) => {
						returnData.push({
							json: {
								...baseMetadata,
								[textField]: chunk,
								chunkIndex,
								totalChunks: chunks.length,
								chunkSize: chunk.length,
								originalDocumentId: item.json.id || `doc_${i}`,
								chunkId: `${item.json.id || `doc_${i}`}_chunk_${chunkIndex}`,
							},
							pairedItem: { item: i },
						});
					});
				}
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
