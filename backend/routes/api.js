import express from 'express';

const router = express.Router();

// Simulated crowd data for demonstration
let crowdData = [];

// Generate simulated crowd data
function generateCrowdData() {
  const locations = [
    { camera_id: 'CAM001', location: 'Main Entrance' },
    { camera_id: 'CAM002', location: 'Parking Lot' },
    { camera_id: 'CAM003', location: 'Warehouse Floor' },
    { camera_id: 'CAM004', location: 'Server Room' },
    { camera_id: 'CAM005', location: 'Emergency Exit' }
  ];

  const location = locations[Math.floor(Math.random() * locations.length)];
  const count = Math.floor(Math.random() * 50) + 1;
  
  let density = 'low';
  if (count > 30) density = 'critical';
  else if (count > 20) density = 'high';
  else if (count > 10) density = 'medium';

  return {
    timestamp: new Date().toISOString(),
    count,
    density,
    camera_id: location.camera_id,
    location: location.location
  };
}

// Generate initial crowd data
setInterval(() => {
  const newData = generateCrowdData();
  crowdData.unshift(newData);
  if (crowdData.length > 100) {
    crowdData = crowdData.slice(0, 100);
  }
}, 5000);

// Get all events with filtering and pagination
router.get('/events', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      camera_id, 
      severity, 
      status,
      start_date,
      end_date 
    } = req.query;

    let events = [];
    let total = 0;

    try {
      const Event = (await import('../models/Event.js')).default;
      
      const query = {};
      
      if (camera_id) query.camera_id = camera_id;
      if (severity) query.severity = severity;
      if (status) query.status = status;
      
      if (start_date || end_date) {
        query.timestamp = {};
        if (start_date) query.timestamp.$gte = new Date(start_date);
        if (end_date) query.timestamp.$lte = new Date(end_date);
      }

      events = await Event.find(query)
        .sort({ timestamp: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      total = await Event.countDocuments(query);
    } catch (dbError) {
      console.warn('Database unavailable, returning empty events:', dbError.message);
      // Return empty data if database is unavailable
      events = [];
      total = 0;
    }

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new event
router.post('/events', async (req, res) => {
  try {
    let event;
    
    try {
      const Event = (await import('../models/Event.js')).default;
      event = new Event(req.body);
      await event.save();
    } catch (dbError) {
      console.warn('Database unavailable for event creation:', dbError.message);
      // Return the event data even if not saved to database
      event = { ...req.body, _id: Date.now().toString() };
    }
    
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update event status
router.patch('/events/:id', async (req, res) => {
  try {
    let event;
    
    try {
      const Event = (await import('../models/Event.js')).default;
      event = await Event.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
    } catch (dbError) {
      console.warn('Database unavailable for event update:', dbError.message);
      return res.status(503).json({ error: 'Database temporarily unavailable' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get event analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '1h':
        dateFilter = { timestamp: { $gte: new Date(now - 60 * 60 * 1000) } };
        break;
      case '24h':
        dateFilter = { timestamp: { $gte: new Date(now - 24 * 60 * 60 * 1000) } };
        break;
      case '7d':
        dateFilter = { timestamp: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { timestamp: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
    }

    let analytics = {
      totalEvents: 0,
      severityBreakdown: {},
      statusBreakdown: {},
      recentEvents: [],
      crowdAnalytics: {
        currentCount: crowdData.length > 0 ? crowdData[0].count : 0,
        peakHour: '14:00',
        averageDaily: 156,
        densityTrend: 'stable'
      }
    };

    try {
      const Event = (await import('../models/Event.js')).default;
      
      const [
        totalEvents,
        severityBreakdown,
        statusBreakdown,
        recentEvents
      ] = await Promise.all([
        Event.countDocuments(dateFilter),
        Event.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]),
        Event.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Event.find(dateFilter).sort({ timestamp: -1 }).limit(5)
      ]);

      analytics = {
        totalEvents,
        severityBreakdown: severityBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentEvents,
        crowdAnalytics: {
          currentCount: crowdData.length > 0 ? crowdData[0].count : 0,
          peakHour: '14:00',
          averageDaily: 156,
          densityTrend: 'stable'
        }
      };
    } catch (dbError) {
      console.warn('Database unavailable for analytics:', dbError.message);
      // Use default analytics if database is unavailable
    }

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get crowd data
router.get('/crowd-data', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    // Return the most recent crowd data
    const recentCrowdData = crowdData.slice(0, parseInt(limit));
    
    res.json(recentCrowdData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get camera status
router.get('/cameras', async (req, res) => {
  try {
    const cameras = [
      { id: 'CAM001', location: 'Main Entrance', status: 'online', count: Math.floor(Math.random() * 20) + 5 },
      { id: 'CAM002', location: 'Parking Lot', status: 'online', count: Math.floor(Math.random() * 15) + 3 },
      { id: 'CAM003', location: 'Warehouse Floor', status: 'online', count: Math.floor(Math.random() * 30) + 10 },
      { id: 'CAM004', location: 'Server Room', status: 'offline', count: 0 },
      { id: 'CAM005', location: 'Emergency Exit', status: 'online', count: Math.floor(Math.random() * 8) + 1 }
    ];
    
    res.json(cameras);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;