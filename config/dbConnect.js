const mongoose = require('mongoose');

const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL); // Removed deprecated options
        console.log("Database Connected Successfully");
    } catch (error) {
        console.error("Database connection error:", error.message);
        process.exit(1); // Optionally exit the process on connection failure
    }
};

module.exports = dbConnect;
//dfgdsfgsfg