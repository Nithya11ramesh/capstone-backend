import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/userSchema.js';  // Adjust the path according to your project structure

dotenv.config();

// Authentication middleware
// export const authenticate = async (req, res, next) => {
//   try {
//     // Retrieve the authorization header from the request
//     const authHeader = req.headers['authorization'];

//     // Check if the authorization header exists and starts with 'Bearer'
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ message: "Access denied. No token provided." });
//     }

//     // Extract the token from the authorization header
//     const token = authHeader.split(' ')[1];
// console.log(token);
//     // Verify the token using JWT_SECRET from environment variables
//     const verified = jwt.verify(token, process.env.JWT_SECRET);

//     // Attach the user ID to the request object for use in later middleware or routes
//     req.userId = verified.userId;

   
//     next();
//   } catch (error) {
//     // Handle errors during token verification
//     if (error.name === 'JsonWebTokenError') {
//       return res.status(400).json({ message: "Invalid token" });
//     } else if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ message: "Token expired" });
//     } else {
//       return res.status(500).json({ message: "Internal server error" });
//     }
//   }
// };


export const authenticate = (req, res, next) => {
  // Extract token from the Authorization header (Bearer token)
  const token = req.headers['authorization']?.split(' ')[1]; // Safely access the header

  // If no token is found, return a 401 status
  if (!token) {
    return res.status(401).json({ message: 'No token found' });
  }

  // Verify the token using JWT
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    // If there's an error (e.g., invalid or expired token), return 403
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    // Attach the decoded user data to the request object
    req.user = user;

    // Proceed to the next middleware or route handler
    next();
  });
};
// Authorization middleware
export const authorize = (roles) => {
  return async (req, res, next) => {
    try {
      // Fetch user from database using userId attached in authenticate middleware
      const user = await User.findById(req.userId);
      
      // Check if the user exists and if their role is allowed
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  };
};

