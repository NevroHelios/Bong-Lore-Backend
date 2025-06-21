import { MongoClient } from "mongodb";

/**
 * Get MongoDB connection for vector operations
 */
export async function getMongoConnection() {
  const client = new MongoClient(process.env.MONGODB_URI as string);
  await client.connect();
  return client;
}

/**
 * Definition for Post Vector Index
 */
export const postVectorIndexDefinition = {
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
        visibility: { type: "token" },
        "aiSummary.summaryType": { type: "string" }
      }
    }
  }
};

/**
 * Definition for Media Vector Index
 */
export const mediaVectorIndexDefinition = {
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
};

/**
 * Definition for Community Event Vector Index
 */
export const eventVectorIndexDefinition = {
  name: "bengaliEventVectorIndex",
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
};

/**
 * Initialize post vector index
 */
export async function createPostVectorIndex() {
  const client = await getMongoConnection();
  
  try {
    const db = client.db();
    const collection = db.collection("posts");
    
    // Check if index already exists
    const indexes = await collection.listSearchIndexes().toArray();
    if (indexes.some(idx => idx.name === postVectorIndexDefinition.name)) {
      console.log("Bengali post vector index already exists");
      return { success: true, message: "Index already exists" };
    }
    
    // Create the vector index
    const result = await collection.createSearchIndex(postVectorIndexDefinition);
    console.log("Bengali post vector index created:", result);
    
    return { success: true, message: "Index created successfully" };
  } catch (error) {
    console.error("Error creating post vector index:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  } finally {
    await client.close();
  }
}

/**
 * Initialize media vector index
 */
export async function createMediaVectorIndex() {
  const client = await getMongoConnection();
  
  try {
    const db = client.db();
    const collection = db.collection("mediaitems");
    
    // Check if index already exists
    const indexes = await collection.listSearchIndexes().toArray();
    if (indexes.some(idx => idx.name === mediaVectorIndexDefinition.name)) {
      console.log("Bengali media vector index already exists");
      return { success: true, message: "Index already exists" };
    }
    
    // Create the vector index
    const result = await collection.createSearchIndex(mediaVectorIndexDefinition);
    console.log("Bengali media vector index created:", result);
    
    return { success: true, message: "Index created successfully" };
  } catch (error) {
    console.error("Error creating media vector index:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  } finally {
    await client.close();
  }
}

/**
 * Initialize event vector index
 */
export async function createEventVectorIndex() {
  const client = await getMongoConnection();
  
  try {
    const db = client.db();
    const collection = db.collection("communityevents");
    
    // Check if index already exists
    const indexes = await collection.listSearchIndexes().toArray();
    if (indexes.some(idx => idx.name === eventVectorIndexDefinition.name)) {
      console.log("Bengali event vector index already exists");
      return { success: true, message: "Index already exists" };
    }
    
    // Create the vector index
    const result = await collection.createSearchIndex(eventVectorIndexDefinition);
    console.log("Bengali event vector index created:", result);
    
    return { success: true, message: "Index created successfully" };
  } catch (error) {
    console.error("Error creating event vector index:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  } finally {
    await client.close();
  }
}

/**
 * Initialize all vector indexes
 */
export async function createAllVectorIndexes() {
  console.log("Starting Bengali Heritage vector index creation...");
  
  // Create post index
  const postResult = await createPostVectorIndex();
  if (!postResult.success) {
    console.error("Failed to create post vector index:", postResult.error);
  }
  
  // Create media index
  const mediaResult = await createMediaVectorIndex();
  if (!mediaResult.success) {
    console.error("Failed to create media vector index:", mediaResult.error);
  }
  
  // Create event index
  const eventResult = await createEventVectorIndex();
  if (!eventResult.success) {
    console.error("Failed to create event vector index:", eventResult.error);
  }
  
  const allSuccessful = postResult.success && mediaResult.success && eventResult.success;
  
  if (allSuccessful) {
    console.log("✅ All Bengali Heritage vector indexes created successfully!");
    return { success: true, message: "All indexes created successfully" };
  } else {
    console.log("⚠️ Some vector indexes failed to create. Check logs for details.");
    return { 
      success: false, 
      error: "Some indexes failed to create",
      details: {
        postResult,
        mediaResult,
        eventResult
      }
    };
  }
}

/**
 * Get MongoDB script for creating vector indexes
 */
export function getVectorIndexScript(): string {
  return `
// Bengali Heritage Vector Index Creation Script
// Run this in MongoDB Shell

// 1. Create Post Vector Index
db.posts.createSearchIndex(${JSON.stringify(postVectorIndexDefinition, null, 2)});

// 2. Create Media Vector Index
db.mediaitems.createSearchIndex(${JSON.stringify(mediaVectorIndexDefinition, null, 2)});

// 3. Create Event Vector Index
db.communityevents.createSearchIndex(${JSON.stringify(eventVectorIndexDefinition, null, 2)});
  `;
}
