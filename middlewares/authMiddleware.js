const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const authMiddleware = asyncHandler(async (req, res, next) => {
    let token;
    if (req?.headers?.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        try {
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // You can also attach the decoded user information to req.user if needed
                req.user = await User.findById(decoded.id).select('-password'); // Assuming token contains user ID

                next(); // Move to the next middleware or route handler
            }
        } catch (error) {
            res.status(401).json({
                success: false,
                msg: 'Not Authorized, token expired or invalid. Please log in again',
            });
        }
    } else {
        res.status(401).json({
            success: false,
            msg: "No token provided, authorization denied",
        });
    }
});

const isAdmin = asyncHandler(async (req, res, next) => {
    if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            msg: 'Access denied. You are not an admin.',
        });
    } else {
        next();
    }
});

module.exports = {authMiddleware, isAdmin};
