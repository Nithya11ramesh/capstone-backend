import mongoose from 'mongoose';

const { Schema } = mongoose;

const replySchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const discussionSchema = new Schema({
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    replies: [replySchema],
    createdAt: { type: Date, default: Date.now }
});

const Discussion = mongoose.model('Discussion', discussionSchema);

export default Discussion;