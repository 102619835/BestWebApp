const User = require('../models/userModel'); 

const createUser = async (req, res) => {
    const email = req.body.email; 

    const findUser = await User.findOne({ email: email }); 
        if (!findUser) {
            // Create New User
            const newUser = await User.create(req.body); // Await the user creation
            res.json(newUser); // Send back the created user
        } else {
            // User Already Exists
            res.json({
                msg: "User already Exists.",
                success: false,
            });
        }
};

module.exports = { createUser };
