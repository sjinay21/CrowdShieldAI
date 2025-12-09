"""
Crowd Analysis Module using OpenCV and YOLO
This module interfaces with the Node.js backend to provide real-time crowd counting and analysis.
"""

import cv2
import numpy as np
import json
import sys
import time
from datetime import datetime
import requests
import threading
import queue
import argparse

# You'll need to install these packages:
# pip install opencv-python numpy requests ultralytics

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    print("Warning: ultralytics not installed. Using simulated detection.")
    YOLO_AVAILABLE = False

class CrowdAnalyzer:
    def __init__(self, model_path='yolov8n.pt', backend_url='http://localhost:5000'):
        self.backend_url = backend_url
        self.model = None
        self.frame_queue = queue.Queue(maxsize=10)
        self.results_queue = queue.Queue()
        
        # Initialize YOLO model if available
        '''if YOLO_AVAILABLE:
            try:
                self.model = YOLO(model_path)
                print(f"✅ YOLO model loaded: {model_path}")
            except Exception as e:
                print(f"❌ Failed to load YOLO model: {e}")
                self.model = None'''
        if YOLO_AVAILABLE:
            try:
                import torch.serialization
                torch.serialization.add_safe_globals([__import__('ultralytics.nn.tasks').nn.tasks.DetectionModel])
                self.model = YOLO(model_path)
                print(f"✅ YOLO model loaded with safe globals: {model_path}")
            except Exception as e:
                print(f"❌ Failed to load YOLO model: {e}")
                self.model = None

        
        # Camera settings
        self.camera_id = 0
        self.cap = None
        
        # Analysis parameters
        self.confidence_threshold = 0.5
        self.person_class_id = 0  # COCO class ID for person
        
        # Crowd analysis settings
        self.density_zones = self._create_density_zones()
        self.tracking_history = []
        
    def _create_density_zones(self):
        """Create zones for density analysis"""
        return {
            'entrance': {'x': 0, 'y': 0, 'w': 200, 'h': 150},
            'center': {'x': 200, 'y': 150, 'w': 400, 'h': 300},
            'exit': {'x': 600, 'y': 0, 'w': 200, 'h': 150}
        }
    
    def initialize_camera(self, camera_id=0):
        """Initialize camera capture"""
        try:
            self.cap = cv2.VideoCapture(camera_id)
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            
            if not self.cap.isOpened():
                raise Exception("Cannot open camera")
                
            print(f"✅ Camera {camera_id} initialized")
            return True
        except Exception as e:
            print(f"❌ Camera initialization failed: {e}")
            return False
    
    def detect_people(self, frame):
        """Detect people in frame using YOLO or simulation"""
        if self.model and YOLO_AVAILABLE:
            return self._yolo_detection(frame)
        else:
            return self._simulate_detection(frame)
    
    def _yolo_detection(self, frame):
        """Real YOLO detection"""
        try:
            results = self.model(frame, conf=self.confidence_threshold)
            detections = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Check if detection is a person
                        if int(box.cls) == self.person_class_id:
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            confidence = float(box.conf)
                            
                            detections.append({
                                'bbox': [int(x1), int(y1), int(x2-x1), int(y2-y1)],
                                'confidence': confidence,
                                'center': [int((x1+x2)/2), int((y1+y2)/2)]
                            })
            
            return detections
        except Exception as e:
            print(f"YOLO detection error: {e}")
            return self._simulate_detection(frame)
    
    def _simulate_detection(self, frame):
        """Simulate person detection for demo purposes"""
        h, w = frame.shape[:2]
        num_people = np.random.randint(1, 15)
        detections = []
        
        for _ in range(num_people):
            x = np.random.randint(0, w-100)
            y = np.random.randint(0, h-150)
            w_box = np.random.randint(50, 100)
            h_box = np.random.randint(100, 150)
            
            detections.append({
                'bbox': [x, y, w_box, h_box],
                'confidence': np.random.uniform(0.6, 0.95),
                'center': [x + w_box//2, y + h_box//2]
            })
        
        return detections
    
    def analyze_crowd_density(self, detections, frame_shape):
        """Analyze crowd density in different zones"""
        h, w = frame_shape[:2]
        zone_counts = {}
        
        for zone_name, zone in self.density_zones.items():
            count = 0
            for detection in detections:
                center_x, center_y = detection['center']
                if (zone['x'] <= center_x <= zone['x'] + zone['w'] and
                    zone['y'] <= center_y <= zone['y'] + zone['h']):
                    count += 1
            zone_counts[zone_name] = count
        
        total_people = len(detections)
        area_sqm = (w * h) / 10000  # Approximate area in square meters
        density = total_people / area_sqm if area_sqm > 0 else 0
        
        # Classify density level
        if density > 2.0:
            density_level = 'critical'
        elif density > 1.5:
            density_level = 'high'
        elif density > 0.8:
            density_level = 'medium'
        else:
            density_level = 'low'
        
        return {
            'total_count': total_people,
            'density_per_sqm': density,
            'density_level': density_level,
            'zone_counts': zone_counts,
            'frame_dimensions': {'width': w, 'height': h}
        }
    
    def detect_crowd_events(self, analysis_data):
        """Detect crowd-related events"""
        events = []
        total_count = analysis_data['total_count']
        density_level = analysis_data['density_level']
        
        # Overcrowding detection
        if total_count > 20:
            events.append({
                'action': 'overcrowding_detected',
                'severity': 'high' if total_count > 30 else 'medium',
                'description': f'High crowd density detected: {total_count} people',
                'crowd_count': total_count,
                'density_level': density_level
            })
        
        # Crowd gathering detection
        zone_counts = analysis_data['zone_counts']
        max_zone_count = max(zone_counts.values()) if zone_counts else 0
        if max_zone_count > 8:
            events.append({
                'action': 'crowd_gathering',
                'severity': 'medium',
                'description': f'Crowd gathering detected in zone',
                'crowd_count': total_count,
                'density_level': density_level
            })
        
        return events
    
    def send_to_backend(self, data):
        """Send analysis data to Node.js backend"""
        try:
            response = requests.post(
                f"{self.backend_url}/api/crowd-analysis",
                json=data,
                timeout=5
            )
            if response.status_code == 200:
                print(f"✅ Data sent to backend: {data['total_count']} people")
            else:
                print(f"⚠️ Backend response: {response.status_code}")
        except Exception as e:
            print(f"❌ Failed to send data to backend: {e}")
    
    def draw_annotations(self, frame, detections, analysis_data):
        """Draw bounding boxes and crowd information on frame"""
        # Draw person detections
        for detection in detections:
            x, y, w, h = detection['bbox']
            confidence = detection['confidence']
            
            # Draw bounding box
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            
            # Draw confidence
            cv2.putText(frame, f'{confidence:.2f}', 
                       (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        # Draw density zones
        for zone_name, zone in self.density_zones.items():
            cv2.rectangle(frame, 
                         (zone['x'], zone['y']), 
                         (zone['x']+zone['w'], zone['y']+zone['h']), 
                         (255, 0, 0), 2)
            cv2.putText(frame, zone_name, 
                       (zone['x'], zone['y']-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
        
        # Draw crowd statistics
        stats_text = [
            f"People Count: {analysis_data['total_count']}",
            f"Density: {analysis_data['density_level']}",
            f"Density/sqm: {analysis_data['density_per_sqm']:.2f}"
        ]
        
        for i, text in enumerate(stats_text):
            cv2.putText(frame, text, (10, 30 + i*25), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        return frame
    
    def run_analysis(self, show_video=True, save_video=False):
        """Main analysis loop"""
        if not self.initialize_camera():
            return
        
        print("🚀 Starting crowd analysis...")
        print("Press 'q' to quit, 's' to save screenshot")
        
        # Video writer setup
        fourcc = cv2.VideoWriter_fourcc(*'XVID') if save_video else None
        out = None
        
        frame_count = 0
        start_time = time.time()
        
        try:
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    print("Failed to read frame")
                    break
                
                frame_count += 1
                
                # Perform detection every few frames to improve performance
                if frame_count % 3 == 0:
                    detections = self.detect_people(frame)
                    analysis_data = self.analyze_crowd_density(detections, frame.shape)
                    
                    # Detect crowd events
                    events = self.detect_crowd_events(analysis_data)
                    
                    # Send data to backend
                    backend_data = {
                        'timestamp': datetime.now().isoformat(),
                        'camera_id': 'CAM001',
                        'location': 'Main Entrance',
                        'analysis': analysis_data,
                        'events': events
                    }
                    self.send_to_backend(backend_data)
                    
                    # Draw annotations
                    if show_video:
                        frame = self.draw_annotations(frame, detections, analysis_data)
                
                # Display frame
                if show_video:
                    cv2.imshow('Crowd Analysis', frame)
                
                # Save video
                if save_video:
                    if out is None:
                        h, w = frame.shape[:2]
                        out = cv2.VideoWriter('crowd_analysis.avi', fourcc, 20.0, (w, h))
                    out.write(frame)
                
                # Handle key presses
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break
                elif key == ord('s'):
                    cv2.imwrite(f'screenshot_{int(time.time())}.jpg', frame)
                    print("Screenshot saved")
                
                # Print FPS every 30 frames
                if frame_count % 30 == 0:
                    elapsed = time.time() - start_time
                    fps = frame_count / elapsed
                    print(f"FPS: {fps:.2f}")
        
        except KeyboardInterrupt:
            print("\n🛑 Analysis stopped by user")
        
        finally:
            # Cleanup
            if self.cap:
                self.cap.release()
            if out:
                out.release()
            cv2.destroyAllWindows()
            print("✅ Cleanup completed")

def main():
    parser = argparse.ArgumentParser(description='CCTV Crowd Analysis System')
    parser.add_argument('--camera', type=int, default=0, help='Camera ID (default: 0)')
    parser.add_argument('--model', type=str, default='yolov8n.pt', help='YOLO model path')
    parser.add_argument('--backend', type=str, default='http://localhost:5000', help='Backend URL')
    parser.add_argument('--no-display', action='store_true', help='Run without video display')
    parser.add_argument('--save-video', action='store_true', help='Save analysis video')
    
    args = parser.parse_args()
    
    # Create analyzer
    analyzer = CrowdAnalyzer(
        model_path=args.model,
        backend_url=args.backend
    )
    
    # Run analysis
    analyzer.run_analysis(
        show_video=not args.no_display,
        save_video=args.save_video
    )

if __name__ == "__main__":
    main()
