// discussionRouter.js
import express from 'express';
import Discussion from '../models/discussionSchema.js';
import { authenticate } from '../middleware/auth.js';
import { sendEmail } from '../utils/mailer.js'; // Adjust path as per your project structure

const discussionRouter = express.Router();

// Create a new discussion
discussionRouter.post('/discussions', authenticate, async (req, res) => {
    try {
        const { course, content } = req.body;

        const discussion = new Discussion({ course, content, user: req.user._id });
        await discussion.save();

        // Send email notification to admin and instructors
        const recipients = ['admin_email@example.com']; // Replace with actual admin email
        // Assuming instructors' emails are stored in the database or passed in req.body

        await Promise.all(recipients.map(recipient => sendEmail(recipient, 'New Discussion', `A new discussion has been posted:\n\n${content}`)));

        res.status(201).send(discussion);
    } catch (error) {
        console.error(error);
        res.status(400).send(error);
    }
});

// Get all discussions
discussionRouter.get('/discussions', authenticate, async (req, res) => {
    try {
        const discussions = await Discussion.find().populate('user', 'firstName lastName email').populate('course', 'title');
        res.send(discussions);
    } catch (error) {
        console.error(error);
        res.status(500).send();
    }
});

// Get a specific discussion by ID
discussionRouter.get('/discussions/:discussionId', authenticate, async (req, res) => {
    try {
        const discussion = await Discussion.findById(req.params.discussionId)
            .populate('user', 'firstName lastName email')
            .populate('course', 'title');
        if (!discussion) {
            return res.status(404).send({ error: 'Discussion not found' });
        }
        res.send(discussion);
    } catch (error) {
        console.error(error);
        res.status(500).send();
    }
});

// Add a reply to a discussion
discussionRouter.post('/discussions/:discussionId/replies', authenticate, async (req, res) => {
    try {
        const { discussionId } = req.params;
        const { content } = req.body;

        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            return res.status(404).send({ error: 'Discussion not found' });
        }

        const newReply = {
            user: req.user._id,
            content,
        };

        discussion.replies.push(newReply);
        await discussion.save();

        // Send email notification to original poster
        const discussionOwnerEmail = discussion.user.email;

        await sendEmail(discussionOwnerEmail, 'New Reply', `A new reply has been posted to your discussion: ${content}`);

        res.status(201).send({ message: 'Reply added successfully', reply: newReply });
    } catch (error) {
        console.error(error);
        res.status(400).send(error);
    }
});

export default discussionRouter;