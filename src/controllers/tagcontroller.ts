import { Request, Response } from 'express';
import { getPopularTags } from '../models/TagUtils.js';

export const getPopularTagsController = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const tags = await getPopularTags(limit);
    res.status(200).json(tags);
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    res.status(500).json({ error: 'Failed to fetch popular tags' });
  }
};
