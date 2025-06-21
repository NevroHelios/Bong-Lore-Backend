import { Schema, model, Document } from 'mongoose';

export interface IQuiz extends Document {
  question: string;
  options: string[];
  correctAnswer: number; // index of the correct answer
  category: string;
}

const quizSchema = new Schema<IQuiz>({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  category: { type: String, required: true }
});

export default model<IQuiz>('Quiz', quizSchema);
