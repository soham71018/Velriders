
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
app.use(express.json());
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

mongoose.connect('mongodb://127.0.0.1:27017/userDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err));

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, default: function() { return this.userId; } },
  profileImage: { type: String }
}, { versionKey: false });

const User = mongoose.model('User', userSchema);

const bookingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  vehicleId: String,
  fromDate: String,
  fromTime: String,
  toDate: String,
  toTime: String,
  totalPrice: String,
  paymentId: String,
  status: String,
  bookingDate: { type: Date, default: Date.now }
}, { versionKey: false });

const Booking = mongoose.model('Booking', bookingSchema);

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    req.user = user;
    next();
  });
}

app.post('/register', async (req, res) => {
  const { userId, email, password } = req.body;
  console.log('📝 Register Request:', { userId, email, password });

  try {
    const existingUser = await User.findOne({ $or: [{ userId }, { email }] });
    if (existingUser) return res.status(400).json({ success: false, message: 'User ID or Email already exists' });

    const newUser = new User({ userId, email, password });
    await newUser.save();
    res.json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  const { userId, password } = req.body;
  console.log('🔑 Login Request:', { userId, password });

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (user.password !== password) {
      console.log('❌ Incorrect password for:', userId);
      return res.status(400).json({ success: false, message: 'Incorrect password' });
    }

    const token = jwt.sign({ userId: user.userId }, SECRET_KEY, { expiresIn: '1h' });
    console.log('✅ Login successful for:', userId);
    res.json({ 
      success: true, 
      token, 
      name: user.name,
      profileImage: user.profileImage 
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/bookings', authenticateToken, async (req, res) => {
  console.log('📅 Booking Request:', req.body);
  try {
    const booking = new Booking({ ...req.body, userId: req.user.userId });
    await booking.save();
    res.json({ success: true, booking });
  } catch (error) {
    console.error("❌ Booking Creation Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/bookings/:userId', authenticateToken, async (req, res) => {
  console.log('📋 Fetching bookings for:', req.params.userId);
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
    const bookings = await Booking.find({ userId: req.params.userId });
    res.json({ success: true, bookings });
  } catch (error) {
    console.error("❌ Booking Retrieval Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/profile/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.userId;
    const imageBase64 = req.file.buffer.toString('base64');
    const imageData = `data:${req.file.mimetype};base64,${imageBase64}`;

    const user = await User.findOneAndUpdate(
      { userId },
      { profileImage: imageData },
      { new: true }
    );

    res.json({ 
      success: true, 
      message: 'Profile image updated',
      profileImage: imageData 
    });
  } catch (error) {
    console.error("❌ Profile Image Update Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    res.json({
      success: true,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error("❌ Profile Fetch Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.listen(3000, () => console.log('🚀 Server running on port 3000'));