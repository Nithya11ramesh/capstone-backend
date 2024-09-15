import express from 'express';
import mongoose from 'mongoose';
import Assignment from '../models/assignmentSchema.js';
import { authenticate, authorize } from '../middleware/auth.js';

const assignmentRouter = express.Router();

// POST - Create a new assignment for a specific course
assignmentRouter.post('/:courseId', authenticate, authorize(['admin', 'instructor']), async (req, res) => {
  const { title, description, dueDate } = req.body;
  const { courseId } = req.params;

  try {
    const assignment = new Assignment({
      title,
      description,
      dueDate,
      course: courseId,
    });

    const savedAssignment = await assignment.save();
    res.status(201).json(savedAssignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET - Fetch all assignments by courseId
assignmentRouter.get('/:courseId', authenticate, async (req, res) => {
  const { courseId } = req.params;

  try {
    const assignments = await Assignment.find({ course: courseId }).populate('course', 'title');
    if (!assignments || assignments.length === 0) {
      return res.status(404).json({ error: 'Assignments not found' });
    }
    const count = await Assignment.countDocuments({ course: courseId });

    res.status(200).json({ assignments, count });
  } catch (error) {
    console.error('Error fetching assignments by courseId:', error);
    res.status(500).send('Internal Server Error');
  }
});

// GET - Fetch a specific assignment by assignmentId
assignmentRouter.get('/assignment/:assignmentId', authenticate, async (req, res) => {
  const { assignmentId } = req.params;

  try {
    const assignment = await Assignment.findById(assignmentId).populate('submissions.student', 'firstName lastName');
    if (!assignment) {
      return res.status(404).send('Assignment not found');
    }
    res.status(200).json(assignment);
    //console.log("Ass:",assignment);
  } catch (error) {
    console.error('Error fetching assignment by ID:', error);
    res.status(500).send('Internal Server Error');
  }
});

// PUT - Update a specific assignment by assignmentId
assignmentRouter.put('/assignment/:assignmentId', authenticate, authorize(['admin', 'instructor']), async (req, res) => {
    const { assignmentId } = req.params;
    const { title, description, dueDate } = req.body;
  
    try {
      const updatedAssignment = await Assignment.findByIdAndUpdate(
        assignmentId,
        { title, description, dueDate },
        { new: true, runValidators: true }
      );
  
      if (!updatedAssignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
  
      res.status(200).json(updatedAssignment);
    } catch (error) {
      console.error('Error updating assignment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
// POST - Submit a new submission for an assignment
assignmentRouter.post('/submit/:assignmentId', authenticate, async (req, res) => {
  const { assignmentId } = req.params;
  const { submissionUrl } = req.body;
  const student = req.userId; // Assuming req.userId is set by your authentication middleware

  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).send('Assignment not found');
    }

    const submission = {
      student,
      assignmentId,
      submissionUrl
    };

    assignment.submissions.push(submission);
    const updatedAssignment = await assignment.save();

    res.status(201).json(updatedAssignment);
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(400).json({ message: error.message });
  }
});

// GET - Fetch all submissions for a specific course
assignmentRouter.get('/course/:courseId/submissions', authenticate, async (req, res) => {
  const { courseId } = req.params;

  try {
    const assignments = await Assignment.find({ course: courseId });
    const submissions = assignments.flatMap(assignment => assignment.submissions);
    const submissionCount = submissions.length;

    res.status(200).json({ submissions, count: submissionCount });
  } catch (error) {
    console.error('Error fetching submissions for course:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET - Fetch all submissions for a specific assignment
assignmentRouter.get('/assignment/:assignmentId/submissions', authenticate, async (req, res) => {
  const { assignmentId } = req.params;

  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).send('Assignment not found');
    }

    res.status(200).json({ submissions: assignment.submissions });
  } catch (error) {
    console.error('Error fetching submissions by assignmentId:', error);
    res.status(500).json({ message: 'Failed to fetch submissions.' });
  }
});

// DELETE - Delete a specific assignment by assignmentId
assignmentRouter.delete('/:assignmentId', authenticate, authorize(['admin', 'instructor']), async (req, res) => {
  const { assignmentId } = req.params;

  try {
    const deletedAssignment = await Assignment.findByIdAndDelete(assignmentId);
    if (!deletedAssignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PUT - Update a specific assignment by assignmentId
assignmentRouter.put('/:assignmentId', authenticate, authorize(['admin', 'instructor']), async (req, res) => {
    const { assignmentId } = req.params;
    const { title, description, dueDate } = req.body;
  
    try {
      const updatedAssignment = await Assignment.findByIdAndUpdate(
        assignmentId,
        { title, description, dueDate },
        { new: true, runValidators: true }
      );
  
      if (!updatedAssignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
  
      res.status(200).json(updatedAssignment);
    } catch (error) {
      console.error('Error updating assignment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

// DELETE - Delete a submission
assignmentRouter.delete('/submission/:assignmentId/:submissionId', authenticate, authorize(['admin', 'instructor']), async (req, res) => {
  const { assignmentId, submissionId } = req.params;

  console.log('Received request to delete submission:', {
    assignmentId,
    submissionId
  });

  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      console.log('Assignment not found:', assignmentId);
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Use `id` method to get the submission subdocument
    const submission = assignment.submissions.id(submissionId);
    if (!submission) {
      console.log('Submission not found:', submissionId);
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Use `pull` method to remove the subdocument
    assignment.submissions.pull(submissionId);
    const updatedAssignment = await assignment.save();

    res.status(200).json({ message: 'Submission deleted successfully.', assignment: updatedAssignment });
  } catch (error) {
    console.error('Error deleting submission:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

export default assignmentRouter;