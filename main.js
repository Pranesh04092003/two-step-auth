const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const auth = require('./routes/auth');
const dotenv = require ("dotenv");


const app = express();
connectDB();

app.use(bodyParser.json());
app.use('/api/auth', auth);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    

