import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    images: [{
        type: String,
    }],
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lessons: [{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Lesson'
    }],
    quiz: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
    }],
    assignment: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment'
    }],
    enrollment: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Enrollment'
    }],
    price: {
        type: Number,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },

}, { timestamps: true });

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

export default Course;