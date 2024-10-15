const bodyParser = require('body-parser');
const express = require('express');
const dbConnect = require('./config/dbConnect');
const app = express();
const dotenv = require('dotenv').config();
const PORT = process.env.PORT || 4000;
const authRouter = require('./routes/authRoute');
const cookieParser = require('cookie-parser');

// Connect to the database
dbConnect();

// Middleware to parse JSON bodies
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());
app.use('/api/user', authRouter); 

app.listen(PORT, () => {
    console.log(`Server is running at PORT ${PORT}`);
});
