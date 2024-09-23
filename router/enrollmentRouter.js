import express from 'express';
import Enrollment from '../models/enrollmentSchema.js'; // adjust the path to your actual model file
import { authenticate, authorize } from '../middleware/auth.js'; // import your authentication middleware

const enrollmentRouter = express.Router();

// Create a new enrollment
enrollmentRouter.post('/:courseId', authenticate, async (req, res) => {
    try {
        // Create a new Enrollment document
        const newEnrollment = new Enrollment({
            ...req.body,
            courseId: req.params.courseId,
            userId: req.userId
        });

        // Save the new enrollment
        const savedEnrollment = await newEnrollment.save();

        // Update the corresponding User document's enrollment array
        await User.findByIdAndUpdate(
            req.userId,
            { $push: { enrollment: savedEnrollment._id }, enrollStatus: 'enrolled' },
            { new: true }
        );

        // Respond with the saved enrollment data
        res.status(201).json({ savedEnrollment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Get all enrollments
enrollmentRouter.get('/', authenticate, async (req, res) => {
    try {
        const enrollments = await Enrollment.find({}).populate('user').populate('course');
        res.status(200).json({ enrollments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all enrollments for a course
enrollmentRouter.get('/:courseId', authenticate, async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ course: req.params.courseId }).populate('user').populate('course');

        res.status(200).json({ enrollments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// // Get all enrollments for a user
// enrollmentRouter.get('/:userId', authenticate, async (req, res) => {
//     try {
//         const enrollments = await Enrollment.findById({ user: req.params.userId }).populate('course');
//         res.status(200).json(enrollments);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });
// Get all enrollments for a user
// enrollmentRouter.get('/user/:userId', authenticate, async (req, res) => {
//     try {
//         const enrollments = await Enrollment.find({ user: req.params.userId }).populate('course');
//         res.status(200).json({ enrollments });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// Get all enrollments for a user
enrollmentRouter.get('/user/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params; // Extract userId from request parameters
        
        // Check if the user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch enrollments for the specified user
        const enrollments = await Enrollment.find({ user: userId }).populate('course');
        
        // Check if enrollments are found
        if (!enrollments.length) {
            return res.status(404).json({ message: 'No enrollments found for this user.' });
        }

        res.status(200).json({ enrollments });
    } catch (error) {
        console.error('Error fetching enrollments for user:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch enrollments.' });
    }
});

// Get a specific enrollment by ID
enrollmentRouter.get('/:courseId/:enrollmentId', authenticate, async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.enrollmentId).populate('user').populate('course');
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        res.status(200).json({ enrollment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a specific enrollment by ID
enrollmentRouter.put('/:enrollmentId', authenticate, authorize(['admin']), async (req, res) => {
    const enrollmentId = req.params.enrollmentId; // Correctly access enrollmentId from req.params
    const updatedEnrollmentData = req.body; // Ensure this includes passOutYear as a number

    try {
        const updatedEnrollment = await Enrollment.findByIdAndUpdate(
            enrollmentId,
            updatedEnrollmentData,
            { new: true, runValidators: true } // Ensure validators run on update
        );
        if (!updatedEnrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        res.status(200).json(updatedEnrollment);
        console.log("UpdatedEnrollment:", updatedEnrollment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



// Delete a specific enrollment by ID
enrollmentRouter.delete('/:enrollmentId', authenticate, authorize(['admin']), async (req, res) => {
    const { enrollmentId } = req.params;

    try {
        const deletedEnrollment = await Enrollment.findByIdAndDelete(enrollmentId);
        if (!deletedEnrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }
        res.status(200).json({ message: 'Enrollment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default enrollmentRouter;