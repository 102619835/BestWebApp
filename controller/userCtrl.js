const { get } = require('mongoose');
const { generateToken } = require('../config/jwtToken');
const User = require('../models/userModel'); 
const asyncHandler = require('express-async-handler');

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
    const {email, password} = req.body;
    // check if user exists or not
    const findUser = await User.findOne({ email });
    if(findUser && (await findUser.isPasswordMatched(password))){
        res.json({
            _id: findUser?. _id,
            firstname: findUser?. firstname,
            lastname: findUser?. lastname,
            email: findUser?. email,
            mobile: findUser?. mobile,
            token: generateToken(findUser?. _id),
        });
    } else{
        res.status(401).json({
            msg: 'Invalid Credentials',
            success: false,
        });        
    }
});

const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

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
    getallUser, 
    getaUser, 
    deleteUser, 
    updateUser, 
    blockUser, 
    unblockUser, 
};

