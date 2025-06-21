import { MongoClient } from "mongodb";

/**
 * Interface for MongoDB search index
 */
interface SearchIndex {
  name: string;
  [key: string]: any;
}

/**
 * Get MongoDB connection for vector operations
 */
export async function getMongoConnection() {
  const client = new MongoClient(process.env.MONGODB_URI as string);
  await client.connect();
  return client;
}

/**
 * Initialize all vector indexes for Bengali Heritage platform
 */
export async function initializeAllVectorIndexes() {
  const client = await getMongoConnection();
  
  try {
    console.log("Connected to MongoDB for vector index creation");
    
    const db = client.db();
    
    // Initialize each vector index (with retries for failure)
    try {
      await initializePostVectorIndex(db);
    } catch (error) {
      console.error("Error with post index:", error);
    }
    
    try {
      await initializeMediaVectorIndex(db);
    } catch (error) {
      console.error("Error with media index:", error);
    }
    
    try {
      await initializeCombinedVectorIndex(db);
    } catch (error) {
      console.error("Error with combined index:", error);
    }
    
    console.log("Bengali Heritage vector indexes initialization completed");
    
    return { success: true, message: "Vector indexes created successfully" };
  } catch (error) {
    console.error("Error initializing vector indexes:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  } finally {
    await client.close();
  }
}

/**
 * Initialize vector index for posts
 */
export async function initializePostVectorIndex(db: any) {
  try {
    const collection = db.collection("posts");
    
    // Check if index already exists
    const indexes = await collection.listSearchIndexes().toArray();
    if (indexes.some((idx: SearchIndex) => idx.name === "bengaliPostVectorIndex")) {
      console.log("Bengali post vector index already exists");
      return;
    }
    
    // Create the post vector index
    const result = await collection.createSearchIndex({
      name: "bengaliPostVectorIndex",
      definition: {
        mappings: {
          dynamic: false,
          fields: {
            textEmbedding: {
              type: "knnVector",
              dimensions: 768,
              similarity: "cosine"
            },
            multimodalEmbedding: {
              type: "knnVector",
              dimensions: 768,
              similarity: "cosine"
            },
            culturalEmbedding: {
              type: "knnVector",
              dimensions: 768,
              similarity: "cosine"
            },
            userId: { type: "string" },
            tags: { type: "string" },
            visibility: { type: "string" },
            "aiSummary.summaryType": { type: "string" }
          }
        }
      }
    });
    
    console.log("Bengali post vector index created:", result);
  } catch (error) {
    console.error("Error creating post vector index:", error);
    throw error;
  }
}

/**
 * Initialize vector index for media items
 */
export async function initializeMediaVectorIndex(db: any) {
  try {
    const collection = db.collection("mediaitems");
    
    // Check if index already exists
    const indexes = await collection.listSearchIndexes().toArray();
    if (indexes.some((idx: SearchIndex) => idx.name === "bengaliMediaVectorIndex")) {
      console.log("Bengali media vector index already exists");
      return;
    }
    
    // Create the media vector index
    const result = await collection.createSearchIndex({
      name: "bengaliMediaVectorIndex",
      definition: {
        mappings: {
          dynamic: false,
          fields: {
            visualEmbedding: {
              type: "knnVector",
              dimensions: 768,
              similarity: "cosine"
            },
            textEmbedding: {
              type: "knnVector",
              dimensions: 768,
              similarity: "cosine"
            },
            multimodalEmbedding: {
              type: "knnVector",
              dimensions: 768,
              similarity: "cosine"
            },
            culturalEmbedding: {
              type: "knnVector",
              dimensions: 768,
              similarity: "cosine"
            },
            type: { type: "string" },
            tags: { type: "string" },
            userId: { type: "string" }
          }
        }
      }
    });
    
    console.log("Bengali media vector index created:", result);
  } catch (error) {
    console.error("Error creating media vector index:", error);
    throw error;
  }
}

/**
 * Initialize vector index for combined content (events)
 * Note: Combined approach due to Atlas free tier limitations
 */
export async function initializeCombinedVectorIndex(db: any) {
  try {
    const collection = db.collection("communityevents");
    
    // Check if index already exists
    const indexes = await collection.listSearchIndexes().toArray();
    if (indexes.some((idx: SearchIndex) => idx.name === "bengaliCombinedVectorIndex")) {
      console.log("Bengali combined vector index already exists");
      return;
    }
    
    // Create a combined vector index for events
    const result = await collection.createSearchIndex({
      name: "bengaliCombinedVectorIndex",
      definition: {
        mappings: {
          dynamic: false,
          fields: {
            textEmbedding: {
              type: "knnVector",
              dimensions: 768,
              similarity: "cosine"
            },
            culturalEmbedding: {
              type: "knnVector",
              dimensions: 768,
              similarity: "cosine"
            },
            eventType: { type: "string" },
            tags: { type: "string" },
            culturalTags: { type: "string" },
            date: { type: "date" },
            visibility: { type: "string" }
          }
        }
      }
    });
    
    console.log("Bengali combined vector index created:", result);
  } catch (error) {
    console.error("Error creating combined vector index:", error);
    throw error;
  }
}

/**
 * Create a script file to initialize indexes
 */
export function getIndexInitializationScript(): string {
  return `
// Bengali Heritage Vector Index Initialization Script
// Run this in MongoDB Shell to create the vector indexes

// 1. Create Post Vector Index
db.posts.createSearchIndex({
  name: "bengaliPostVectorIndex",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        textEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine"
        },
        multimodalEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine"
        },
        culturalEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine"
        },
        userId: { type: "string" },
        tags: { type: "string" },
        visibility: { type: "string" },
        "aiSummary.summaryType": { type: "string" }
      }
    }
  }
});

// 2. Create Media Vector Index
db.mediaitems.createSearchIndex({
  name: "bengaliMediaVectorIndex",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        visualEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine"
        },
        textEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine"
        },
        multimodalEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine"
        },
        culturalEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine"
        },
        type: { type: "string" },
        tags: { type: "string" },
        userId: { type: "string" }
      }
    }
  }
});

// 3. Create Combined Vector Index for Events
db.communityevents.createSearchIndex({
  name: "bengaliCombinedVectorIndex",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        textEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine"
        },
        culturalEmbedding: {
          type: "knnVector",
          dimensions: 768,
          similarity: "cosine"
        },
        eventType: { type: "string" },
        tags: { type: "string" },
        culturalTags: { type: "string" },
        date: { type: "date" },
        visibility: { type: "string" }
      }
    }
  }
});
`;
}
