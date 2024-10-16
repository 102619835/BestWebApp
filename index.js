const bodyParser = require('body-parser');
const express = require('express');
const dbConnect = require('./config/dbConnect');
const app = express();
const dotenv = require('dotenv').config();
const PORT = process.env.PORT || 4000;
const authRouter = require('./routes/authRoute');
const productRouter = require("./routes/productRoute");
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

// Connect to the database
dbConnect();

// Middleware to parse JSON bodies
app.use(morgan('dev'));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());

app.use('/api/user', authRouter); 
app.use('/api/product', productRouter); 



app.listen(PORT, () => {
    console.log(`Server is running at PORT ${PORT}`);
});
