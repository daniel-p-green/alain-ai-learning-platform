# RAG with GPT‑OSS

- Embeddings: pick open models (bge/e5) matching your domain/language.
- Chunking: aim for 200–400 tokens with overlap; tune to retrieval quality.
- Index: use a vector DB or FAISS; store source/metadata for citations.
- Retrieval: top‑k + rerankers for precision; hybrid search for recall.
- Prompting: ground responses; cite sources; force JSON with citations array when needed.
- Evaluation: RAGAS/TruLens for faithfulness and answer relevance.

