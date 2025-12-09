import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import fs from 'fs';

// Routes
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';

// ML Detection Module
import { startDetectionSimulation } from './ml_module/detection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Create HTTPS server with self-signed certificate for development
let server;
try {
  // Try to create HTTPS server (you may need to generate certificates)
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
  };
  server = https.createServer(httpsOptions, app);
  console.log('🔒 HTTPS server created');
} catch (error) {
  // Fallback to HTTP if certificates are not available
  console.log('⚠️  HTTPS certificates not found, falling back to HTTP');
  server = createServer(app);
}

const io = new Server(server, {
  cors: {
    origin: ["https://localhost:5173", "http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: ["https://localhost:5173", "http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB Connection with better error handling
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/project';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.warn('⚠️  MongoDB connection failed:', err.message);
    console.log('📝 System will continue without database functionality');
  }
};

// Connect to database
connectDB();

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.warn('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

// Routes
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start ML detection simulation
startDetectionSimulation(io);

// Default route
app.get('/', (req, res) => {
  res.redirect('/admin/dashboard');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 5000;
const protocol = server instanceof https.Server ? 'https' : 'http';

server.listen(PORT, () => {
  console.log(`🚀 Server running on ${protocol}://localhost:${PORT}`);
  console.log(`📊 Admin Dashboard: ${protocol}://localhost:${PORT}/admin/dashboard`);
  console.log(`🔌 API Endpoints: ${protocol}://localhost:${PORT}/api`);
});

export { io };