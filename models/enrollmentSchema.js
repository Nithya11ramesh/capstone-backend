import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    qualification: {
        type: String,
        enum: ["UG", "PG", "Diploma", "Others"],
        required: true
    },
    passOutYear: {
        type: Number,
        required: true,
        validate: {
            validator: function (v) {
                const currentYear = new Date().getFullYear();
                return /^\d{4}$/.test(v) && v >= 2015 && v <= currentYear;
            },
            message: props => `${props.value} is not a valid 4-digit year between 2015 and current year!`
        }
    },
    paymentStatus: {
        type: String,
        enum: ["paid", "pending"],
        required: true
    },
    enrollDate: {
        type: Date,
        default: Date.now
    },
    
}, { timestamps: true });

const Enrollment = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);

export default Enrollment