const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensure unique email
    },
    mobile: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "user",
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    cart: {
        type: Array,
        default: [],
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        default: null,
    },
    wishlist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null,
    },
    refreshToken: {
        type: String,
    },
    }, 
    {
    timestamps: true,
    }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSaltSync(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.isPasswordMatched = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;