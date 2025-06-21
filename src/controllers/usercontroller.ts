import { Request, Response } from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import mongoose, { Types } from 'mongoose';

export const toggleBookmark = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // 1. Check if the post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const postObjectId = new mongoose.Types.ObjectId(postId);
        
        // 2. Correctly check for and remove bookmarked post
        const bookmarks = user.bookmarkedPosts as Types.DocumentArray<Types.ObjectId>;
        const isBookmarked = bookmarks.some(id => id.equals(postObjectId));

        if (isBookmarked) {
            bookmarks.pull(postObjectId);
        } else {
            bookmarks.push(postObjectId);
        }

        await user.save();

        res.status(200).json({
            message: `Post ${isBookmarked ? 'unbookmarked' : 'bookmarked'} successfully`,
            bookmarkedPosts: user.bookmarkedPosts,
        });

    } catch (error) {
        console.error('Error toggling bookmark:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getBookmarkedPosts = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const user = await User.findById(userId).populate({
            path: 'bookmarkedPosts',
            populate: {
                path: 'mediaItems userId'
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user.bookmarkedPosts);

    } catch (error) {
        console.error('Error fetching bookmarked posts:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}; 