import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Shield, AlertTriangle, Activity, Clock, MapPin, Users, Eye, 
  TrendingUp, BarChart3, Video, Settings, Bell, Download, Play, Pause,
  Maximize2, Volume2, VolumeX, RefreshCw
} from 'lucide-react';
import { io } from 'socket.io-client';

interface Event {
  _id: string;
  action: string;
  timestamp: string;
  camera_id: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  crowd_count?: number;
  density_level?: 'low' | 'medium' | 'high' | 'critical';
}

interface Analytics {
  totalEvents: number;
  severityBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  recentEvents: Event[];
  crowdAnalytics: {
    currentCount: number;
    peakHour: string;
    averageDaily: number;
    densityTrend: string;
  };
}

interface CrowdData {
  timestamp: string;
  count: number;
  density: 'low' | 'medium' | 'high' | 'critical';
  camera_id: string;
  location: string;
}

const SEVERITY_COLORS = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
};

const SEVERITY_TEXT_COLORS = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-green-400'
};

const DENSITY_COLORS = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
};

// Determine the backend URL based on current protocol
const getBackendUrl = () => {
  const protocol = window.location.protocol;
  return `${protocol}//localhost:5000`;
};

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [crowdData, setCrowdData] = useState<CrowdData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'live' | 'analytics' | 'crowd'>('dashboard');
  const [isRecording, setIsRecording] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const backendUrl = getBackendUrl();
    
    // Initialize socket connection
    const socket = io(backendUrl);
    
    // Listen for new events
    socket.on('new_event', (event: Event) => {
      setEvents(prev => [event, ...prev.slice(0, 9)]);
      fetchAnalytics();
      
      // Play alert sound for critical events
      if (event.severity === 'critical' && soundEnabled) {
        playAlertSound();
      }
    });

    // Listen for crowd data updates
    socket.on('crowd_update', (data: CrowdData) => {
      setCrowdData(prev => [data, ...prev.slice(0, 99)]);
    });

    // Fetch initial data
    fetchEvents();
    fetchAnalytics();
    fetchCrowdData();

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      socket.disconnect();
      clearInterval(timeInterval);
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [soundEnabled]);

  const fetchEvents = async () => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/events?limit=10`);
      const data = await response.json();
      setEvents(data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/analytics`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchCrowdData = async () => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/crowd-data`);
      const data = await response.json();
      setCrowdData(data);
    } catch (error) {
      console.error('Error fetching crowd data:', error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: false 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real implementation, this would start/stop video recording
  };

  const playAlertSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const formatEventAction = (action: string) => {
    return action.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const getCurrentCrowdCount = () => {
    return crowdData.length > 0 ? crowdData[0].count : 0;
  };

  const getPeakHours = () => {
    const hourCounts: Record<number, number> = {};
    crowdData.forEach(data => {
      const hour = new Date(data.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + data.count;
    });
    
    const peakHour = Object.entries(hourCounts).reduce((a, b) => 
      hourCounts[parseInt(a[0])] > hourCounts[parseInt(b[0])] ? a : b
    );
    
    return peakHour ? `${peakHour[0]}:00` : 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading surveillance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="mb-4 lg:mb-0">
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="h-8 w-8 text-blue-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Smart CCTV Surveillance
              </h1>
            </div>
            <p className="text-slate-300 text-lg">AI-Powered Crowd Analysis & Security Monitoring</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">System Online</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="text-sm">{currentTime.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/20">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'live', label: 'Live Feed', icon: Video },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'crowd', label: 'Crowd Analysis', icon: Users }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-500 text-white' 
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Analytics Dashboard */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-sm mb-1">Total Events</p>
                      <p className="text-3xl font-bold text-blue-400">{analytics.totalEvents}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Activity className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-sm mb-1">Current Crowd</p>
                      <p className="text-3xl font-bold text-purple-400">{getCurrentCrowdCount()}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-sm mb-1">Peak Hour</p>
                      <p className="text-3xl font-bold text-amber-400">{getPeakHours()}</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-amber-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-sm mb-1">Cameras Online</p>
                      <p className="text-3xl font-bold text-green-400">5</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Camera className="h-6 w-6 text-green-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Events Feed */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Live Security Events</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={fetchEvents}
                    className="p-2 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 text-blue-400" />
                  </button>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-300">Live Updates</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent events detected</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div
                      key={event._id}
                      className={`bg-white/5 rounded-lg p-4 border-l-4 ${
                        event.severity === 'critical' ? 'border-red-500' :
                        event.severity === 'high' ? 'border-orange-500' :
                        event.severity === 'medium' ? 'border-yellow-500' : 'border-green-500'
                      } hover:bg-white/10 transition-all duration-200`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {formatEventAction(event.action)}
                          </h3>
                          <p className="text-slate-300 text-sm mb-2">{event.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-slate-400">
                            <div className="flex items-center space-x-1">
                              <Camera className="h-4 w-4" />
                              <span>{event.camera_id}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{timeAgo(event.timestamp)}</span>
                            </div>
                            {event.crowd_count && (
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{event.crowd_count} people</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            SEVERITY_COLORS[event.severity]
                          }/20 ${SEVERITY_TEXT_COLORS[event.severity]}`}>
                            {event.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500">
                            {Math.round(event.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Live Feed Tab */}
        {activeTab === 'live' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Camera Feed */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Live Camera Feed</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={cameraStream ? stopCamera : startCamera}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        cameraStream 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {cameraStream ? 'Stop Camera' : 'Start Camera'}
                    </button>
                    <button
                      onClick={toggleRecording}
                      className={`p-2 rounded-lg transition-colors ${
                        isRecording 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {isRecording ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                    <button className="p-2 bg-gray-500/20 rounded-lg hover:bg-gray-500/30 transition-colors">
                      <Maximize2 className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>
                </div>
                
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  />
                  
                  {/* Overlay Information */}
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">CAM001 - Main Entrance</p>
                  </div>
                  
                  {/* Crowd Count Overlay */}
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span className="text-lg font-bold">{getCurrentCrowdCount()}</span>
                    </div>
                    <p className="text-xs text-slate-300">People Detected</p>
                  </div>
                  
                  {!cameraStream && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                      <div className="text-center">
                        <Camera className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">Click "Start Camera" to begin live feed</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Camera Controls & Info */}
            <div className="space-y-6">
              {/* Camera Status */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold mb-4">Camera Network</h3>
                <div className="space-y-3">
                  {[
                    { id: 'CAM001', location: 'Main Entrance', status: 'online', count: 12 },
                    { id: 'CAM002', location: 'Parking Lot', status: 'online', count: 8 },
                    { id: 'CAM003', location: 'Warehouse Floor', status: 'online', count: 25 },
                    { id: 'CAM004', location: 'Server Room', status: 'offline', count: 0 },
                    { id: 'CAM005', location: 'Emergency Exit', status: 'online', count: 3 }
                  ].map((camera) => (
                    <div key={camera.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          camera.status === 'online' ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                        <div>
                          <p className="font-semibold text-sm">{camera.id}</p>
                          <p className="text-xs text-slate-400">{camera.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{camera.count}</p>
                        <p className="text-xs text-slate-400">people</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center space-x-3 p-3 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-colors">
                    <Download className="h-5 w-5 text-blue-400" />
                    <span>Export Recording</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 p-3 bg-amber-500/20 rounded-lg hover:bg-amber-500/30 transition-colors">
                    <Bell className="h-5 w-5 text-amber-400" />
                    <span>Set Alert Zone</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 p-3 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition-colors">
                    <Settings className="h-5 w-5 text-purple-400" />
                    <span>Camera Settings</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Analytics */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4">Event Distribution</h3>
              <div className="space-y-4">
                {analytics && Object.entries(analytics.severityBreakdown).map(([severity, count]) => (
                  <div key={severity} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS]}`} />
                      <span className="capitalize">{severity}</span>
                    </div>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Crowd Trends */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4">Crowd Density Trends</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Current Density</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">Low</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Peak Hour Today</span>
                  <span className="font-bold">{getPeakHours()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Daily Count</span>
                  <span className="font-bold">156</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Busiest Location</span>
                  <span className="font-bold">Warehouse Floor</span>
                </div>
              </div>
            </div>

            {/* Hourly Distribution */}
            <div className="lg:col-span-2 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4">24-Hour Activity Pattern</h3>
              <div className="grid grid-cols-12 gap-2 h-32">
                {Array.from({ length: 24 }, (_, i) => {
                  const height = Math.random() * 100;
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div className="flex-1 flex items-end">
                        <div 
                          className="w-full bg-blue-500/50 rounded-t"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 mt-1">{i.toString().padStart(2, '0')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Crowd Analysis Tab */}
        {activeTab === 'crowd' && (
          <div className="space-y-6">
            {/* Real-time Crowd Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm mb-1">Total People</p>
                    <p className="text-3xl font-bold text-blue-400">{getCurrentCrowdCount()}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm mb-1">Density Level</p>
                    <p className="text-3xl font-bold text-green-400">Low</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-400" />
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm mb-1">Peak Time</p>
                    <p className="text-3xl font-bold text-amber-400">{getPeakHours()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-amber-400" />
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm mb-1">Avg. Daily</p>
                    <p className="text-3xl font-bold text-purple-400">156</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Crowd Heatmap */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4">Location Density Heatmap</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { location: 'Main Entrance', density: 'high', count: 25 },
                  { location: 'Parking Lot', density: 'medium', count: 15 },
                  { location: 'Warehouse Floor', density: 'critical', count: 45 },
                  { location: 'Server Room', density: 'low', count: 2 },
                  { location: 'Emergency Exit', density: 'low', count: 5 },
                  { location: 'Break Room', density: 'medium', count: 18 }
                ].map((area) => (
                  <div key={area.location} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{area.location}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        DENSITY_COLORS[area.density as keyof typeof DENSITY_COLORS]
                      }/20 ${
                        area.density === 'critical' ? 'text-red-400' :
                        area.density === 'high' ? 'text-orange-400' :
                        area.density === 'medium' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {area.density.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-2xl font-bold">{area.count}</p>
                    <p className="text-xs text-slate-400">people detected</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Crowd Events */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4">Recent Crowd Events</h3>
              <div className="space-y-3">
                {crowdData.slice(0, 5).map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        data.density === 'critical' ? 'bg-red-400' :
                        data.density === 'high' ? 'bg-orange-400' :
                        data.density === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                      }`} />
                      <div>
                        <p className="font-semibold">{data.location}</p>
                        <p className="text-xs text-slate-400">{data.camera_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{data.count} people</p>
                      <p className="text-xs text-slate-400">{timeAgo(data.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;