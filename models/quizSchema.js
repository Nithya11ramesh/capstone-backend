import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [
        {
            questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
            selectedOption: { type: Number, required: true },
            score: { type: Number, required: true },
        },
    ],
    score: { type: Number, required: true }
}, { timestamps: true });

const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    questions: [{
        questionText: { type: String, required: true },
        options: { type: [String], required: true },
        correctAnswer: { type: Number, required: true }
    }],
    submissions: [submissionSchema]
}, { timestamps: true });

const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);

export default Quiz;