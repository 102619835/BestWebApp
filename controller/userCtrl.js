const { get } = require('mongoose');
const { generateToken } = require('../config/jwtToken');
const User = require('../models/userModel'); 
const asyncHandler = require('express-async-handler');
const validateMongoDbId = require('../utils/validateMongodb');
const { generateRefreshToken } = require('../config/refreshToken');
const jwt = require('jsonwebtoken');


const createUser = asyncHandler(async (req, res) => {
    const email = req.body.email;
    const mobile = req.body.mobile;

    try {
        // Check if the user already exists by email or mobile
        const findUserByEmail = await User.findOne({ email });
        const findUserByMobile = await User.findOne({ mobile });

        if (findUserByEmail || findUserByMobile) {
            return res.status(400).json({
                success: false,
                msg: "User with this email or mobile already exists",
            });
        }

        // Create New User
        const newUser = await User.create(req.body);
        res.status(201).json(newUser);
    } catch (error) {
        if (error.code === 11000) {
            // Catch duplicate key error
            return res.status(400).json({
                success: false,
                msg: "Duplicate entry: A user with this mobile or email already exists.",
            });
        }
        // Handle other errors
        throw new Error(error);
    }
});


const loginUserCtrl = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const findUser = await User.findOne({ email });

    // Check if user exists and password matches
    if (findUser && (findUser.isPasswordMatched(password))) {
        const refreshToken = await generateRefreshToken(findUser.id);
        await User.findByIdAndUpdate(findUser._id, { refreshToken: refreshToken }, { new: true });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // Ensure secure is enabled in production
            sameSite: 'Strict',
            maxAge: 72 * 60 * 60 * 1000, // 3 days
        });

        res.json({
            _id: findUser._id,
            firstname: findUser.firstname,
            lastname: findUser.lastname,
            email: findUser.email,
            mobile: findUser.mobile,
            token: generateToken(findUser._id),
        });
    } else {
        res.status(401).json({
            msg: 'Invalid Credentials',
            success: false,
        });
    }
});


const handleRefreshToken = asyncHandler(async (req, res) => {
    const cookies = req.cookies;

    if (!cookies?.refreshToken) {
        return res.status(403).json({ msg: 'No refresh token provided' });
    }

    const refreshToken = cookies.refreshToken;
    console.log("Refresh token in cookies:", refreshToken);

    // Find the user with the matching refresh token in the database
    const user = await User.findOne({ refreshToken });
    if (!user) {
        return res.status(403).json({ msg: ' No user match refresh token' });
    }

    // Verify the refresh token
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ msg: 'Invalid refresh token' });
        }

        // If token is valid, generate a new access token
        const newAccessToken = generateToken(user._id);

        // Send the new access token back to the client
        res.json({ accessToken: newAccessToken });
    });
});

const logoutUser = asyncHandler(async (req, res) => {
    const cookies = req.cookies;

    // Check if there is a refresh token in cookies
    if (Object.getPrototypeOf(cookies) === null) {
        console.log('No refresh token in cookies');
        return res.status(200).json({ msg: 'No content, already logged out' }); // 204 - No Content
    }

    const refreshToken = cookies.refreshToken;

    // Find the user by refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) {
        // If no user is found, clear the refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Set secure only in production
        });
        return res.status(200).json({ msg: 'Logged out successfully' });
    }

    // Remove the refresh token from the user document
    user.refreshToken = '';
    await user.save();

    // Clear the refresh token cookie on the client
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Set secure only in production
    });

    return res.status(200).json({ msg: 'Logged out successfully' });
});



const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id,
            req.body, // Fields to update
            { 
                new: true, runValidators: true 
            } // Options: return the updated document, and run validations
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                msg: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            msg: "User updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "An error occurred while updating the user",
            error: error.message,
        });
    }
});


const getallUser = asyncHandler(async (req, res) => {
    const getUsers = await User.find();
    res.status(200).json(getUsers); // Send a success response with status 200
});

const getaUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log("ID passed in params:", id);  // Log the ID

    validateMongoDbId(id);  // Check if the ID is valid

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "User not found",
            });
        }
        res.status(200).json(user);
    } catch (error) {
        throw new Error(error);
    }
});


const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);

    try {
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            msg: "User deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "An error occurred while deleting the user",
            error: error.message,  // You can send the error message to the client if necessary
        });
    }
});

const blockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "User not found",
            });
        }

        user.isBlocked = true;
        await user.save();

        res.status(200).json({
            success: true,
            msg: "User has been blocked",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "An error occurred while blocking the user",
            error: error.message,
        });
    }
});

const unblockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "User not found",
            });
        }

        user.isBlocked = false;
        await user.save();

        res.status(200).json({
            success: true,
            msg: "User has been unblocked",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            msg: "An error occurred while unblocking the user",
            error: error.message,
        });
    }
});


module.exports = { 
    createUser, 
    loginUserCtrl,
    handleRefreshToken, 
    getallUser, 
    getaUser, 
    deleteUser, 
    updateUser, 
    blockUser, 
    unblockUser,
    logoutUser, 
};

