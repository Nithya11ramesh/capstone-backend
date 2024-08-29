import express from 'express';
import mongoose from 'mongoose';
import Lesson from '../models/lessonSchema.js';
import { authenticate, authorize } from '../middleware/auth.js';

const lessonRouter = express.Router();

// Create a new lesson
lessonRouter.post('/lesson/:courseId', authenticate, authorize(['instructor', 'admin']), async (req, res) => {
    try {
        const { courseId } = req.params;
        const lesson = new Lesson({ ...req.body, course: courseId });
        await lesson.save();
        res.status(201).json(lesson);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all lessons for a specific course
lessonRouter.get('/lesson/course/:courseId', authenticate, async (req, res) => {
    try {
        const { courseId } = req.params;

        // Validate courseId
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid Course ID' });
        }

        // Find lessons for the given courseId
        const lessons = await Lesson.find({ course: courseId }).populate('course');

        // If no lessons are found
        if (!lessons.length) {
            return res.status(404).json({ message: 'No lessons found for this course' });
        }

        res.json(lessons);
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get a single lesson by ID
lessonRouter.get('/lesson/:lessonId', authenticate, async (req, res) => {
    try {
        const { lessonId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            return res.status(400).json({ message: 'Invalid Lesson ID' });
        }

        const lesson = await Lesson.findById(lessonId).populate('course');

        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        res.status(200).json(lesson);
    } catch (error) {
        console.error('Error fetching lesson:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a lesson by ID
lessonRouter.put('/lesson/:lessonId', authenticate, async (req, res) => {
    try {
        const { lessonId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            return res.status(400).json({ message: 'Invalid Lesson ID' });
        }

        } catch (error) {
        res.status(400).json({ message: error.message });
        }
 } );
// Delete a lesson by ID
lessonRouter.delete('/lesson/:lessonId', authenticate, authorize(['instructor', 'admin']), async (req, res) => {
    try {
        const { lessonId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            return res.status(400).json({ message: 'Invalid Lesson ID' });
        }

        const lesson = await Lesson.findByIdAndDelete(lessonId);

        if (lesson) {
            res.json({ message: 'Lesson deleted' });
        } else {
            res.status(404).json({ message: 'Lesson not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// Mark a lesson as completed or pending
lessonRouter.post('/lesson/:lessonId/complete', authenticate, async (req, res) => {
    const { lessonId } = req.params;
    const { userId, completionStatus } = req.body;

    try {
        // Validate the lesson ID
        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            return res.status(400).json({ message: 'Invalid lesson ID' });
        }

        // Validate the user ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId); // Correct way to create an ObjectId

        // Update completion status and handle completed students array
        const completionIndex = lesson.completion.findIndex(c => c.completedStudents.includes(userObjectId));
        if (completionIndex !== -1) {
            // Update existing completion status
            lesson.completion[completionIndex].completionStatus = completionStatus;
        } else {
            // Add new completion status
            lesson.completion.push({
                completionStatus,
                completedStudents: [userObjectId]
            });
        }

        await lesson.save();
        res.status(200).json({ message: "Lesson completion status updated" });
    } catch (error) {
        console.error('Error updating lesson status:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Fetch course progress
lessonRouter.get('/course/:courseId/progress', authenticate, async (req, res) => {
    try {
        const { courseId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid Course ID' });
        }

        const lessons = await Lesson.find({ course: courseId }).populate('completion.completedStudents');
        const totalLessons = lessons.length;
        const completedLessons = lessons.filter(lesson =>
            lesson.completion.some(c => c.completionStatus === 'completed')
        ).length;
        const progress = (completedLessons / totalLessons) * 100;

        res.json({ progress });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Fetch completed students for a lesson
// lessonRouter.get('/lesson/:lessonId/completed-students', authenticate, async (req, res) => {
//     try {
//         const lesson = await Lesson.findById(req.params.lessonId).exec();
//         if (!lesson) return res.status(404).send('Lesson not found');
//         res.json(lesson.completion);
//       } catch (error) {
//         res.status(500).send('Server error');
//       }
//     });
lessonRouter.get('/lesson/:lessonId/completed-students', authenticate, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId).populate({
            path: 'completion.completedStudents',
            select: 'firstName lastName' // Include any other necessary fields
        });

        if (!lesson) return res.status(404).send('Lesson not found');

        const completedStudents = lesson.completion.flatMap(c =>
            c.completedStudents.map(student => ({
                _id: student._id,
                firstName: student.firstName,
                lastName: student.lastName,
                completedAt: c.completedAt // Adjust this if necessary
            }))
        );

        res.json(completedStudents);
    } catch (error) {
        res.status(500).send('Server error');
        console.error("Completed Error:", error);
    }
});

export default lessonRouter;