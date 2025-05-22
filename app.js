const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/employee', require('./routes/employee'));
app.use('/api/manager', require('./routes/manager'));
app.use('/api/admin', require('./routes/admin'));
app.use(express.static('public'));

app.listen(5000, () => console.log('Server running on port 5000'));