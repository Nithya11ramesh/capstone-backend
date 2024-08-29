import express from 'express';
import Submission from '../models/submissionSchema.js';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middleware/auth.js';

const submissionRouter = express.Router();

// Submit a new submission
submissionRouter.post('/:assignmentId', authenticate, async (req, res) => {
    const assignmentId = req.params.assignmentId;
    const { submissionUrl } = req.body;
    const student = req.userId; // Assuming req.userId is set by your authentication middleware

    try {
        const submissionData = { assignment: assignmentId, student, submissionUrl };
        const submission = await Submission.create(submissionData);
        res.status(201).json({ data: submission }); // Ensure 'data' property is included
        console.log("Assignment Submission:", submission);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// Fetch all submissions for a specific course
submissionRouter.get('/course/:courseId', authenticate, async (req, res) => {
    const { courseId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: 'Invalid courseId format.' });
        }

        const submissions = await Submission.find({ course: courseId }).populate('student', 'firstName lastName');
        const submissionCount = await Submission.countDocuments({ course: courseId });

        res.send({ submissions, count: submissionCount });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// Fetch all submissions for a specific assignment
submissionRouter.get('/assignment/:assignmentId', authenticate, async (req, res) => {
    const assignmentId = req.params.assignmentId;

    try {
        if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
            return res.status(400).send({ message: 'Invalid assignmentId format.' });
        }

        const submissions = await Submission.find({ assignment: assignmentId })
            .populate('student', 'firstName lastName');

        console.log("Submission By AssId:", submissions);
        res.send({ submissions });
    } catch (err) {
        console.error('Error fetching submissions by assignmentId:', err.message);
        res.status(500).send({ message: 'Failed to fetch submissions.' });
    }
});

// Fetch a submission by its submissionId
submissionRouter.get('/submission/:submissionId', authenticate, async (req, res) => {
    const { submissionId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(submissionId)) {
            return res.status(400).send({ message: 'Invalid submissionId format.' });
        }

        const submission = await Submission.findById(submissionId).populate('student', 'firstName lastName');

        if (!submission) {
            return res.status(404).send({ message: 'Submission not found.' });
        }

        res.send(submission);
    } catch (err) {
        console.error('Error fetching submission by submissionId:', err.message);
        res.status(500).send({ message: 'Failed to fetch submission.' });
    }
});

// Grade a submission
submissionRouter.put('/:submissionId/grade', authenticate, authorize(['admin', 'instructor']), async (req, res) => {
    const { submissionId } = req.params;
    const { grade, comments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
        return res.status(400).json({ message: 'Invalid submission ID' });
    }

    try {
        const submission = await Submission.findByIdAndUpdate(
            submissionId,
            { grade, comments },
            { new: true }
        );

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        res.status(200).json(submission);
    } catch (error) {
        console.error('Error grading submission:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a submission
submissionRouter.delete('/:submissionId', authenticate, authorize(['admin', 'instructor']), async (req, res) => {
    const { submissionId } = req.params;

    try {
        await Submission.findByIdAndDelete(submissionId);
        res.status(200).json({ message: 'Submission deleted successfully.' });
    } catch (error) {
        res.status(500).send(error);
    }
});

export default submissionRouter;