import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    submissionDate: { type: Date, default: Date.now },
    content: { type: String, required: true },
    grade: { type: Number, default: null }, // Default to null if not graded yet
    feedback: { type: String, default: '' }  // Default to empty string
});

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission; 