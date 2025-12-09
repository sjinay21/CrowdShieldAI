import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'suspicious_loitering', 
      'abandoned_object', 
      'intrusion_detected', 
      'crowd_gathering', 
      'unauthorized_access', 
      'weapon_detected',
      'overcrowding_detected',
      'crowd_dispersal'
    ]
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  camera_id: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'investigating', 'resolved', 'false_positive'],
    default: 'active'
  },
  image_url: {
    type: String,
    default: null
  },
  // Crowd analysis specific fields
  crowd_count: {
    type: Number,
    min: 0,
    default: null
  },
  density_level: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient querying
eventSchema.index({ timestamp: -1 });
eventSchema.index({ camera_id: 1, timestamp: -1 });
eventSchema.index({ severity: 1, status: 1 });
eventSchema.index({ crowd_count: 1 });
eventSchema.index({ density_level: 1 });

export default mongoose.model('Event', eventSchema);
