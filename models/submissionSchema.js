// models/submissionSchema.js
import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    submissionDate: { type: Date, default: Date.now },
    content: { type: String, required: true },
    grade: { type: Number },
    feedback: { type: String }
});

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
