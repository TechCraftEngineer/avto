import { env } from "@qbs-autonaim/config";
import { EmbeddingService } from "./embeddings/embedding-service";
import { DoclingProcessor } from "./parsers/docling-processor";
import type {
  EmbeddingProvider,
  FormatParser,
  IndexerConfig,
  SearchOptions,
  SearchResult,
  VectorStore,
} from "./types";
import { QdrantVectorStore } from "./vector-store/qdrant-store";

/**
 * Main API class for document indexing
 * Orchestrates: parsing → embedding → storage
 *
 * Requirements: 5.2, 5.3
 */
export class DocumentIndexer {
  private readonly parser: FormatParser;
  private readonly embeddingService: EmbeddingProvider;
  private readonly vectorStore: VectorStore;

  constructor(config: IndexerConfig) {
    // Initialize Docling parser
    this.parser = new DoclingProcessor({
      timeout: 180000,
      enableOcr: true,
    });

    // Initialize embedding service
    this.embeddingService = new EmbeddingService({
      ...config.embedding,
      apiKey: env.OPENAI_API_KEY,
    });

    // Initialize Qdrant vector store
    this.vectorStore = new QdrantVectorStore({
      url: env.QDRANT_URL,
      apiKey: env.QDRANT_API_KEY,
      collectionName: env.QDRANT_COLLECTION_NAME,
      dimensions: env.EMBEDDING_DIMENSIONS,
    });
  }

  /**
   * Indexes a document: parses, generates embeddings, and stores them
   *
   * @param content - Document content as Buffer
   * @param documentId - Unique document identifier
   * @param metadata - Additional metadata to store with embeddings
   * @throws DocumentProcessingError if any step fails
   *
   * Requirements: 5.2
   */
  async index(
    content: Buffer,
    documentId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    // Step 1: Parse document
    const text = await this.parseDocument(content);

    // Step 2: Generate embeddings
    const embeddingResult = await this.embeddingService.embed(text, documentId);

    // Step 3: Store embeddings
    await this.vectorStore.store(embeddingResult, metadata);
  }

  /**
   * Reindexes a document: removes old embeddings and creates new ones
   * Ensures atomic replacement of embeddings
   *
   * @param content - Document content as Buffer
   * @param documentId - Unique document identifier
   * @param metadata - Additional metadata to store with embeddings
   * @throws DocumentProcessingError if any step fails
   *
   * Requirements: 5.2, 3.4
   */
  async reindex(
    content: Buffer,
    documentId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    // Step 1: Parse document
    const text = await this.parseDocument(content);

    // Step 2: Generate embeddings
    const embeddingResult = await this.embeddingService.embed(text, documentId);

    // Step 3: Delete old embeddings
    await this.vectorStore.deleteByDocument(documentId);

    // Step 4: Store new embeddings
    await this.vectorStore.store(embeddingResult, metadata);
  }

  /**
   * Removes a document from the index
   *
   * @param documentId - Unique document identifier
   * @throws Error if deletion fails
   *
   * Requirements: 5.3
   */
  async remove(documentId: string): Promise<void> {
    await this.vectorStore.deleteByDocument(documentId);
  }

  /**
   * Performs semantic search across indexed documents
   *
   * @param query - Search query text
   * @param options - Search options (topK, threshold, filters)
   * @returns Array of search results ordered by similarity
   * @throws DocumentProcessingError if embedding generation fails
   *
   * Requirements: 5.3
   */
  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    // Generate embedding for query
    const queryEmbedding = await this.embeddingService.embedQuery(query);

    // Search in vector store
    return await this.vectorStore.search(queryEmbedding, options);
  }

  /**
   * Parses document using Docling processor
   *
   * @param content - Document content as Buffer
   * @param filename - Optional filename for format detection
   * @returns Extracted text
   * @throws DocumentProcessingError if parsing fails
   *
   * Requirements: 6.3
   */
  private async parseDocument(
    content: Buffer,
    filename?: string,
  ): Promise<string> {
    return await this.parser.extractText(content, filename);
  }
}
