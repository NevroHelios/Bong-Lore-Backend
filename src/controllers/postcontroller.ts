import { Request, Response } from 'express';
import { uploadtocloudinary } from '../cloudconfig.js';
import MediaItem from '../models/MediaItem.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { 
  generatePostSummary, 
  generateCulturalHeritageSummary,
  generateCreativeStorySummary,
  generateTravelLocationSummary,
  MediaItem as GeminiMediaItem,
  Post as GeminiPost,
  SummaryOptions,
  generateSummaryType
} from '../utils/geminiSummary.js';
import mongoose, { Types } from 'mongoose';

// Extend the Express Request type to include files
interface MulterRequest extends Request {
  files?: Express.Multer.File[];
}

export const createposts = async (req: MulterRequest, res: Response) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const posts = [];
        console.log(`Received ${req.files.length} files for upload.`);
        
        // Upload all files to Cloudinary
        for (let i = 0; i < req.files.length; i++) {
            const cloudinaryresult = await uploadtocloudinary(req.files[i].path);
            console.log(`Processing file ${i}:`, req.files[i].originalname);
            console.log(`Cloudinary result for file ${i}:`, req.files[i].path);
            console.log(`Cloudinary upload result for file ${i}:`, cloudinaryresult);
            console.log(`For file ${i} --- ${cloudinaryresult.message}`);
            
            if (cloudinaryresult.message !== "Success" || !cloudinaryresult.result?.url) {
                return res.status(500).json({ 
                    message: `Failed to upload file ${i}`, 
                    error: cloudinaryresult.error 
                });
            }
            
            const fileurl = cloudinaryresult.result.url;
            posts.push(fileurl);
            console.log("FILE URL", fileurl);
        }        // Get user information
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const existingUser = await User.findOne({ _id: user._id });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found in database' });
        }

        // Create media items for each uploaded file
        const createdMediaItems = [];
        
        for (let i = 0; i < posts.length; i++) {
            const fileUrl = posts[i];
            const file = req.files[i];
            
            // Determine media type based on file mimetype
            const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'photo';
            
            // Parse additional data from request body
            const title = req.body.title || `Heritage ${mediaType} ${Date.now()}`;
            const description = req.body.description || '';
            const aspectRatio = req.body.aspectRatio ? parseFloat(req.body.aspectRatio) : undefined;
            
            // Parse location if provided
            let location;
            if (req.body.latitude && req.body.longitude) {
                location = {
                    latitude: parseFloat(req.body.latitude),
                    longitude: parseFloat(req.body.longitude),
                    name: req.body.locationName || undefined
                };
            }
            
            // Parse tags if provided
            let tags: string[] = [];
            if (req.body.tags) {
                tags = Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map((tag: string) => tag.trim());
            }

            const newMediaItem = new MediaItem({
                userId: existingUser._id,
                uri: fileUrl,
                type: mediaType,
                timestamp: Date.now(),
                aspectRatio,
                title,
                description,
                likes: [],
                comments: [],
                location,
                tags,
                collections: [],
                featured: false
            });

            const savedMediaItem = await newMediaItem.save();
            createdMediaItems.push(savedMediaItem);
        }

        // Create a Post document that groups these media items
        const postTitle = req.body.postTitle || req.body.title || 'Heritage Collection';
        const postDescription = req.body.postDescription || req.body.description || '';
        const postTags = req.body.postTags ? 
            (Array.isArray(req.body.postTags) ? req.body.postTags : req.body.postTags.split(',').map((tag: string) => tag.trim())) 
            : [];

        // Parse location if provided
        let postLocation;
        if (req.body.latitude && req.body.longitude) {
            postLocation = {
                type: "Point",
                coordinates : [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
            };
        }

        const newPost = new Post({
            userId: existingUser._id,
            title: postTitle,
            description: postDescription,
            mediaItems: createdMediaItems.map(item => item._id),
            tags: postTags,
            location: postLocation,
            likes: [],
            comments: [],
            collections: [],
            featured: false,
            visibility: req.body.visibility || 'public'
        });

        const savedPost = await newPost.save();

        const summaryType = await generateSummaryType(createdMediaItems);
        console.log(`Determined summary type for post: ${summaryType}`);

        // Generate AI summary for the post (async, don't block response)
        generatePostSummaryAsync(savedPost, createdMediaItems, summaryType);

        res.status(201).json({
            message: 'Post created successfully',
            post: savedPost,
            mediaItems: createdMediaItems,
            count: createdMediaItems.length
        });

    } catch (error) {
        console.error('Error creating posts:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get posts with optional filtering and summary
export const getPosts = async (req: Request, res: Response) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            userId, 
            featured, 
            summaryType,
            tags,
            location 
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Build filter
        const filter: any = { visibility: 'public' };
        
        if (userId) filter.userId = userId;
        if (featured === 'true') filter.featured = true;
        if (summaryType) filter['aiSummary.summaryType'] = summaryType;
        if (tags) filter.tags = { $in: (tags as string).split(',') };
        if (location) filter['location.name'] = new RegExp(location as string, 'i');

        const posts = await Post.find(filter)
            .populate('mediaItems')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Post.countDocuments(filter);

        res.json({
            posts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        console.error('Error getting posts:', error);
        res.status(500).json({
            message: 'Error retrieving posts',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Generate summary for existing post
export const generatePostSummaryEndpoint = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;
        if (!postId) {
            return res.status(400).json({ message: 'Post ID is required' });
        }
        let summaryType;

        const post = await Post.findById(postId).populate('mediaItems');
        if(post){
            summaryType = await generateSummaryType(post.mediaItems);
            console.log(`Determined summary type for post ${postId}: ${summaryType}`);
        } 
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }        // Check if user owns the post or is admin
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const existingUser = await User.findOne({ _id: user._id });
        if (!existingUser) {
            return res.status(403).json({ message: 'Access denied' });
        }
        // Ensure both IDs are ObjectId for comparison
        const postUserId = typeof post.userId === 'object' && post.userId !== null && 'equals' in post.userId
            ? post.userId
            : new mongoose.Types.ObjectId(post.userId);
        const existingUserId = typeof existingUser._id === 'object' && existingUser._id !== null && 'equals' in existingUser._id
            ? existingUser._id
            : new mongoose.Types.ObjectId(String(existingUser._id));

        if (!postUserId.equals(String(existingUserId))) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Generate summary
        await generatePostSummaryAsync(post, post.mediaItems, summaryType as string);

        // Return updated post
        const updatedPost = await Post.findById(postId).populate('mediaItems');
        res.json({
            message: 'Summary generated successfully',
            post: updatedPost
        });

    } catch (error) {
        console.error('Error generating post summary:', error);
        res.status(500).json({
            message: 'Error generating summary',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getNearbyPosts = async (req: Request, res: Response) => {  try {
    const authUser = req.user;
    console.log('Authenticated user:', authUser);
    if (!authUser) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }
    
    const user = await User.findOne({ _id: authUser._id });

    if (!user || !user.location || !user.location.coordinates) {
      return res.status(400).json({ error: 'User location not set.' });
    }

    const userCoordinatesRaw = user.location.coordinates;
    // Ensure coordinates is a tuple of exactly two numbers
    const userCoordinates: [number, number] = [
      Number(userCoordinatesRaw[0]),
      Number(userCoordinatesRaw[1])
    ];

    const maxDistance = parseInt(req.query.maxDistance as string) || 50000;

    const posts = await Post.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: userCoordinates
          },
          distanceField: 'distance',
          maxDistance: maxDistance,
          spherical: true
        }
      },
      { $sort: { distance: 1 } },
      { $limit: 50 }
    ]);

    res.status(200).json({ posts });

  } catch (error) {
    console.error('Error getting nearby posts:', error);
    res.status(500).json({ error: 'Failed to retrieve nearby posts' });
  }
};

// Async function to generate and save post summary
async function generatePostSummaryAsync(post: any, mediaItems: any[], summaryType: string) {
    try {
        // Convert database models to Gemini interface format
        const geminiMediaItems: GeminiMediaItem[] = mediaItems.map(item => ({
            url: item.uri,
            type: item.type === 'photo' ? 'image' : 'video',
            description: item.description
        }));

        const geminiPost: GeminiPost = {
            id: post._id.toString(),
            title: post.title,
            description: post.description,
            media: geminiMediaItems,
            tags: post.tags,
            location: post.location?.name,
            timestamp: post.createdAt,
            author: post.userId.toString()
        };

        const options: SummaryOptions = {
            style: 'detailed',
            language: 'bilingual',
            includeHashtags: true,
            maxLength: 300
        };

        let summary;
        let updateData: any = {};

        switch (summaryType) {
            case 'cultural':
                const culturalSummary = await generateCulturalHeritageSummary(
                    geminiMediaItems,
                    {
                        title: post.title,
                        location: post.location?.name,
                        culturalContext: 'Bengali heritage'
                    },
                    options
                );
                if (culturalSummary) {
                    updateData.culturalContext = {
                        significance: culturalSummary.culturalSignificance,
                        historicalContext: culturalSummary.historicalContext,
                        preservation: culturalSummary.preservation
                    };
                    updateData.aiSummary = {
                        summary: culturalSummary.summary,
                        hashtags: ['#heritage', '#culture', '#bengali'],
                        mood: 'respectful',
                        themes: ['cultural heritage'],
                        generatedAt: new Date(),
                        summaryType: 'cultural'
                    };
                }
                break;

            case 'creative':
                const creativeSummary = await generateCreativeStorySummary(
                    geminiMediaItems,
                    {
                        title: post.title,
                        theme: 'artistic expression'
                    },
                    options
                );
                if (creativeSummary) {
                    updateData.creativeContext = {
                        narrative: creativeSummary.narrative,
                        artisticElements: creativeSummary.artisticElements
                    };
                    updateData.aiSummary = {
                        summary: creativeSummary.summary,
                        hashtags: ['#creative', '#art', '#expression'],
                        mood: 'inspiring',
                        themes: creativeSummary.themes,
                        generatedAt: new Date(),
                        summaryType: 'creative'
                    };
                }
                break;

            case 'travel':
                const travelSummary = await generateTravelLocationSummary(
                    geminiMediaItems,
                    {
                        location: post.location?.name || 'Unknown location'
                    },
                    options
                );
                if (travelSummary) {
                    updateData.travelContext = {
                        attractions: travelSummary.attractions,
                        recommendations: travelSummary.recommendations,
                        travelTips: travelSummary.travelTips
                    };
                    updateData.aiSummary = {
                        summary: travelSummary.summary,
                        hashtags: ['#travel', '#explore', '#destination'],
                        mood: 'adventurous',
                        themes: ['travel', 'exploration'],
                        generatedAt: new Date(),
                        summaryType: 'travel'
                    };
                }
                break;

            default:
                summary = await generatePostSummary(geminiPost, options);
                if (summary) {
                    updateData.aiSummary = {
                        summary: summary.summary,
                        hashtags: summary.hashtags || [],
                        mood: summary.mood || 'neutral',
                        themes: ['general'],
                        generatedAt: new Date(),
                        summaryType: 'post'
                    };
                }
        }

        // Update the post with generated summary
        if (Object.keys(updateData).length > 0) {
            await Post.findByIdAndUpdate(post._id, updateData);
            console.log(`Summary generated for post: ${post._id}`);
        }

    } catch (error) {
        console.error('Error generating post summary:', error);
    }
}

// Create a post with media upload
export const createPost = async (req: Request, res: Response) => {
  try {
    // Multer puts the file in req.file
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ message: 'No media file uploaded' });
    }
    // Parse metadata from form fields
    const { userId, title, description, visibility, featured, locationName, latitude, longitude } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    // Upload to Cloudinary
    const uploadResult = await uploadtocloudinary(file.path);
    if (uploadResult.message !== 'Success' || !uploadResult.result?.url) {
      return res.status(500).json({ message: 'Failed to upload media', error: uploadResult.error });
    }
    const fileUrl = uploadResult.result.url;
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Create MediaItem
    const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'photo';
    const newMediaItem = new MediaItem({
      userId: user._id,
      uri: fileUrl,
      type: mediaType,
      timestamp: Date.now(),
      title: title || '',
      description: description || '',
      likes: [],
      comments: [],
      location: latitude && longitude ? {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        name: locationName || undefined
      } : undefined,
      tags: [],
      collections: [],
      featured: featured === 'true'
    });
    const savedMediaItem = await newMediaItem.save();
    // Create Post
    const newPost = new Post({
      userId: user._id,
      title: title || '',
      description: description || '',
      mediaItems: [savedMediaItem._id],
      tags: [],
      location: latitude && longitude ? {
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        type: locationName || 'Point',
        name: locationName || undefined
      } : undefined,
      likes: [],
      comments: [],
      collections: [],
      featured: featured === 'true',
      visibility: visibility || 'public'
    });
    const savedPost = await newPost.save();
    res.status(201).json({
      message: 'Post created successfully',
      post: savedPost,
      mediaItem: savedMediaItem
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const toggleLike = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        
        const userObjectId = new mongoose.Types.ObjectId(userId as string);
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const likesArray = post.likes as Types.DocumentArray<Types.ObjectId>;
        const isLiked = likesArray.some(id => id.equals(userObjectId));

        if (isLiked) {
            // Unlike the post
            likesArray.pull(userObjectId);
        } else {
            // Like the post
            likesArray.push(userObjectId);
        }

        await post.save();

        res.status(200).json({
            message: `Post ${isLiked ? 'unliked' : 'liked'} successfully`,
            likes: post.likes,
        });

    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const addComment = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;
        const { text } = req.body;
        const userId = req.user?._id;
        const userName = req.user?.name;

        if (!userId || !userName) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        if (!text) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = {
            userId,
            userName,
            text,
            timestamp: new Date(),
        };

        post.comments.push(newComment);
        await post.save();

        res.status(201).json({
            message: 'Comment added successfully',
            comments: post.comments,
        });

    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
