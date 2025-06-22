import CommunityEvent from '../models/CommunityEvent.js';
import { Request, Response } from 'express';

// Add a post to a community event
export const addPostToEvent = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { postId } = req.body;
  if (!eventId || !postId) return res.status(400).json({ message: 'eventId and postId required' });
  const event = await CommunityEvent.findById(eventId);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (!event.posts.some(id => id.toString() === postId.toString())) event.posts.push(postId);
  await event.save();
  res.json({ success: true, event });
};

// Get all posts for a community event
export const getEventPosts = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const event = await CommunityEvent.findById(eventId).populate('posts');
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json({ posts: event.posts });
};

// Updated createCommunityEvent controller function
export const createCommunityEvent = async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        eventType,
        date,
        endDate,
        location, // This should be a JSON string containing the location object
        maxParticipants,
        registrationRequired,
        registrationDeadline,
        tags,
        culturalTags,
        status = 'draft',
        visibility = 'public',
        organizerNotes,
      } = req.body;
  
      console.log('Creating community event with data:', req.body)
  
      // OrganizerId from req.user
      const organizerId = req.user?._id;
      if (!organizerId) return res.status(401).json({ message: 'User not authenticated' });
  
      // Parse and validate location
      let locationObj;
      try {
        locationObj = typeof location === 'string' ? JSON.parse(location) : location;
      } catch (error) {
        return res.status(400).json({ message: 'Invalid location format' });
      }
  
      if (!locationObj || !locationObj.name) {
        return res.status(400).json({ message: 'Location name is required.' });
      }
  
      // Validate location object structure
      const validatedLocation = {
        name: locationObj.name,
        address: locationObj.address || undefined,
        link: locationObj.link || undefined,
      };
  
      // Parse tags and culturalTags as arrays
      const tagsArr = typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
      const culturalTagsArr = typeof culturalTags === 'string' ? culturalTags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
  
      // Handle cover image as buffer (file upload)
      let coverImageBuffer: Buffer | undefined = undefined;
      if (req.file && req.file.buffer) {
        coverImageBuffer = req.file.buffer;
      }
  
      const event = new CommunityEvent({
        organizerId,
        name,
        description,
        eventType,
        date: date ? new Date(date) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        location: validatedLocation, // Use the proper location object
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        registrationRequired: registrationRequired === 'true' || registrationRequired === true,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
        tags: tagsArr,
        culturalTags: culturalTagsArr,
        status,
        visibility,
        organizerNotes,
        coverImage: coverImageBuffer,
      });
  
      await event.save();
      res.status(201).json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ 
        message: 'Error creating event', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  };

// Join an event
export const joinEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const user = req.user as { _id: any };
    if (!user?._id) return res.status(401).json({ message: 'User not authenticated' });
    const event = await CommunityEvent.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!event.participants.some(id => id.toString() === user._id.toString())) {
      event.participants.push(user._id);
      await event.save();
      return res.json({ message: 'Successfully joined event' });
    } else {
      return res.json({ message: 'Already joined this event' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error joining event', error: error instanceof Error ? error.message : String(error) });
  }
};

// Leave an event
export const leaveEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const user = req.user as { _id: any };
    if (!user?._id) return res.status(401).json({ message: 'User not authenticated' });
    const event = await CommunityEvent.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.participants = event.participants.filter((id: any) => id.toString() !== user._id.toString());
    await event.save();
    res.json({ message: 'Successfully left event' });
  } catch (error) {
    res.status(500).json({ message: 'Error leaving event', error: error instanceof Error ? error.message : String(error) });
  }
};

// Get all details of a community event
export const getEventDetails = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const event = await CommunityEvent.findById(eventId)
      .populate('organizerId', 'name email')
      .populate('participants', 'name email')
      .populate('mediaItems')
      .populate('posts')
      .populate('collections');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ event });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving event details', error: error instanceof Error ? error.message : String(error) });
  }
};

// Get all community events
export const getAllCommunityEvents = async (req: Request, res: Response) => {
  try {
    const events = await CommunityEvent.find()
      .populate('organizerId', 'name email')
      .populate('participants', 'name email')
      .populate('mediaItems')
      .populate('posts')
      .populate('collections');
    console.log('Retrieved events:', events.length, 'events found');
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving events', error: error instanceof Error ? error.message : String(error) });
  }
};