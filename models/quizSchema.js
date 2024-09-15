import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
});

const quizSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    questions: [questionSchema],
    submissions: [{
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        answers: [{
            questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
            selectedOption: { type: Number },
            score: { type: Number },
        }],
        score: { type: Number },
    }],
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
