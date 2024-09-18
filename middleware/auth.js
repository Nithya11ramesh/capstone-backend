import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/userSchema.js';

dotenv.config();

// Authentication middleware
export const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verified.userId; // Ensure this line is correctly setting the userId
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
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