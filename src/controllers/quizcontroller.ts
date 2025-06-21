import { Request, Response } from 'express';
import Quiz from '../models/Quiz.js';
import User from '../models/User.js';

export const getQuizQuestion = async (req: Request, res: Response) => {
  try {
    const count = await Quiz.countDocuments();
    const random = Math.floor(Math.random() * count);
    const question = await Quiz.findOne().skip(random);
    if (!question) {
      return res.status(404).json({ message: 'No quiz questions found.' });
    }
    // Return question without the correct answer
    const { _id, question: questionText, options, category } = question;
    res.json({ _id, question: questionText, options, category });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const submitQuizAnswer = async (req: Request, res: Response) => {
    const { questionId, answer } = req.body;
    
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const user = req.user as Express.User;
    const userId = user._id;

    try {
        const question = await Quiz.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const isCorrect = question.correctAnswer === answer;

        if (isCorrect) {
            await User.findByIdAndUpdate(userId, { $inc: { score: 10 } });
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ correct: true, message: 'Correct answer!', score: user.score });
        } else {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ correct: false, message: 'Incorrect answer.', score: user.score });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const leaderboard = await User.find()
            .sort({ score: -1 })
            .limit(10)
            .select('username score'); // Adjust fields as needed

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
