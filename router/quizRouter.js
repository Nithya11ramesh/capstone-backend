import express from 'express';
import mongoose from 'mongoose';
import Quiz from '../models/quizSchema.js';
import { authenticate, authorize } from '../middleware/auth.js';

const quizRouter = express.Router();

// Create a new quiz
quizRouter.post('/:courseId', authenticate, authorize(['instructor', 'admin']), async (req, res) => {
    const { title, questions } = req.body;
    const { courseId } = req.params;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'Valid Course ID is required' });
    }
    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Questions are required and must be an array' });
    }

    try {
        // Validate each question in the array
        for (const question of questions) {
            if (!question.questionText) {
                return res.status(400).json({ message: 'Each question must have a question text' });
            }
            if (!question.options || !Array.isArray(question.options) || question.options.length < 4) {
                return res.status(400).json({ message: 'Each question must have at least 4 options' });
            }
            if (question.correctAnswer === undefined || question.correctAnswer === null) {
                return res.status(400).json({ message: 'Each question must have a correct answer' });
            }
        }

        const newQuiz = new Quiz({ course: courseId, title, questions });
        await newQuiz.save();
        res.status(201).json(newQuiz);
    } catch (error) {
        console.error('Error creating quiz:', error);
        res.status(500).json({ message: 'Error creating quiz', error });
    }
});



// Get all quizzes and quiz count by course ID
quizRouter.get('/course/:courseId', authenticate, async (req, res) => {
    const { courseId } = req.params;

    try {
        const quizzes = await Quiz.find({ course: courseId }).populate('course', 'title');
        const count = await Quiz.countDocuments({ course: courseId });

        res.status(200).json({ quizzes, count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quizzes', error });
    }
});

// Get quiz by ID
quizRouter.get('/:quizId', authenticate, async (req, res) => {
    try {
        const quizId = req.params.quizId;
    
        
                if (!mongoose.Types.ObjectId.isValid(quizId)) {
                    return res.status(400).json({ message: 'Invalid Quiz ID' });
                }
        
                // Fetch the quiz by ID
                const quiz = await Quiz.findById(quizId)
                    .populate({
                        path: 'submissions',
                        populate: { path: 'student', select: 'firstName lastName' }
                    });
        
                if (!quiz) {
                    return res.status(404).json({ message: 'Quiz not found' });
                }
        
                // Respond with the quiz data
                res.status(200).json({ quiz });
            } catch (error) {
                console.error('Error fetching quiz:', error);
                res.status(500).json({ message: 'Error fetching quiz', error });
            }
        });
//         const userId = req.userId; // Assuming req.user contains logged-in user information

//         const quiz = await Quiz.findById(quizId).populate({
//             path: 'submissions',
//             match: { student: userId }, // Filter submissions for the current student
//             populate: { path: 'student', select: 'firstName lastName' },
//         });

//         if (!quiz) {
//             return res.status(404).json({ message: 'Quiz not found' });
//         }

//         res.status(200).json(quiz);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching quiz', error });
//     }
// });

// Update quiz by ID
quizRouter.put('/:quizId', authenticate, authorize(['instructor', 'admin']), async (req, res) => {
    const { quizId } = req.params;
    const { course, title, questions } = req.body;

    try {
        const quiz = await Quiz.findByIdAndUpdate(quizId, { course, title, questions }, { new: true });

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        res.status(200).json(quiz);
    } catch (error) {
        res.status(400).json({ message: 'Error updating quiz', error });
    }
});

// Delete quiz by ID
quizRouter.delete('/:quizId', authenticate, authorize(['admin']), async (req, res) => {
    const { quizId } = req.params;

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
        return res.status(400).json({ message: 'Valid Quiz ID is required' });
    }

    try {
        const quiz = await Quiz.findByIdAndDelete(quizId);

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        res.status(200).json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting quiz', error });
    }
});

// Submit and grade quiz
quizRouter.post('/:quizId/grade', authenticate, async (req, res) => {
    try {
        const { quizId } = req.params;
        const { answers } = req.body;
        const studentId = req.userId; // assuming user is authenticated and user ID is available

        if (!Array.isArray(answers)) {
            return res.status(400).json({ message: 'Invalid submissions data' });
        }

        const quiz = await Quiz.findById(quizId).populate('questions');
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        let score = 0;
        const submissions = answers.map(answer => {
            const question = quiz.questions.id(answer.questionId);
            if (question) {
                const isCorrect = question.correctAnswer === answer.selectedOption;
                if (isCorrect) {
                    score += 5; // Scoring logic
                }
                return {
                    questionId: answer.questionId,
                    selectedOption: answer.selectedOption,
                    score: isCorrect ? 5 : 0,
                };
            }
            return null;
        }).filter(submission => submission !== null);

        const submission = {
            student: studentId,
            answers: submissions,
            score,
        };

        quiz.submissions.push(submission);
        await quiz.save();

        res.json({ score });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting quiz', error });
    }
});

// Get total grade for a course
quizRouter.get('/:courseId/total-grade', authenticate, async (req, res) => {
    const { courseId } = req.params;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: 'Valid Course ID is required' });
    }

    try {
        const quizzes = await Quiz.find({ course: courseId });
        const totalGrade = quizzes.reduce((acc, quiz) => acc + (quiz.grade || 0), 0);

        res.status(200).json({ totalGrade });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching total quiz grade', error });
    }
});

// Delete a quiz submission
quizRouter.delete('/submissions/:submissionId', authenticate, authorize(['instructor', 'admin']), async (req, res) => {
    const { submissionId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(submissionId)) {
            return res.status(400).json({ message: 'Invalid submission ID' });
        }

        const quiz = await Quiz.findOne({ 'submissions._id': submissionId });

        if (!quiz) {
            return res.status(404).json({ message: 'Submission not found in any quiz' });
        }

        quiz.submissions.pull({ _id: submissionId });
        await quiz.save();

        res.status(200).json({ message: 'Submission deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting submission', error });
    }
});

export default quizRouter;
