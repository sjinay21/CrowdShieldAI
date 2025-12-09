# Smart CCTV Surveillance System with Crowd Analysis

A comprehensive CCTV surveillance system that combines real-time security monitoring with AI-powered crowd analysis. Perfect for CSE final year projects, this system demonstrates modern web development, computer vision, and machine learning integration.

## 🌟 Features

### 🔒 Security Monitoring
- **Real-time Event Detection**: Suspicious activity monitoring with AI alerts
- **Multi-Camera Support**: Monitor multiple camera feeds simultaneously
- **Alert Management**: Categorized alerts by severity (Low, Medium, High, Critical)
- **Live Dashboard**: Beautiful real-time dashboard with glass-morphism design

### 👥 Crowd Analysis
- **Real-time People Counting**: AI-powered person detection using YOLOv8
- **Density Analysis**: Crowd density monitoring with heatmaps
- **Peak Hours Detection**: Automatic identification of busy periods
- **Overcrowding Alerts**: Automatic alerts when safe capacity is exceeded
- **Zone-based Analysis**: Monitor specific areas within camera view

### 🎥 Live Camera Integration
- **Webcam Support**: Use your laptop camera for live demonstration
- **Recording Capabilities**: Record and save surveillance footage
- **Real-time Overlay**: Display crowd count and density on live feed
- **Multiple Camera Views**: Support for multiple camera sources

### 📊 Analytics & Reporting
- **Historical Data**: Track trends over time
- **Peak Hours Analysis**: Identify busiest times of day
- **Event Statistics**: Comprehensive analytics dashboard
- **Export Capabilities**: Download reports and recordings

## 🏗️ Architecture

```
Frontend (React + TypeScript)
├── Real-time Dashboard
├── Live Camera Feed
├── Analytics Visualization
└── Crowd Analysis Interface

Backend (Node.js + Express)
├── REST API Endpoints
├── Socket.IO Real-time Communication
├── MongoDB Database
└── Python Integration Bridge

Computer Vision (Python + OpenCV)
├── YOLOv8 Person Detection
├── Crowd Counting Algorithms
├── Density Analysis
└── Behavioral Pattern Recognition

Database (MongoDB)
├── Event Storage
├── Crowd Analytics Data
├── Historical Trends
└── Camera Configurations
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- MongoDB (optional - system works without database)
- Webcam/Camera for live demonstration

### 1. Clone and Setup Backend
```bash
# Navigate to backend directory
cd backend

# Install Node.js dependencies
npm install

# Start the backend server
npm run dev
```

### 2. Setup Frontend
```bash
# Install frontend dependencies
npm install

# Start the development server
npm run dev
```

### 3. Setup Python Environment (Optional)
```bash
# Navigate to Python integration directory
cd backend/python_integration

# Make setup script executable
chmod +x setup_python.sh

# Run setup script
./setup_python.sh

# Activate virtual environment
source crowd_analysis_env/bin/activate

