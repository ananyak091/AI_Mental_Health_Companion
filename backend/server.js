import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import { protect } from './middlewares/authMiddlewares.js';


dotenv.config(); //Load environment variables
connectDB(); //Connect to MongoDB


const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);


app.get("/api/private", protect, (req, res) => {
  res.json({message: `Welcome ${req.user.name}, you are authorized!`});
})

// test routes
app.get('/', (req, res) => {
  res.send('Welcome to the AI Mental Health Companion Backend 🧠💛');
});

app.get('/api/test', (req, res) => {
  res.json({ok: true, msg: 'Backend server is running'});
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));