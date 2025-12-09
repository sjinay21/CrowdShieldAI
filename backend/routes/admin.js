import express from 'express';

const router = express.Router();

// Admin dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Try to import Event model and handle database operations
    let recentEvents = [];
    let totalEvents = 0;
    let activeEvents = 0;
    let criticalEvents = 0;

    try {
      const Event = (await import('../models/Event.js')).default;
      recentEvents = await Event.find()
        .sort({ timestamp: -1 })
        .limit(10);

      totalEvents = await Event.countDocuments();
      activeEvents = await Event.countDocuments({ status: 'active' });
      criticalEvents = await Event.countDocuments({ severity: 'critical' });
    } catch (dbError) {
      console.warn('Database unavailable for dashboard:', dbError.message);
      // Continue with empty data if database is unavailable
    }

    res.render('dashboard', {
      title: 'CCTV Surveillance Dashboard',
      recentEvents,
      stats: {
        totalEvents,
        activeEvents,
        criticalEvents
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      error: 'Dashboard temporarily unavailable',
      message: error.message 
    });
  }
});

// Admin events list
router.get('/events', async (req, res) => {
  try {
    let events = [];

    try {
      const Event = (await import('../models/Event.js')).default;
      events = await Event.find()
        .sort({ timestamp: -1 })
        .limit(50);
    } catch (dbError) {
      console.warn('Database unavailable for events:', dbError.message);
      // Continue with empty events if database is unavailable
    }

    res.render('events', {
      title: 'Event Management',
      events
    });
  } catch (error) {
    console.error('Events error:', error);
    res.status(500).json({ 
      error: 'Events page temporarily unavailable',
      message: error.message 
    });
  }
});

export default router;