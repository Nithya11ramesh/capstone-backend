import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import userRouter from './router/userRouter.js';
import courseRouter from './router/courseRouter.js';
import lessonRouter from './router/lessonRouter.js';
import enrollmentRouter from './router/enrollmentRouter.js';
import assignmentRouter from './router/assignmentRouter.js';
import quizRouter from './router/quizRouter.js';
// import discussionRouter from './router/discussionRouter.js';
import paymentRouter from './router/paymentRouter.js';
// import submissionRouter from './router/assignmentSubmissionRouter.js';
import dotenv from 'dotenv';+
dotenv.config();

const app = express();

//middleware

app.use(express.json());
const allowedOrigins = [
  'http://localhost:5173',
  'https://enchanting-lily-d07d74.netlify.app/'
]; // Add other origins if needed
app.use(cors({
  origin: (origin, callback) => {
    console.log('Request origin:', origin); // For debugging
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
  

//routes
app.use('/apiUsers', userRouter);
app.use('/apiCourses', courseRouter);
app.use('/apiEnrollments', enrollmentRouter);
app.use('/apiAssignments', assignmentRouter);
app.use('/apiQuizzes', quizRouter);
// app.use('/apiDiscussion', discussionRouter);
app.use('/apiPayments', paymentRouter);
//app.use('/apiSubmissions', submissionRouter);
app.use('/apiLessons', lessonRouter);


  


const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('connected to MONGODB successfully..!')
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MONGODB connection error:', error);
    });