import express from 'express';
import mongoose from 'mongoose';
import Lesson from '../models/lessonSchema.js';
import { authenticate, authorize } from '../middleware/auth.js';

const lessonRouter = express.Router();

// Create a new lesson
lessonRouter.post('/lesson/:courseId', authenticate, authorize(['instructor', 'admin']), async (req, res) => {
    const { courseId } = req.params;
    const { session, description, url } = req.body;

    try {
        // Validate courseId
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid Course ID' });
        }

        const lesson = new Lesson({ session, description, url, course: courseId });
        await lesson.save();
        res.status(201).json(lesson);
    } catch (error) {
        console.error('Error creating lesson:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// Get all lessons for a specific course
lessonRouter.get('/lesson/course/:courseId', authenticate, async (req, res) => {
    const { courseId } = req.params;

    try {
        // Validate courseId
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid Course ID' });
        }

        const lessons = await Lesson.find({ course: courseId }).populate('course');
        if (lessons.length === 0) {
            return res.status(404).json({ message: 'No lessons found for this course' });
        }

        res.status(200).json(lessons);
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get a single lesson by ID
lessonRouter.get('/lesson/:lessonId', authenticate, async (req, res) => {
    const { lessonId } = req.params;

    try {
        // Validate lessonId
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
lessonRouter.put('/lesson/:lessonId', authenticate, authorize(['instructor', 'admin']), async (req, res) => {
    const { lessonId } = req.params;
    const { session, description, url } = req.body;

    try {
        // Validate lessonId
        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            return res.status(400).json({ message: 'Invalid Lesson ID' });
        }

        const updatedLesson = await Lesson.findByIdAndUpdate(
            lessonId,
            { session, description, url },
            { new: true, runValidators: true } // Ensure validators run on update
        );

        if (!updatedLesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        res.status(200).json(updatedLesson);
    } catch (error) {
        console.error('Error updating lesson:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Delete a lesson by ID
lessonRouter.delete('/lesson/:lessonId', authenticate, authorize(['instructor', 'admin']), async (req, res) => {
    const { lessonId } = req.params;

    try {
        // Validate lessonId
        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            return res.status(400).json({ message: 'Invalid Lesson ID' });
        }

        const lesson = await Lesson.findByIdAndDelete(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        res.status(200).json({ message: 'Lesson deleted successfully' });
    } catch (error) {
        console.error('Error deleting lesson:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Mark a lesson as completed or pending
lessonRouter.post('/lesson/:lessonId/complete', authenticate, async (req, res) => {
    const { lessonId } = req.params;
    const { userId, completionStatus } = req.body;

    try {
        // Validate lessonId
        if (!mongoose.Types.ObjectId.isValid(lessonId)) {
            return res.status(400).json({ message: 'Invalid lesson ID' });
        }

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Check if user already has a completion status
        const completionIndex = lesson.completion.findIndex(c => c.completedStudents.includes(userObjectId));
        if (completionIndex !== -1) {
            lesson.completion[completionIndex].completionStatus = completionStatus;
        } else {
            lesson.completion.push({
                completionStatus,
                completedStudents: [userObjectId]
            });
        }

        await lesson.save();
        res.status(200).json({ message: 'Lesson completion status updated' });
    } catch (error) {
        console.error('Error updating lesson status:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Fetch completed students for a lesson
lessonRouter.get('/lesson/:lessonId/completed-students', authenticate, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.lessonId).populate({
            path: 'completion.completedStudents',
            select: 'firstName lastName'
        });

        if (!lesson) return res.status(404).send('Lesson not found');

        const completedStudents = lesson.completion.flatMap(c =>
            c.completedStudents.map(student => ({
                _id: student._id,
                firstName: student.firstName,
                lastName: student.lastName,
                completedAt: c.completedAt
            }))
        );

        res.json(completedStudents);
    } catch (error) {
        console.error('Error fetching completed students:', error);
        res.status(500).send('Server error');
    }
});

export default lessonRouter;

