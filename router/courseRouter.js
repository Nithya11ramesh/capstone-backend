import express from 'express';
import Course from '../models/courseSchema.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import dotenv from 'dotenv';
dotenv.config();
const courseRouter = express.Router();
// multer config
const storage = multer.diskStorage({});
const upload = multer({ storage });

// Create a new course
courseRouter.post('/', authenticate, authorize(['instructor', 'admin']), upload.array("media"), async (req, res) => {
    const {
        title,
        description,
        instructor,
        price,
        duration,
        category,
    } = req.body;
    // console.log('Request body:', req.body);  // Debug: Log request body
    // console.log('Uploaded files:', req.files);  // Debug: Log uploaded files
    try {

        //   const mediaUrls = await Promise.all(
        //     req.files.map(async (file) => {
        //       return new Promise((resolve, reject) => {
        //         const uploadStream = cloudinary.uploader.upload_stream(
        //           {
        //             resource_type: "auto",
        //           },
        //           (error, result) => {
        //             if (error) return reject(error);
        //             resolve(result.secure_url);
        //           }
        //         );
        //         uploadStream.end(file.buffer);
        //       });
        //     })
        //   );

        // Upload media files to cloud if any
        // async function uploadBufferAsync(buffer) {
        //     return new Promise((resolve, reject) => {
        //       cloudinary.uploader.upload_stream(
        //         {
        //           resource_type: 'raw',
        //           format: 'jpg',
        //         },
        //         function (error, result) {
        //           if (error) {
        //             return reject(error);
        //           }
        //           resolve(result);
        //         }
        //       ).end(buffer);
        //     });
        //   }
        const mediaUrls = [];
        // console.log(req.files);
        for (let file of req.files) {
            let Data = await cloudinary.uploader.upload(file.path);
            console.log(Data);
            mediaUrls.push(Data.url)
        }

        const course = new Course({
            title,
            description,
            images: mediaUrls.filter(url => url.endsWith('.jpg') || url.endsWith('.png')),
            instructor,
            lessons: [], // Initialize lessons as empty array
            price,
            duration,
            category,
            user: req.userId
        });
        await course.save();

        // Log the response being sent
        //const response = { course, message: 'Course Created Successfully...!' };

        // Respond with success message and created course details
        res.status(201).json(course);
        console.log("course:", course);
    } catch (error) {
        console.error('Error creating course:', error); // Add detailed logging
        res.status(400).json({ error: error.message }); //
    }
});

// Get all courses
courseRouter.get('/getCourses', async (req, res) => {
    try {
        const courses = await Course.find({}).populate('instructor', 'firstName lastName');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: 'server error' });
        console.error("Error:", error);
    }
});

// Get course by ID
courseRouter.get('/:courseId', authenticate, async (req, res) => {

    try {
        const courseId = req.params.courseId;
        // console.log("courseId:", courseId)
        if (!courseId) {
            return res.status(400).json('CourseId not Found');
        }
        const course = await Course.findById(courseId).populate('instructor');
        if (!course) {
            return res.status(404).json('course not found');
        }
        res.json(course);
    } catch (error) {
        res.status(500).json('server Error');
        console.error("Error:", error)
    }
});

// Update course by ID
courseRouter.put('/:courseId', authenticate, authorize(['instructor', 'admin']), upload.array("media"), async (req, res) => {
    try {
        const {
            title,
            description,
            instructor,
            price,
            duration,
            category,
        } = req.body;

        const courseId = req.params.courseId
        const course = await Course.findById(courseId).populate('instructor');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        //update field:
        course.title = title ?? course.title;
        course.description = description ?? course.description;
        course.instructor = instructor ?? course.instructor;
        course.price = price ?? course.price;
        course.duration = duration ?? course.duration;
        course.category = category ?? course.category;
        course.user = req.userID
        // Handle image update
        if (req.files && req.files.length > 0) {
            const mediaUrls = [];
            for (let file of req.files) {
                const uploadResult = await cloudinary.uploader.upload(file.path);
                mediaUrls.push(uploadResult.secure_url);
            }
            course.images = mediaUrls;
        }
        const updatedCourse = await course.save();
        // console.log(updatedCourse)

        res.json(updatedCourse);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
// Delete course by ID
courseRouter.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const courseId = req.params.id;

        const course = await Course.findByIdAndDelete(courseId);
        if (!course) {
            return res.status(404).json();
        }
        res.json(course);
    } catch (error) {
        res.status(500).json(error);
    }
});

export default courseRouter;