# Start crowd analysis
python3 crowd_analysis.py
```

### 4. Access the Application
- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Admin Dashboard**: http://localhost:5000/admin/dashboard

## 📱 Usage Guide

### Dashboard Overview
1. **System Status**: Monitor overall system health
2. **Live Events**: View real-time security alerts
3. **Crowd Analytics**: Current people count and density
4. **Camera Network**: Status of all connected cameras

### Live Camera Feed
1. Click "Start Camera" to begin webcam feed
2. View real-time people counting overlay
3. Monitor crowd density levels
4. Record footage for later analysis

### Analytics
1. **Event Distribution**: View security events by severity
2. **Crowd Trends**: Analyze peak hours and patterns
3. **Historical Data**: Track long-term trends
4. **Zone Analysis**: Monitor specific areas

### Crowd Analysis
1. **Real-time Counting**: Live people detection
2. **Density Heatmaps**: Visual representation of crowd distribution
3. **Peak Hours**: Automatic detection of busy periods
4. **Alerts**: Notifications for overcrowding

## 🔧 Configuration

### Camera Settings
```javascript
// Modify in src/App.tsx
const cameraConfig = {
  width: 1280,
  height: 720,
  fps: 30
};
```

### Alert Thresholds
```python
# Modify in backend/python_integration/crowd_analysis.py
OVERCROWDING_THRESHOLD = 20
DENSITY_CRITICAL = 2.0
DENSITY_HIGH = 1.5
```

### Backend Configuration
```javascript
// Modify in backend/server.js
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cctv_surveillance';
```

## 🎯 Perfect for Academic Projects

This system is ideal for CSE final year projects because it demonstrates:

### Technical Skills
- **Full-Stack Development**: React, Node.js, MongoDB
- **Real-time Communication**: Socket.IO implementation
- **Computer Vision**: OpenCV and YOLO integration
- **Machine Learning**: AI-powered detection algorithms
- **API Development**: RESTful services and real-time APIs

### Modern Technologies
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Modern UI design
- **Python Integration**: Cross-language communication
- **Database Design**: MongoDB schema design
- **Real-time Systems**: Live data streaming

### Practical Applications
- **Security Systems**: Real-world surveillance applications
- **Crowd Management**: Public safety and event management
- **Smart Cities**: IoT and smart infrastructure
- **Business Analytics**: Retail and facility management

## 📊 Demo Features

### Simulated Data
The system includes realistic simulated data for demonstration:
- **Security Events**: Various types of security alerts
- **Crowd Data**: Realistic people counting simulation
- **Camera Status**: Multiple camera feed simulation
- **Analytics**: Historical trend simulation

### Live Camera Integration
- **Webcam Support**: Use laptop camera for live demo
- **Real-time Processing**: Actual computer vision processing
- **Interactive Interface**: Full-featured control panel
- **Recording Capabilities**: Save demonstration footage

## 🛠️ Development

### Project Structure
```
├── src/                    # React frontend
│   ├── App.tsx            # Main application component
│   ├── components/        # Reusable components
│   └── styles/           # CSS and styling
├── backend/              # Node.js backend
│   ├── server.js         # Main server file
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   ├── ml_module/        # ML detection simulation
│   └── python_integration/ # Python CV integration
└── docs/                 # Documentation
```

### Adding New Features
1. **New Alert Types**: Modify `SUSPICIOUS_ACTIVITIES` in `detection.js`
2. **Camera Sources**: Add new camera configurations
3. **Analytics**: Extend analytics endpoints in `api.js`
4. **UI Components**: Add new React components

### Database Schema
```javascript
// Event Schema
{
  action: String,           // Type of event
  timestamp: Date,          // When it occurred
  camera_id: String,        // Which camera detected it
  location: String,         // Physical location
  severity: String,         // Low/Medium/High/Critical
  confidence: Number,       // AI confidence score
  crowd_count: Number,      // People count (if applicable)
  density_level: String,    // Crowd density level
  metadata: Object          // Additional data
}
```

## 🎓 Academic Benefits

### Learning Outcomes
- **System Architecture**: Design scalable web applications
- **Real-time Systems**: Implement live data streaming
- **Computer Vision**: Apply AI/ML to practical problems
- **Database Design**: Structure and optimize data storage
- **API Development**: Create robust backend services
- **UI/UX Design**: Build modern, responsive interfaces

### Project Presentation
- **Live Demonstration**: Show real camera integration
- **Technical Deep-dive**: Explain architecture and algorithms
- **Practical Applications**: Discuss real-world use cases
- **Future Enhancements**: Propose additional features

## 🔮 Future Enhancements

### Advanced Features
- **Facial Recognition**: Identity-based access control
- **Behavior Analysis**: Advanced pattern recognition
- **Mobile App**: React Native companion app
- **Cloud Integration**: AWS/Azure deployment
- **Multi-site Support**: Manage multiple locations

### AI Improvements
- **Custom Models**: Train domain-specific models
- **Edge Computing**: On-device processing
- **Predictive Analytics**: Forecast crowd patterns
- **Anomaly Detection**: Advanced behavior analysis

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📞 Support

For questions or support, please open an issue in the GitHub repository.

---

**Perfect for CSE Final Year Projects** 🎓

This comprehensive system demonstrates modern software development practices, AI integration, and real-world problem solving - exactly what academic evaluators look for in capstone projects!