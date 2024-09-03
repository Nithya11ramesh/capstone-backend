import mongoose from "mongoose";

const completionSchema = new mongoose.Schema(
  {
    completionStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    quizScore: {
      type: Number,
      default: 0,
    },
    completedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const lessonSchema = new mongoose.Schema(
  {
    session: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String, // Assuming image will be stored as a URL or path
      required: true,
    },
    url: [
      {
        type: String,
        validate: {
          validator: function (value) {
            // Regex to validate YouTube URL
            return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}$/.test(
              value
            );
          },
          message: (props) => `${props.value} is not a valid YouTube URL!`,
        },
      },
    ],
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
    },
    completion: [completionSchema], // Wrap the completion schema in an array
  },
  { timestamps: true } // Correctly place the timestamps option
);

const Lesson = mongoose.models.Lesson || mongoose.model("Lesson", lessonSchema);

export default Lesson;
