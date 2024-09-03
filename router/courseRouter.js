import express from "express";
import Course from "../models/courseSchema.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import { authenticate, authorize } from "../middleware/auth.js";
import dotenv from "dotenv";
dotenv.config();

const courseRouter = express.Router();

// Multer config with memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create a new course
courseRouter.post(
  "/",
  authenticate,
  authorize(["instructor", "admin"]),
  upload.array("media"),
  async (req, res) => {
    const { title, description, instructor, price, duration, category } = req.body;
    try {
      const mediaUrls = [];
      for (let file of req.files) {
        const uploadResult = await cloudinary.uploader.upload(file.buffer, {
          resource_type: "auto",
        });
        mediaUrls.push(uploadResult.secure_url);
      }

      const course = new Course({
        title,
        description,
        images: mediaUrls,
        instructor,
        lessons: [], // Initialize lessons as an empty array
        price,
        duration,
        category,
        user: req.userId,
      });

      await course.save();

      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(400).json({ error: "Error creating course" });
    }
  }
);

// Get all courses with related details
courseRouter.get("/getCourses", async (req, res) => {
  try {
    const courses = await Course.aggregate([
      {
        $lookup: {
          from: "users", // Collection name for users/instructors
          localField: "instructor", // Field in the courses collection
          foreignField: "_id", // Field in the users collection
          as: "instructorDetails"
        }
      },
      {
        $unwind: "$instructorDetails" // Deconstructs the array, if populated
      },
      {
        $project: {
          "instructorDetails.firstName": 1,
          "instructorDetails.lastName": 1,
          "lessons": 1,
          "quiz": 1,
          "assignment": 1,
          "enrollment": 1
        }
      },
      {
        $lookup: {
          from: "lessons", // Collection name for lessons
          localField: "lessons",
          foreignField: "_id",
          as: "lessonsDetails"
        }
      },
      {
        $lookup: {
          from: "quizzes", // Collection name for quizzes
          localField: "quiz",
          foreignField: "_id",
          as: "quizDetails"
        }
      },
      {
        $lookup: {
          from: "assignments", // Collection name for assignments
          localField: "assignment",
          foreignField: "_id",
          as: "assignmentDetails"
        }
      },
      {
        $lookup: {
          from: "enrollments", // Collection name for enrollments
          localField: "enrollment",
          foreignField: "_id",
          as: "enrollmentDetails"
        }
      }
    ]);

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
    console.error("Error:", error);
  }
});

// Get course by ID
courseRouter.get("/:courseId", authenticate, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    if (!courseId) {
      return res.status(400).json({ error: "Course ID not provided" });
    }

    const course = await Course.findById(courseId).populate("instructor");
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update course by ID
courseRouter.put(
  "/:courseId",
  authenticate,
  authorize(["instructor", "admin"]),
  upload.array("media"),
  async (req, res) => {
    try {
      const { title, description, instructor, price, duration, category } = req.body;
      const courseId = req.params.courseId;

      const course = await Course.findById(courseId).populate("instructor");
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Update fields
      course.title = title ?? course.title;
      course.description = description ?? course.description;
      course.instructor = instructor ?? course.instructor;
      course.price = price ?? course.price;
      course.duration = duration ?? course.duration;
      course.category = category ?? course.category;

      // Handle image update
      if (req.files && req.files.length > 0) {
        const mediaUrls = [];
        for (let file of req.files) {
          const uploadResult = await cloudinary.uploader.upload(file.buffer, {
            resource_type: "auto",
          });
          mediaUrls.push(uploadResult.secure_url);
        }
        course.images = mediaUrls;
      }

      const updatedCourse = await course.save();
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Delete course by ID
courseRouter.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const courseId = req.params.id;

      const course = await Course.findByIdAndDelete(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      res.json({ message: "Course deleted successfully", course });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default courseRouter;
