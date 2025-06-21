import { Request, Response } from 'express';
import CommunityEvent from '../models/CommunityEvent.js';
import User from '../models/User.js';
import { 
  generateCommunityEventSummary,
  MediaItem as GeminiMediaItem,
  CommunityEvent as GeminiCommunityEvent,
  SummaryOptions
} from '../utils/geminiSummary.js';
import mongoose from 'mongoose';

// Create community event
export const createCommunityEvent = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user?.name) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const existingUser = await User.findOne({ _id: user._id });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found in database' });
        }

        const {
            name,
            description,
            eventType,
            date,
            endDate,
            location,
            maxParticipants,
            registrationRequired,
            registrationDeadline,
            tags,
            culturalTags,
            visibility = 'public'
        } = req.body;

        const event = new CommunityEvent({
            organizerId: existingUser._id,
            name,
            description,
            eventType,
            date: new Date(date),
            endDate: endDate ? new Date(endDate) : undefined,
            location,
            maxParticipants,
            registrationRequired: registrationRequired || false,
            registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
            tags: tags || [],
            culturalTags: culturalTags || [],
            visibility,
            participants: [],
            mediaItems: [],
            status: 'draft',
            likes: [],
            shares: 0,
            views: 0,
            feedback: []
        });

        const savedEvent = await event.save();

        res.status(201).json({
            message: 'Community event created successfully',
            event: savedEvent
        });

    } catch (error) {
        console.error('Error creating community event:', error);
        res.status(500).json({
            message: 'Error creating community event',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get all community events with optional filtering
export const getEvents = async (req: Request, res: Response) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            organizerId, 
            eventType,
            status,
            visibility = 'public',
            upcoming = 'true',
            tags
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Build filter
        const filter: any = { visibility };
        
        if (organizerId) filter.organizerId = organizerId;
        if (eventType) filter.eventType = eventType;
        if (status) filter.status = status;
        if (tags) filter.tags = { $in: (tags as string).split(',') };
        
        // Filter for upcoming events if requested
        if (upcoming === 'true') {
            filter.date = { $gte: new Date() };
        }

        const events = await CommunityEvent.find(filter)
            .populate('mediaItems')
            .populate('organizerId', 'name email')
            .sort({ date: 1 })
            .skip(skip)
            .limit(limitNum);

        const total = await CommunityEvent.countDocuments(filter);

        res.json({
            events,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({
            message: 'Error retrieving events',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get a single event by ID
export const getEventById = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;
        
        const event = await CommunityEvent.findById(eventId)
            .populate('mediaItems')
            .populate('organizerId', 'name email')
            .populate('participants', 'name email');
            
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Increment view count
        await CommunityEvent.findByIdAndUpdate(eventId, { $inc: { views: 1 } });
        
        res.json({ event });
        
    } catch (error) {
        console.error('Error getting event:', error);
        res.status(500).json({
            message: 'Error retrieving event',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Generate summary for community event
export const generateEventSummary = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;
        const { options = {} } = req.body;

        const event = await CommunityEvent.findById(eventId).populate('mediaItems');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Convert to Gemini format
        const geminiMediaItems: GeminiMediaItem[] = event.mediaItems.map((item: any) => ({
            url: item.uri,
            type: item.type === 'photo' ? 'image' : 'video',
            description: item.description
        }));

        const geminiEvent: GeminiCommunityEvent = {
            id: event._id.toString(),
            name: event.name,
            description: event.description,
            date: event.date,
            location: event.location.name,
            media: geminiMediaItems,
            participants: event.participants.map(p => p.toString()),
            eventType: event.eventType
        };

        const summaryOptions: SummaryOptions = {
            style: 'detailed',
            language: 'bilingual',
            maxLength: 400,
            ...options
        };

        const summary = await generateCommunityEventSummary(geminiEvent, summaryOptions);

        if (summary) {
            const updateData = {
                aiSummary: {
                    summary: summary.summary,
                    highlights: summary.highlights,
                    participation: summary.participation,
                    impact: summary.impact,
                    generatedAt: new Date()
                }
            };

            await CommunityEvent.findByIdAndUpdate(eventId, updateData);

            res.json({
                message: 'Event summary generated successfully',
                summary
            });
        } else {
            res.status(500).json({ message: 'Failed to generate summary' });
        }

    } catch (error) {
        console.error('Error generating event summary:', error);
        res.status(500).json({
            message: 'Error generating event summary',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Join an event (add user to participants)
export const joinEvent = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;
        
        const user = req.user;
        if (!user?.name) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const existingUser = await User.findOne({ _id: user._id });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found in database' });
        }
        
        const event = await CommunityEvent.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        // Check if registration is still open
        if (event.registrationRequired && 
            event.registrationDeadline && 
            new Date() > event.registrationDeadline) {
            return res.status(400).json({ message: 'Registration deadline has passed' });
        }
        
        // Check if max participants reached
        if (event.maxParticipants && 
            event.participants.length >= event.maxParticipants) {
            return res.status(400).json({ message: 'Event has reached maximum capacity' });
        }
        
        // Add user to participants if not already joined
        if (!event.participants.some(p => p.equals(String(existingUser._id)))) {
            await CommunityEvent.findByIdAndUpdate(eventId, {
                $addToSet: { participants: existingUser._id }
            });
            
            res.json({ message: 'Successfully joined event' });
        } else {
            res.json({ message: 'Already joined this event' });
        }
        
    } catch (error) {
        console.error('Error joining event:', error);
        res.status(500).json({
            message: 'Error joining event',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Leave an event (remove user from participants)
export const leaveEvent = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;
        
        const user = req.user;
        if (!user?.name) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const existingUser = await User.findOne({ _id: user._id });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found in database' });
        }
        
        await CommunityEvent.findByIdAndUpdate(eventId, {
            $pull: { participants: existingUser._id }
        });
        
        res.json({ message: 'Successfully left event' });
        
    } catch (error) {
        console.error('Error leaving event:', error);
        res.status(500).json({
            message: 'Error leaving event',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Get event details with collections
 */
export const getEventWithCollections = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    const event = await CommunityEvent.findById(eventId)
      .populate('organizerId', 'name email')
      .populate('participants', 'name email')
      .populate({
        path: 'collections',
        select: 'name description coverImage memberCount tags mediaItems',
        populate: {
          path: 'mediaItems',
          select: 'uri type title description'
        }
      });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Increment view count
    await CommunityEvent.findByIdAndUpdate(eventId, { $inc: { views: 1 } });
    
    res.json({ event });
  } catch (error) {
    console.error('Error getting event with collections:', error);
    res.status(500).json({
      message: 'Error retrieving event details',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
