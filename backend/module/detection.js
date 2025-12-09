// Simulated ML Detection Module with Crowd Analysis
// In production, this would interface with Python OpenCV + YOLOv8

const CAMERAS = [
  { id: 'CAM001', location: 'Main Entrance', type: 'entrance' },
  { id: 'CAM002', location: 'Parking Lot', type: 'outdoor' },
  { id: 'CAM003', location: 'Warehouse Floor', type: 'indoor' },
  { id: 'CAM004', location: 'Server Room', type: 'restricted' },
  { id: 'CAM005', location: 'Emergency Exit', type: 'exit' }
];

const SUSPICIOUS_ACTIVITIES = [
  {
    action: 'suspicious_loitering',
    description: 'Person detected loitering in restricted area',
    severity: 'medium',
    probability: 0.3
  },
  {
    action: 'abandoned_object',
    description: 'Unattended object detected for extended period',
    severity: 'high',
    probability: 0.15
  },
  {
    action: 'intrusion_detected',
    description: 'Unauthorized access attempt detected',
    severity: 'critical',
    probability: 0.1
  },
  {
    action: 'crowd_gathering',
    description: 'Unusual crowd formation detected',
    severity: 'medium',
    probability: 0.2
  },
  {
    action: 'unauthorized_access',
    description: 'Access to restricted area without authorization',
    severity: 'high',
    probability: 0.12
  },
  {
    action: 'weapon_detected',
    description: 'Potential weapon detected in camera feed',
    severity: 'critical',
    probability: 0.05
  },
  {
    action: 'overcrowding_detected',
    description: 'Crowd density exceeds safe limits',
    severity: 'high',
    probability: 0.18
  },
  {
    action: 'crowd_dispersal',
    description: 'Rapid crowd movement detected',
    severity: 'medium',
    probability: 0.25
  }
];

let detectionInterval;
let crowdInterval;
let eventCounter = 0;

function generateRandomEvent() {
  const camera = CAMERAS[Math.floor(Math.random() * CAMERAS.length)];
  const activity = SUSPICIOUS_ACTIVITIES[Math.floor(Math.random() * SUSPICIOUS_ACTIVITIES.length)];
  
  // Add crowd-related data for crowd events
  const crowdCount = activity.action.includes('crowd') ? Math.floor(Math.random() * 50) + 10 : undefined;
  const densityLevel = crowdCount ? 
    (crowdCount > 35 ? 'critical' : crowdCount > 25 ? 'high' : crowdCount > 15 ? 'medium' : 'low') : 
    undefined;
  
  return {
    action: activity.action,
    camera_id: camera.id,
    location: camera.location,
    severity: activity.severity,
    confidence: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
    description: activity.description,
    timestamp: new Date(),
    crowd_count: crowdCount,
    density_level: densityLevel,
    metadata: {
      detection_model: 'YOLOv8',
      processing_time: Math.random() * 200 + 50,
      camera_type: camera.type,
      event_id: `EVT_${Date.now()}_${++eventCounter}`,
      crowd_analysis: crowdCount ? {
        people_count: crowdCount,
        density_map: generateDensityMap(),
        movement_vectors: generateMovementVectors()
      } : undefined
    }
  };
}

function generateCrowdData() {
  const camera = CAMERAS[Math.floor(Math.random() * CAMERAS.length)];
  const count = Math.floor(Math.random() * 50) + 1;
  
  let density = 'low';
  if (count > 30) density = 'critical';
  else if (count > 20) density = 'high';
  else if (count > 10) density = 'medium';

  return {
    timestamp: new Date().toISOString(),
    count,
    density,
    camera_id: camera.id,
    location: camera.location,
    metadata: {
      detection_model: 'YOLOv8-crowd',
      processing_time: Math.random() * 100 + 30,
      confidence: Math.random() * 0.3 + 0.7,
      heatmap_data: generateDensityMap()
    }
  };
}

function generateDensityMap() {
  // Simulate density heatmap data
  const map = [];
  for (let i = 0; i < 10; i++) {
    const row = [];
    for (let j = 0; j < 10; j++) {
      row.push(Math.random());
    }
    map.push(row);
  }
  return map;
}

