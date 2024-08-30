
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/userSchema.js';  // Assuming you need user data in some routes

dotenv.config();

// Authentication  middleware
export const authenticate = async (req, res, next) => {
  try {
    // Retrieve the authorization header from the request
    const authHeader = req.headers['authorization'];

    // Check if the authorization header exists and starts with 'Bearer'
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    // Extract the token from the authorization header
    const token = authHeader.split(' ')[1];

    // Verify the token using JWT_SECRET from environment variables
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user ID to the request object for use in later middleware or routes
    req.userId = verified.userId;

    // Optionally, fetch and attach user data if needed in routes
    // const user = await User.findById(req.userId);
    // if (!user) {
    //   return res.status(404).json({ message: "User not found" });
    // }
    // req.user = user;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Handle errors during token verification
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: "Invalid token" });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    } else {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};



// Authorization middleware
export const authorize = (roles) =>  {
   return async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
};