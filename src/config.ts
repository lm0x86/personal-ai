import 'dotenv/config';

export const config = {
  port: process.env.PORT || 3000,
  
  // Vector store API configuration
  vectorStore: {
    baseUrl: process.env.VECTOR_STORE_URL || 'http://localhost:8000/api/products',
    apiKey: process.env.VECTOR_STORE_API_KEY || '',
  },
  
  // Index prefix to namespace all collections
  indexPrefix: process.env.INDEX_PREFIX || 'assistant_',
};