function generateMovementVectors() {
  // Simulate movement direction vectors
  return Array.from({ length: 5 }, () => ({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    magnitude: Math.random()
  }));
}

async function processDetection(io) {
  try {
    // Simulate ML processing delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const event = generateRandomEvent();
    
    // Try to save to database with error handling
    try {
      const Event = (await import('../models/Event.js')).default;
      const savedEvent = await Event.create(event);
      
      // Emit real-time event
      io.emit('new_event', savedEvent);
      
      console.log(`🚨 Detection: ${event.action} at ${event.location} (${event.severity})`);
      if (event.crowd_count) {
        console.log(`👥 Crowd Count: ${event.crowd_count} people (${event.density_level} density)`);
      }
      
      return savedEvent;
    } catch (dbError) {
      console.warn('Database unavailable, emitting event without saving:', dbError.message);
      
      // Still emit the event even if database save fails
      io.emit('new_event', event);
      
      console.log(`🚨 Detection (no DB): ${event.action} at ${event.location} (${event.severity})`);
      if (event.crowd_count) {
        console.log(`👥 Crowd Count: ${event.crowd_count} people (${event.density_level} density)`);
      }
      
      return event;
    }
  } catch (error) {
    console.error('Detection processing error:', error);
  }
}

async function processCrowdAnalysis(io) {
  try {
    const crowdData = generateCrowdData();
    
    // Emit crowd update
    io.emit('crowd_update', crowdData);
    
    console.log(`👥 Crowd Analysis: ${crowdData.count} people at ${crowdData.location} (${crowdData.density})`);
    
    return crowdData;
  } catch (error) {
    console.error('Crowd analysis error:', error);
  }
}

export function startDetectionSimulation(io) {
  console.log('🔍 Starting ML detection simulation...');
  console.log('👥 Starting crowd analysis simulation...');
  
  // Generate security events at random intervals (10-45 seconds)
  const scheduleNextEvent = () => {
    const delay = Math.random() * 35000 + 10000; // 10-45 seconds
    setTimeout(async () => {
      await processDetection(io);
      scheduleNextEvent();
    }, delay);
  };
  
  // Generate crowd analysis updates more frequently (3-8 seconds)
  const scheduleNextCrowd = () => {
    const delay = Math.random() * 5000 + 3000; // 3-8 seconds
    setTimeout(async () => {
      await processCrowdAnalysis(io);
      scheduleNextCrowd();
    }, delay);
  };
  
  scheduleNextEvent();
  scheduleNextCrowd();
}

export function stopDetectionSimulation() {
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }
  if (crowdInterval) {
    clearInterval(crowdInterval);
    crowdInterval = null;
  }
  console.log('🛑 Detection and crowd analysis simulation stopped');
}

// Simulate camera feed status with crowd counts
export function getCameraStatus() {
  return CAMERAS.map(camera => ({
    ...camera,
    status: Math.random() > 0.1 ? 'online' : 'offline',
    last_activity: new Date(Date.now() - Math.random() * 300000), // Last 5 minutes
    fps: Math.floor(Math.random() * 10) + 25, // 25-35 FPS
    quality: Math.random() > 0.2 ? 'HD' : 'SD',
    crowd_count: Math.floor(Math.random() * 30) + 1,
    density_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
  }));
}

// Simulate real-time crowd counting (this would interface with Python OpenCV)
export function simulateCrowdCounting(videoFrame) {
  // In production, this would:
  // 1. Send video frame to Python OpenCV service
  // 2. Run YOLO person detection
  // 3. Apply crowd counting algorithms
  // 4. Calculate density heatmaps
  // 5. Detect crowd behavior patterns
  
  return {
    people_count: Math.floor(Math.random() * 25) + 1,
    density_map: generateDensityMap(),
    movement_analysis: {
      average_speed: Math.random() * 2,
      dominant_direction: Math.random() * 360,
      congestion_points: [
        { x: Math.random(), y: Math.random(), intensity: Math.random() }
      ]
    },
    behavioral_analysis: {
      loitering_detected: Math.random() > 0.8,
      queue_formation: Math.random() > 0.7,
      unusual_gathering: Math.random() > 0.9
    }
  };
}