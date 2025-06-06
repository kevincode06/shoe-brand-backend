require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const shoeRoutes = require('./routes/shoeRoutes'); // Optional
const userRoutes = require('./routes/userRoutes'); // Optional

const app = express();

// Replace this:
  // app.use(cors());

// With this:
const allowedOrigins = [
  'https://your-frontend-domain.vercel.app', // <-- replace with your actual deployed frontend URL
  'http://localhost:3000',                   // for local React dev server
];

app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like curl or Postman)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,  // if you use cookies or authentication
}));

app.use(express.json());

// DB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shoes', shoeRoutes);
app.use('/api/users', userRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;