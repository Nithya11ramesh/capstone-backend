import mongoose from 'mongoose';
const submissionSchema = new mongoose.Schema({
    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    submissionUrl: {
        type: String,
        required: true
    },
    grade: {
        type: Number, // Represents marks for the submission
        min: 0, // Minimum value for marks (if needed)
        max: 10, // Maximum value for marks (if needed)
    },
    comments: {
        type: String // Optional comments for feedback
    }
}, { timestamps: true });


const assignmentSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    submissions: [submissionSchema] // Submissions array
}, { timestamps: true });

const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);

export default Assignment;