'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Shield, Video, VideoOff, Play, Pause, Upload, Settings, Activity, 
  Wifi, WifiOff, AlertTriangle, Users, Clock, Camera, 
  BarChart3, Maximize2, RefreshCw, Eye, Target, Bell, 
  Monitor, Cpu, HardDrive, Signal, CheckCircle, XCircle,
  FileVideo, Zap, TrendingUp, Database, RotateCcw, Download,
  Loader2, AlertCircle
} from 'lucide-react';

// Video Analysis Result Interface
interface VideoAnalysisResult {
  video_id: string;
  timestamp: string;
  total_detections: number;
  peak_occupancy: number;
  avg_confidence: number;
  detection_timeline: Array<{
    timestamp: number;
    frame_number: number;
    people_count: number;
    avg_confidence: number;
    detections: Array<{
      bbox: [number, number, number, number];
      confidence: number;
      center: [number, number];
    }>;
  }>;
  confidence_distribution: {
    high: number;
    medium: number;
    low: number;
  };
  processing_stats: {
    total_processing_time: number;
    frames_analyzed: number;
    sample_interval: number;
  };
  video_duration: number;
  frames_processed: number;
  feed_id: string;
}

// Detection Result from API
interface DetectionResult {
  frame_id: string;
  timestamp: string;
  people_count: number;
  detections: Array<{
    center: [number, number];
    bbox: [number, number, number, number];
    confidence: number;
    area: number;
    width: number;
    height: number;
  }>;
  confidence_threshold: number;
  processing_time_ms: number;
  model_info: {
    model: string;
    device: string;
    feed_id: string;
  };
  performance_stats: {
    processing_time_ms: number;
    detections_found: number;
  };
}

export default function EnhancedVideoAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<'live' | 'upload'>('live');
  const [feeds, setFeeds] = useState({
    feed1: { 
      isStreaming: false, 
      currentCount: 0, 
      isFullscreen: false,
      isProcessing: false,
      videoFile: null,
      analysisComplete: false,
      totalFrames: 0,
      processedFrames: 0,
      detections: [],
      analysisResult: null,
      isLiveDetection: false
    },
    feed2: { 
      isStreaming: false, 
      currentCount: 0, 
      isFullscreen: false,
      isProcessing: false,
      videoFile: null,
      analysisComplete: false,
      totalFrames: 0,
      processedFrames: 0,
      detections: [],
      analysisResult: null,
      isLiveDetection: false
    }
  });
  
  // Video Upload States
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoAnalysisResult, setVideoAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [processingError, setProcessingError] = useState<string>('');
  
  const [isConnected, setIsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [apiStatus, setApiStatus] = useState('disconnected');
  const [apiUrl, setApiUrl] = useState('');
  
  const [analytics, setAnalytics] = useState({
    totalDetections: 0,
    avgConfidence: 0,
    peakOccupancy: 0,
    detectionHistory: [],
    confidenceDistribution: { high: 0, medium: 0, low: 0 },
    processingStats: {
      avgProcessingTime: 0,
      totalFramesProcessed: 0,
      fps: 0
    }
  });
  
  const [alerts, setAlerts] = useState([]);
  
  const [config, setConfig] = useState({
    confidence: 0.08,
    maxPeople: 15,
    alertEnabled: true,
    nightVision: false,
    motionDetection: true,
    showBoundingBoxes: true,
    realTimeMode: true,
    detectionInterval: 1000 // ms between detections
  });

  // Refs for live camera feeds
  const fileInputRef1 = useRef<HTMLInputElement | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement | null>(null);
  const videoRef1 = useRef<HTMLVideoElement | null>(null);
  const videoRef2 = useRef<HTMLVideoElement | null>(null);
  const canvasRef1 = useRef<HTMLCanvasElement | null>(null);
  const canvasRef2 = useRef<HTMLCanvasElement | null>(null);
  const detectionIntervalRef1 = useRef<NodeJS.Timeout | null>(null);
  const detectionIntervalRef2 = useRef<NodeJS.Timeout | null>(null);
  const streamRef1 = useRef<MediaStream | null>(null);
  const streamRef2 = useRef<MediaStream | null>(null);

  // Refs for video upload
  const videoUploadInputRef = useRef<HTMLInputElement>(null);
  const uploadVideoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Video Upload Functions
  const handleVideoFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setProcessingError('Please select a valid video file');
      return;
    }

    // Validate file size (e.g., 500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      setProcessingError('File size too large. Please select a video under 500MB');
      return;
    }

    setUploadedFile(file);
    setProcessingError('');
    setVideoAnalysisResult(null);
    setProcessingProgress(0);

    // Create video preview
    const videoUrl = URL.createObjectURL(file);
    setVideoPreview(videoUrl);
  }, []);

  const startVideoProgressTracking = useCallback(() => {
    let progress = 0;
    const statuses = [
      'Uploading video...',
      'Extracting frames...',
      'Running AI detection...',
      'Processing detections...',
      'Generating timeline...',
      'Finalizing analysis...'
    ];
    let statusIndex = 0;

    progressIntervalRef.current = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 95) progress = 95; // Don't complete until we get real result
      
      setProcessingProgress(progress);
      
      // Update status every 20% progress
      const newStatusIndex = Math.floor(progress / 16.67);
      if (newStatusIndex !== statusIndex && newStatusIndex < statuses.length) {
        statusIndex = newStatusIndex;
        setCurrentStatus(statuses[statusIndex]);
      }
    }, 1000);
  }, []);

  const stopVideoProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const processUploadedVideo = useCallback(async () => {
    if (!uploadedFile || !isConnected) {
      setProcessingError('Please ensure you have a video file and are connected to the API');
      return;
    }

    setIsProcessingVideo(true);
    setProcessingError('');
    setProcessingProgress(0);
    setCurrentStatus('Preparing video for analysis...');
    
    startVideoProgressTracking();

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('confidence', config.confidence.toString());
      formData.append('feed_id', 'video-upload');

      const response = await fetch(`${apiUrl}/detect/video/analyze`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const result: VideoAnalysisResult = await response.json();
      
      stopVideoProgressTracking();
      setProcessingProgress(100);
      setCurrentStatus('Analysis complete!');
      setVideoAnalysisResult(result);
      setIsProcessingVideo(false);

      // Update analytics with video results
      setAnalytics(prev => ({
        ...prev,
        totalDetections: prev.totalDetections + result.total_detections,
        peakOccupancy: Math.max(prev.peakOccupancy, result.peak_occupancy),
        confidenceDistribution: {
          high: prev.confidenceDistribution.high + result.confidence_distribution.high,
          medium: prev.confidenceDistribution.medium + result.confidence_distribution.medium,
          low: prev.confidenceDistribution.low + result.confidence_distribution.low
        }
      }));

      // Add success alert
      setAlerts(prev => [{
        id: Date.now(),
        type: 'success',
        message: `Video analysis complete! Found ${result.total_detections} total detections with peak occupancy of ${result.peak_occupancy} people.`,
        time: new Date().toLocaleTimeString(),
        severity: 'low'
      }, ...prev.slice(0, 4)]);

    } catch (error) {
      console.error('Video processing error:', error);
      stopVideoProgressTracking();
      setProcessingError(error instanceof Error ? error.message : 'Video processing failed');
      setIsProcessingVideo(false);
      setProcessingProgress(0);
      setCurrentStatus('');
    }
  }, [uploadedFile, isConnected, apiUrl, config.confidence, startVideoProgressTracking, stopVideoProgressTracking]);

  const resetVideoUpload = useCallback(() => {
    setUploadedFile(null);
    setVideoPreview('');
    setVideoAnalysisResult(null);
    setProcessingProgress(0);
    setCurrentStatus('');
    setProcessingError('');
    setIsProcessingVideo(false);
    stopVideoProgressTracking();
    
    if (videoUploadInputRef.current) {
      videoUploadInputRef.current.value = '';
    }
  }, [stopVideoProgressTracking]);

  const downloadVideoResults = useCallback(() => {
    if (!videoAnalysisResult) return;
    
    const dataStr = JSON.stringify(videoAnalysisResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `video-analysis-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [videoAnalysisResult]);

  // Real-time detection function (existing code)
  const performRealTimeDetection = useCallback(async (feedId: string) => {
    if (!isConnected || !config.realTimeMode) return;
    
    const videoRef = feedId === 'feed1' ? videoRef1 : videoRef2;
    const video = videoRef.current;
    
    if (!video || video.paused || video.ended) return;
    
    try {
      // Capture current frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      });
      
      if (!blob) {
        console.error('Failed to create blob from canvas');
        return;
      }
      
      // Send to API for detection
      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');
      formData.append('confidence', config.confidence.toString());
      formData.append('feed_id', feedId);
      
      const response = await fetch(`${apiUrl}/detect/image`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result: DetectionResult = await response.json();
        
        // Update feed with real detection results
        setFeeds(prev => ({
          ...prev,
          [feedId]: {
            ...prev[feedId],
            currentCount: result.people_count || 0,
            detections: result.detections || [],
            isLiveDetection: true
          }
        }));
        
        // Draw real bounding boxes
        drawRealBoundingBoxes(feedId, result.detections || []);
        
        // Update analytics
        updateRealTimeAnalytics(result, feedId);
        
        // Check for alerts
        if (result.people_count > config.maxPeople && config.alertEnabled) {
          setAlerts(prev => [{
            id: Date.now(),
            type: 'warning',
            message: `High occupancy detected in ${feedId}: ${result.people_count} people`,
            time: new Date().toLocaleTimeString(),
            severity: 'high'
          }, ...prev.slice(0, 4)]);
        }
      }
    } catch (error) {
      console.error(`Real-time detection error for ${feedId}:`, error);
    }
  }, [isConnected, config, apiUrl]);

  // Draw real bounding boxes from API response (existing code)
  const drawRealBoundingBoxes = (feedId: string, detections: any[]) => {
    const canvasRef = feedId === 'feed1' ? canvasRef1 : canvasRef2;
    const videoRef = feedId === 'feed1' ? videoRef1 : videoRef2;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = video.offsetWidth;
    canvas.height = video.offsetHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!config.showBoundingBoxes || !detections.length) return;
    
    // Calculate scaling factors
    const scaleX = canvas.width / (video.videoWidth || canvas.width);
    const scaleY = canvas.height / (video.videoHeight || canvas.height);
    
    detections.forEach((detection, index) => {
      const { bbox, confidence } = detection;
      const [x1, y1, x2, y2] = bbox;
      
      // Scale coordinates to canvas size
      const scaledX1 = x1 * scaleX;
      const scaledY1 = y1 * scaleY;
      const scaledX2 = x2 * scaleX;
      const scaledY2 = y2 * scaleY;
      
      // Dynamic color based on confidence
      let color, thickness;
      if (confidence >= 0.7) {
        color = '#10b981'; // Green for high confidence
        thickness = 3;
      } else if (confidence >= 0.4) {
        color = '#f59e0b'; // Yellow for medium confidence
        thickness = 2;
      } else {
        color = '#ef4444'; // Red for low confidence
        thickness = 2;
      }
      
      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.strokeRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1);
      
      // Draw confidence label with background
      ctx.fillStyle = color;
      ctx.font = 'bold 14px system-ui';
      const text = `Person ${index + 1}: ${(confidence * 100).toFixed(1)}%`;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      
      // Background for text
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(scaledX1, scaledY1 - 28, textWidth + 12, 24);
      
      // Text
      ctx.fillStyle = color;
      ctx.fillText(text, scaledX1 + 6, scaledY1 - 8);
      
      // Center point
      const centerX = (scaledX1 + scaledX2) / 2;
      const centerY = (scaledY1 + scaledY2) / 2;
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw person ID
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px system-ui';
      ctx.fillText(`${index + 1}`, centerX - 4, centerY + 4);
    });
    
    // Header overlay with detection count
    if (detections.length > 0) {
      const headerText = `LIVE: ${detections.length} People Detected`;
      ctx.font = 'bold 16px system-ui';
      const headerMetrics = ctx.measureText(headerText);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(10, 10, headerMetrics.width + 20, 35);
      
      ctx.fillStyle = feedId === 'feed1' ? '#60a5fa' : '#10b981';
      ctx.fillText(headerText, 20, 32);
    }
    
    // Real-time indicator
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.fillRect(canvas.width - 80, 10, 70, 25);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px system-ui';
    ctx.fillText('● LIVE', canvas.width - 75, 27);
  };

  // Update analytics with real-time data (existing code)
  const updateRealTimeAnalytics = (result: DetectionResult, feedId: string) => {
    setAnalytics(prev => {
      const newDetections = result.people_count || 0;
      const newConfidence = result.detections.length > 0 
        ? result.detections.reduce((sum, d) => sum + d.confidence, 0) / result.detections.length 
        : 0;
      
      return {
        totalDetections: prev.totalDetections + newDetections,
        avgConfidence: newConfidence > 0 ? newConfidence : prev.avgConfidence,
        peakOccupancy: Math.max(prev.peakOccupancy, newDetections),
        detectionHistory: [...prev.detectionHistory, {
          timestamp: Date.now(),
          count: newDetections,
          feedId: feedId,
          confidence: newConfidence
        }].slice(-50), // Keep last 50 entries
        confidenceDistribution: {
          high: prev.confidenceDistribution.high + (result.detections?.filter(d => d.confidence >= 0.7).length || 0),
          medium: prev.confidenceDistribution.medium + (result.detections?.filter(d => d.confidence >= 0.4 && d.confidence < 0.7).length || 0),
          low: prev.confidenceDistribution.low + (result.detections?.filter(d => d.confidence < 0.4).length || 0)
        },
        processingStats: {
          avgProcessingTime: result.processing_time_ms || prev.processingStats.avgProcessingTime,
          totalFramesProcessed: prev.processingStats.totalFramesProcessed + 1,
          fps: result.performance_stats?.fps || prev.processingStats.fps
        }
      };
    });
  };

  // Start real-time detection (existing code)
  const startRealTimeDetection = (feedId: string) => {
    const intervalRef = feedId === 'feed1' ? detectionIntervalRef1 : detectionIntervalRef2;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      performRealTimeDetection(feedId);
    }, config.detectionInterval);
  };

  // Stop real-time detection (existing code)
  const stopRealTimeDetection = (feedId: string) => {
    const intervalRef = feedId === 'feed1' ? detectionIntervalRef1 : detectionIntervalRef2;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Clear canvas
    const canvasRef = feedId === 'feed1' ? canvasRef1 : canvasRef2;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    
    setFeeds(prev => ({
      ...prev,
      [feedId]: {
        ...prev[feedId],
        isLiveDetection: false,
        detections: []
      }
    }));
  };

  // Start camera feed (existing code)
  const startCameraFeed = async (feedId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } 
      });
      
      const videoRef = feedId === 'feed1' ? videoRef1 : videoRef2;
      const streamRef = feedId === 'feed1' ? streamRef1 : streamRef2;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        setFeeds(prev => ({
          ...prev,
          [feedId]: { ...prev[feedId], isStreaming: true }
        }));
        
        // Start real-time detection after video loads
        videoRef.current.onloadeddata = () => {
          if (config.realTimeMode) {
            startRealTimeDetection(feedId);
          }
        };
      }
    } catch (error) {
      console.error(`Camera access failed for ${feedId}:`, error);
      setAlerts(prev => [{
        id: Date.now(),
        type: 'error',
        message: `Camera access denied for ${feedId}. Please allow camera permissions.`,
        time: new Date().toLocaleTimeString(),
        severity: 'high'
      }, ...prev.slice(0, 4)]);
    }
  };

  // Stop camera feed (existing code)
  const stopCameraFeed = (feedId: string) => {
    const streamRef = feedId === 'feed1' ? streamRef1 : streamRef2;
    const videoRef = feedId === 'feed1' ? videoRef1 : videoRef2;
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    stopRealTimeDetection(feedId);
    
    setFeeds(prev => ({
      ...prev,
      [feedId]: { ...prev[feedId], isStreaming: false }
    }));
  };

  const testApiConnection = async () => {
    if (!apiUrl.trim()) {
      alert('Please enter your AI Detection API URL');
      return;
    }

    setApiStatus('connecting');
    try {
      const response = await fetch(`${apiUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        setApiStatus('connected');
        setIsConnected(true);
        console.log('API Connected:', data);
        
        setAlerts(prev => [{
          id: Date.now(),
          type: 'success',
          message: `Connected to AI Detection API (${data.detector_type || 'Unknown Model'})`,
          time: new Date().toLocaleTimeString(),
          severity: 'low'
        }, ...prev.slice(0, 4)]);
      } else {
        throw new Error('API not responding');
      }
    } catch (error) {
      setApiStatus('disconnected');
      setIsConnected(false);
      console.error('API Connection failed:', error);
      
      setAlerts(prev => [{
        id: Date.now(),
        type: 'error',
        message: 'Failed to connect to API. Check your API URL.',
        time: new Date().toLocaleTimeString(),
        severity: 'high'
      }, ...prev.slice(0, 4)]);
    }
  };

  const toggleCamera = (feedId: string) => {
    if (feeds[feedId].isStreaming) {
      stopCameraFeed(feedId);
    } else {
      startCameraFeed(feedId);
    }
  };

  const toggleRealTimeDetection = () => {
    const newRealTimeMode = !config.realTimeMode;
    setConfig(prev => ({ ...prev, realTimeMode: newRealTimeMode }));
    
    if (newRealTimeMode) {
      // Start detection for active feeds
      if (feeds.feed1.isStreaming) startRealTimeDetection('feed1');
      if (feeds.feed2.isStreaming) startRealTimeDetection('feed2');
    } else {
      // Stop detection for all feeds
      stopRealTimeDetection('feed1');
      stopRealTimeDetection('feed2');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealTimeDetection('feed1');
      stopRealTimeDetection('feed2');
      stopCameraFeed('feed1');
      stopCameraFeed('feed2');
      stopVideoProgressTracking();
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [stopVideoProgressTracking, videoPreview]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1), transparent 70%)',
        pointerEvents: 'none'
      }}></div>
      
      <div style={{ position: 'relative', zIndex: 10 }}>
        <header style={{
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    inset: '-8px',
                    background: 'linear-gradient(45deg, #3b82f6, #06b6d4)',
                    borderRadius: '16px',
                    filter: 'blur(8px)',
                    opacity: 0.3
                  }}></div>
                  <div style={{
                    position: 'relative',
                    background: '#1e293b',
                    padding: '12px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Shield style={{ width: '40px', height: '40px', color: '#60a5fa' }} />
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '16px',
                      height: '16px',
                      background: isConnected ? '#10b981' : '#ef4444',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite',
                      boxShadow: `0 0 20px ${isConnected ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
                    }}></div>
                  </div>
                </div>
                <div>
                  <h1 style={{
                    fontSize: '32px',
                    fontWeight: '900',
                    background: 'linear-gradient(45deg, #60a5fa, #06b6d4, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.025em',
                    margin: 0
                  }}>
                    AI DETECTION SYSTEM
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                    <span style={{
                      fontSize: '14px',
                      background: config.realTimeMode && activeTab === 'live' ? 'linear-gradient(45deg, #10b981, #06b6d4)' : 'linear-gradient(45deg, #6b7280, #4b5563)',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      color: 'white',
                      fontWeight: '600',
                      boxShadow: config.realTimeMode && activeTab === 'live' ? '0 4px 14px 0 rgba(16, 185, 129, 0.4)' : '0 4px 14px 0 rgba(107, 114, 128, 0.4)'
                    }}>
                      {activeTab === 'live' 
                        ? (config.realTimeMode ? '● LIVE DETECTION' : '○ DETECTION OFF')
                        : '📹 VIDEO ANALYSIS'
                      }
                    </span>
                    <span style={{
                      fontSize: '14px',
                      color: '#94a3b8',
                      fontFamily: 'monospace'
                    }}>
                      {currentTime.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Tab Switcher */}
                <div style={{
                  display: 'flex',
                  background: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '12px',
                  padding: '4px',
                  border: '1px solid rgba(148, 163, 184, 0.1)'
                }}>
                  <button
                    onClick={() => setActiveTab('live')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeTab === 'live' ? '#3b82f6' : 'transparent',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Monitor style={{ width: '16px', height: '16px' }} />
                    Live Cameras
                  </button>
                  <button
                    onClick={() => setActiveTab('upload')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeTab === 'upload' ? '#8b5cf6' : 'transparent',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <FileVideo style={{ width: '16px', height: '16px' }} />
                    Video Upload
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Enter your AI Detection API URL"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #475569',
                      background: 'rgba(30, 41, 59, 0.5)',
                      color: 'white',
                      fontSize: '14px',
                      width: '300px'
                    }}
                  />
                  <button
                    onClick={testApiConnection}
                    disabled={apiStatus === 'connecting'}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: apiStatus === 'connected' ? '#10b981' : '#3b82f6',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      opacity: apiStatus === 'connecting' ? 0.7 : 1
                    }}
                  >
                    {apiStatus === 'connecting' ? 'Connecting...' : 
                     apiStatus === 'connected' ? 'Connected' : 'Connect API'}
                  </button>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 24px',
                  borderRadius: '16px',
                  background: isConnected 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : 'rgba(239, 68, 68, 0.2)',
                  border: isConnected 
                    ? '1px solid rgba(16, 185, 129, 0.3)' 
                    : '1px solid rgba(239, 68, 68, 0.3)',
                  color: isConnected ? '#6ee7b7' : '#fca5a5'
                }}>
                  {isConnected ? <CheckCircle style={{ width: '20px', height: '20px' }} /> : <XCircle style={{ width: '20px', height: '20px' }} />}
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700' }}>
                      {isConnected ? 'API CONNECTED' : 'API OFFLINE'}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      {isConnected ? 'Ready for detection' : 'Connect for detection'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: '32px' }}>
          {activeTab === 'live' ? (
            /* Live Camera Tab Content */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Live Camera Feeds Section */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '32px',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        padding: '12px',
                        background: 'linear-gradient(45deg, #3b82f6, #06b6d4)',
                        borderRadius: '16px'
                      }}>
                        <Video style={{ width: '24px', height: '24px', color: 'white' }} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'white', margin: 0 }}>Live Camera Feeds</h2>
                        <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Real-time AI-powered person detection</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleRealTimeDetection}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: config.realTimeMode ? '#ef4444' : '#10b981',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {config.realTimeMode ? <Pause style={{ width: '16px', height: '16px' }} /> : <Play style={{ width: '16px', height: '16px' }} />}
                      {config.realTimeMode ? 'Stop Detection' : 'Start Detection'}
                    </button>
                  </div>
                </div>
                
                <div style={{ padding: '32px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: '32px' }}>
                    {/* Feed 1 */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ position: 'relative' }}>
                            <div style={{
                              padding: '8px',
                              background: 'rgba(59, 130, 246, 0.2)',
                              borderRadius: '12px',
                              border: '1px solid rgba(59, 130, 246, 0.3)'
                            }}>
                              <Camera style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
                            </div>
                            <div style={{
                              position: 'absolute',
                              top: '-4px',
                              right: '-4px',
                              width: '12px',
                              height: '12px',
                              background: feeds.feed1.isStreaming ? '#10b981' : '#6b7280',
                              borderRadius: '50%',
                              animation: feeds.feed1.isStreaming ? 'pulse 1s infinite' : 'none'
                            }}></div>
                          </div>
                          <div>
                            <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: 0 }}>Camera Feed 1</h3>
                            <span style={{
                              fontSize: '12px',
                              background: feeds.feed1.isLiveDetection ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                              color: feeds.feed1.isLiveDetection ? '#6ee7b7' : '#93c5fd',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              border: feeds.feed1.isLiveDetection ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)'
                            }}>
                              {feeds.feed1.isLiveDetection ? '● DETECTING' : feeds.feed1.isStreaming ? 'STREAMING' : 'OFFLINE'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleCamera('feed1')}
                          style={{
                            padding: '12px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            background: feeds.feed1.isStreaming ? '#ef4444' : '#10b981',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          {feeds.feed1.isStreaming ? (
                            <>
                              <VideoOff style={{ width: '16px', height: '16px' }} />
                              Stop Camera
                            </>
                          ) : (
                            <>
                              <Video style={{ width: '16px', height: '16px' }} />
                              Start Camera
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div style={{
                        position: 'relative',
                        background: 'black',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        aspectRatio: '16/9'
                      }}>
                        {/* Show uploaded video if available, otherwise camera feed */}
                        {uploadedFile && activeTab === 'live' ? (
                          <video
                            ref={uploadVideoRef}
                            src={videoPreview}
                            controls
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <>
                            <video
                              ref={videoRef1}
                              autoPlay
                              muted
                              playsInline
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <canvas
                              ref={canvasRef1}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none'
                              }}
                            />
                          </>
                        )}
                        
                        {!feeds.feed1.isStreaming && !uploadedFile && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #0f172a, #1e293b, #0f172a)'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <Camera style={{ width: '80px', height: '80px', color: '#475569', margin: '0 auto 24px' }} />
                              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#cbd5e1', margin: '0 0 8px 0' }}>Camera Feed 1</h3>
                              <p style={{ color: '#64748b', margin: 0 }}>Click "Start Camera" to begin detection</p>
                            </div>
                          </div>
                        )}
                        
                        {feeds.feed1.isStreaming && !uploadedFile && (
                          <div style={{ position: 'absolute', bottom: '24px', left: '24px' }}>
                            <div style={{
                              background: 'rgba(0, 0, 0, 0.8)',
                              backdropFilter: 'blur(8px)',
                              color: 'white',
                              padding: '16px 24px',
                              borderRadius: '16px',
                              border: '1px solid rgba(148, 163, 184, 0.1)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Users style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
                                <div>
                                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#60a5fa' }}>{feeds.feed1.currentCount}</div>
                                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>PEOPLE DETECTED</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Video analysis overlay */}
                        {uploadedFile && videoAnalysisResult && (
                          <div style={{ position: 'absolute', bottom: '24px', left: '24px' }}>
                            <div style={{
                              background: 'rgba(0, 0, 0, 0.8)',
                              backdropFilter: 'blur(8px)',
                              color: 'white',
                              padding: '16px 24px',
                              borderRadius: '16px',
                              border: '1px solid rgba(148, 163, 184, 0.1)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <FileVideo style={{ width: '20px', height: '20px', color: '#8b5cf6' }} />
                                <div>
                                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>{videoAnalysisResult.peak_occupancy}</div>
                                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>PEAK DETECTED</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Feed 2 */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ position: 'relative' }}>
                            <div style={{
                              padding: '8px',
                              background: 'rgba(16, 185, 129, 0.2)',
                              borderRadius: '12px',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              <Camera style={{ width: '20px', height: '20px', color: '#10b981' }} />
                            </div>
                            <div style={{
                              position: 'absolute',
                              top: '-4px',
                              right: '-4px',
                              width: '12px',
                              height: '12px',
                              background: feeds.feed2.isStreaming ? '#10b981' : '#6b7280',
                              borderRadius: '50%',
                              animation: feeds.feed2.isStreaming ? 'pulse 1s infinite' : 'none'
                            }}></div>
                          </div>
                          <div>
                            <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: 0 }}>Camera Feed 2</h3>
                            <span style={{
                              fontSize: '12px',
                              background: feeds.feed2.isLiveDetection ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                              color: feeds.feed2.isLiveDetection ? '#6ee7b7' : '#6ee7b7',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              {feeds.feed2.isLiveDetection ? '● DETECTING' : feeds.feed2.isStreaming ? 'STREAMING' : 'OFFLINE'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleCamera('feed2')}
                          style={{
                            padding: '12px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            background: feeds.feed2.isStreaming ? '#ef4444' : '#10b981',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          {feeds.feed2.isStreaming ? (
                            <>
                              <VideoOff style={{ width: '16px', height: '16px' }} />
                              Stop Camera
                            </>
                          ) : (
                            <>
                              <Video style={{ width: '16px', height: '16px' }} />
                              Start Camera
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div style={{
                        position: 'relative',
                        background: 'black',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        aspectRatio: '16/9'
                      }}>
                        <video
                          ref={videoRef2}
                          autoPlay
                          muted
                          playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <canvas
                          ref={canvasRef2}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none'
                          }}
                        />
                        
                        {!feeds.feed2.isStreaming && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #0f172a, #1e293b, #0f172a)'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <Camera style={{ width: '80px', height: '80px', color: '#475569', margin: '0 auto 24px' }} />
                              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#cbd5e1', margin: '0 0 8px 0' }}>Camera Feed 2</h3>
                              <p style={{ color: '#64748b', margin: 0 }}>Click "Start Camera" to begin detection</p>
                            </div>
                          </div>
                        )}
                        
                        {feeds.feed2.isStreaming && (
                          <div style={{ position: 'absolute', bottom: '24px', left: '24px' }}>
                            <div style={{
                              background: 'rgba(0, 0, 0, 0.8)',
                              backdropFilter: 'blur(8px)',
                              color: 'white',
                              padding: '16px 24px',
                              borderRadius: '16px',
                              border: '1px solid rgba(148, 163, 184, 0.1)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Users style={{ width: '20px', height: '20px', color: '#10b981' }} />
                                <div>
                                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{feeds.feed2.currentCount}</div>
                                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>PEOPLE DETECTED</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Sidebar - Upload and Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Video Upload Section */}
                      <div style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '20px',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        padding: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                          <div style={{
                            padding: '8px',
                            background: 'linear-gradient(45deg, #8b5cf6, #a855f7)',
                            borderRadius: '12px'
                          }}>
                            <FileVideo style={{ width: '20px', height: '20px', color: 'white' }} />
                          </div>
                          <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'white', margin: 0 }}>Video Upload</h3>
                            <p style={{ color: '#94a3b8', margin: '2px 0 0 0', fontSize: '12px' }}>Analyze video files</p>
                          </div>
                        </div>

                        {!uploadedFile ? (
                          <div style={{
                            border: '2px dashed #6b7280',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center'
                          }}>
                            <Upload style={{ width: '32px', height: '32px', color: '#6b7280', margin: '0 auto 12px' }} />
                            <p style={{ color: '#94a3b8', margin: '0 0 16px 0', fontSize: '12px' }}>
                              Select video for AI analysis
                            </p>
                            <button
                              onClick={() => videoUploadInputRef.current?.click()}
                              disabled={!isConnected}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: isConnected ? '#8b5cf6' : '#6b7280',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: isConnected ? 'pointer' : 'not-allowed',
                                width: '100%'
                              }}
                            >
                              Choose File
                            </button>
                            {!isConnected && (
                              <p style={{ color: '#ef4444', fontSize: '10px', margin: '8px 0 0 0' }}>
                                Connect API first
                              </p>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{
                              background: 'rgba(30, 41, 59, 0.5)',
                              borderRadius: '8px',
                              padding: '12px',
                              border: '1px solid rgba(148, 163, 184, 0.1)'
                            }}>
                              <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>File:</div>
                              <div style={{ fontSize: '11px', color: 'white', fontWeight: '600' }}>{uploadedFile.name}</div>
                              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                                {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={processUploadedVideo}
                                disabled={isProcessingVideo || !isConnected}
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: isProcessingVideo || !isConnected ? '#6b7280' : '#8b5cf6',
                                  color: 'white',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  cursor: isProcessingVideo || !isConnected ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px'
                                }}
                              >
                                {isProcessingVideo ? (
                                  <>
                                    <Loader2 style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />
                                    Analyzing
                                  </>
                                ) : (
                                  <>
                                    <Play style={{ width: '12px', height: '12px' }} />
                                    Analyze
                                  </>
                                )}
                              </button>
                              <button
                                onClick={resetVideoUpload}
                                style={{
                                  padding: '8px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: '#6b7280',
                                  color: 'white',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                <RotateCcw style={{ width: '12px', height: '12px' }} />
                              </button>
                            </div>
                          </div>
                        )}

                        <input
                          ref={videoUploadInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileSelect}
                          style={{ display: 'none' }}
                        />
                      </div>

                      {/* Processing Progress */}
                      {isProcessingVideo && (
                        <div style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          backdropFilter: 'blur(20px)',
                          borderRadius: '20px',
                          border: '1px solid rgba(148, 163, 184, 0.1)',
                          padding: '20px',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'white', margin: 0 }}>Processing</h4>
                            <span style={{ color: '#8b5cf6', fontSize: '14px', fontWeight: '700' }}>{Math.round(processingProgress)}%</span>
                          </div>
                          
                          <div style={{
                            width: '100%',
                            background: 'rgba(30, 41, 59, 0.5)',
                            borderRadius: '8px',
                            height: '6px',
                            marginBottom: '12px',
                            overflow: 'hidden'
                          }}>
                            <div 
                              style={{
                                background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                                height: '100%',
                                borderRadius: '8px',
                                transition: 'width 0.5s ease',
                                width: `${processingProgress}%`
                              }}
                            ></div>
                          </div>
                          
                          {currentStatus && (
                            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                              {currentStatus}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Error Display */}
                      {processingError && (
                        <div style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '12px',
                          padding: '16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <AlertCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                            <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '12px' }}>Error</span>
                          </div>
                          <p style={{ color: '#fca5a5', margin: 0, fontSize: '11px' }}>{processingError}</p>
                        </div>
                      )}

                      {/* Quick Stats */}
                      <div style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '20px',
                        border: '1px solid rgba(148, 163, 184, 0.1)',
                        padding: '20px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                      }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'white', margin: '0 0 16px 0' }}>Quick Stats</h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            borderRadius: '8px',
                            padding: '12px',
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                          }}>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#60a5fa', marginBottom: '4px' }}>
                              {feeds.feed1.currentCount + feeds.feed2.currentCount}
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>CURRENT TOTAL</div>
                          </div>
                          
                          <div style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            borderRadius: '8px',
                            padding: '12px',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                          }}>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>
                              {analytics.peakOccupancy}
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>PEAK COUNT</div>
                          </div>

                          {videoAnalysisResult && (
                            <div style={{
                              background: 'rgba(30, 41, 59, 0.5)',
                              borderRadius: '8px',
                              padding: '12px',
                              border: '1px solid rgba(139, 92, 246, 0.2)'
                            }}>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: '#8b5cf6', marginBottom: '4px' }}>
                                {videoAnalysisResult.total_detections.toLocaleString()}
                              </div>
                              <div style={{ fontSize: '10px', color: '#94a3b8' }}>VIDEO TOTAL</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Analytics Section for Live View - moved below cameras */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Configuration */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  padding: '32px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    <div style={{
                      padding: '12px',
                      background: 'linear-gradient(45deg, #a855f7, #ec4899)',
                      borderRadius: '16px'
                    }}>
                      <Settings style={{ width: '24px', height: '24px', color: 'white' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: 0 }}>Detection Settings</h3>
                      <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Configure AI parameters</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', color: '#cbd5e1' }}>Detection Confidence</label>
                        <span style={{ color: '#06b6d4', fontSize: '16px', fontWeight: '700' }}>{(config.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.01"
                        max="0.95"
                        step="0.01"
                        value={config.confidence}
                        onChange={(e) => setConfig({...config, confidence: parseFloat(e.target.value)})}
                        style={{
                          width: '100%',
                          height: '6px',
                          background: '#374151',
                          borderRadius: '6px',
                          appearance: 'none',
                          cursor: 'pointer',
                          accentColor: '#06b6d4'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '8px' }}>
                        <span>Ultra-Sensitive (1%)</span>
                        <span>High Precision (95%)</span>
                      </div>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#cbd5e1', marginBottom: '12px' }}>Detection Interval (ms)</label>
                      <input
                        type="number"
                        min="100"
                        max="5000"
                        step="100"
                        value={config.detectionInterval}
                        onChange={(e) => setConfig({...config, detectionInterval: parseInt(e.target.value)})}
                        style={{
                          width: '100%',
                          background: 'rgba(30, 41, 59, 0.5)',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '600', color: '#cbd5e1', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={config.showBoundingBoxes}
                          onChange={(e) => setConfig({...config, showBoundingBoxes: e.target.checked})}
                          style={{ accentColor: '#06b6d4' }}
                        />
                        Show Bounding Boxes
                      </label>
                    </div>
                    
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '600', color: '#cbd5e1', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={config.alertEnabled}
                          onChange={(e) => setConfig({...config, alertEnabled: e.target.checked})}
                          style={{ accentColor: '#06b6d4' }}
                        />
                        Enable Alerts
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* System Status & Alerts */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  padding: '32px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{
                      padding: '12px',
                      background: 'linear-gradient(45deg, #ea580c, #dc2626)',
                      borderRadius: '16px'
                    }}>
                      <AlertTriangle style={{ width: '24px', height: '24px', color: 'white' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: 0 }}>System Status</h3>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {alerts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px' }}>
                        <CheckCircle style={{ width: '48px', height: '48px', color: '#10b981', margin: '0 auto 16px' }} />
                        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>All systems operational</p>
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <div
                          key={alert.id}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            borderLeft: `3px solid ${
                              alert.severity === 'high' 
                                ? '#ef4444' 
                                : alert.severity === 'medium'
                                ? '#fbbf24'
                                : '#10b981'
                            }`,
                            background: 'rgba(30, 41, 59, 0.3)',
                            border: '1px solid rgba(71, 85, 105, 0.3)'
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>{alert.message}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#94a3b8' }}>
                            <Clock style={{ width: '10px', height: '10px' }} />
                            <span>{alert.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Video Analysis Results Section */}
              {videoAnalysisResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {/* Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '20px',
                      padding: '32px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ color: '#6ee7b7', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>Total Video Detections</p>
                          <p style={{ fontSize: '32px', fontWeight: '900', color: '#10b981', margin: 0 }}>
                            {videoAnalysisResult.total_detections.toLocaleString()}
                          </p>
                        </div>
                        <Users style={{ width: '40px', height: '40px', color: '#10b981' }} />
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1))',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '20px',
                      padding: '32px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ color: '#93c5fd', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>Peak Occupancy</p>
                          <p style={{ fontSize: '32px', fontWeight: '900', color: '#3b82f6', margin: 0 }}>
                            {videoAnalysisResult.peak_occupancy}
                          </p>
                        </div>
                        <BarChart3 style={{ width: '40px', height: '40px', color: '#3b82f6' }} />
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.1))',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '20px',
                      padding: '32px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ color: '#c4b5fd', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>Processing Time</p>
                          <p style={{ fontSize: '32px', fontWeight: '900', color: '#8b5cf6', margin: 0 }}>
                            {(videoAnalysisResult.processing_stats.total_processing_time / 1000).toFixed(1)}s
                          </p>
                        </div>
                        <Clock style={{ width: '40px', height: '40px', color: '#8b5cf6' }} />
                      </div>
                    </div>
                  </div>

                  {/* Detailed Results */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    padding: '32px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                      <h4 style={{ fontSize: '24px', fontWeight: '700', color: 'white', margin: 0 }}>Video Analysis Results</h4>
                      <button
                        onClick={downloadVideoResults}
                        style={{
                          padding: '12px 24px',
                          borderRadius: '12px',
                          border: 'none',
                          background: '#3b82f6',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
                      >
                        <Download style={{ width: '16px', height: '16px' }} />
                        Download Results
                      </button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                      {/* Processing Stats */}
                      <div>
                        <h5 style={{ fontSize: '18px', fontWeight: '600', color: '#cbd5e1', margin: '0 0 24px 0' }}>Processing Statistics</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                            <span style={{ color: '#94a3b8' }}>Total Frames:</span>
                            <span style={{ color: 'white', fontWeight: '600' }}>{videoAnalysisResult.frames_processed.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                            <span style={{ color: '#94a3b8' }}>Processed Frames:</span>
                            <span style={{ color: 'white', fontWeight: '600' }}>{videoAnalysisResult.processing_stats.frames_analyzed.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                            <span style={{ color: '#94a3b8' }}>Processing Time:</span>
                            <span style={{ color: 'white', fontWeight: '600' }}>{(videoAnalysisResult.processing_stats.total_processing_time / 1000).toFixed(1)}s</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                            <span style={{ color: '#94a3b8' }}>Video Duration:</span>
                            <span style={{ color: 'white', fontWeight: '600' }}>{videoAnalysisResult.video_duration.toFixed(1)}s</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                            <span style={{ color: '#94a3b8' }}>Sample Interval:</span>
                            <span style={{ color: 'white', fontWeight: '600' }}>{videoAnalysisResult.processing_stats.sample_interval}</span>
                          </div>
                        </div>
                      </div>

                      {/* Confidence Distribution */}
                      <div>
                        <h5 style={{ fontSize: '18px', fontWeight: '600', color: '#cbd5e1', margin: '0 0 24px 0' }}>Confidence Distribution</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ color: '#10b981', fontWeight: '600' }}>High (≥70%)</span>
                              <span style={{ color: 'white', fontWeight: '600' }}>{videoAnalysisResult.confidence_distribution.high}</span>
                            </div>
                            <div style={{ width: '100%', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px', height: '8px' }}>
                              <div 
                                style={{
                                  background: '#10b981',
                                  height: '100%',
                                  borderRadius: '8px',
                                  width: `${(videoAnalysisResult.confidence_distribution.high / videoAnalysisResult.total_detections) * 100}%`
                                }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ color: '#f59e0b', fontWeight: '600' }}>Medium (40-70%)</span>
                              <span style={{ color: 'white', fontWeight: '600' }}>{videoAnalysisResult.confidence_distribution.medium}</span>
                            </div>
                            <div style={{ width: '100%', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px', height: '8px' }}>
                              <div 
                                style={{
                                  background: '#f59e0b',
                                  height: '100%',
                                  borderRadius: '8px',
                                  width: `${(videoAnalysisResult.confidence_distribution.medium / videoAnalysisResult.total_detections) * 100}%`
                                }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ color: '#ef4444', fontWeight: '600' }}>Low (&lt;40%)</span>
                              <span style={{ color: 'white', fontWeight: '600' }}>{videoAnalysisResult.confidence_distribution.low}</span>
                            </div>
                            <div style={{ width: '100%', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px', height: '8px' }}>
                              <div 
                                style={{
                                  background: '#ef4444',
                                  height: '100%',
                                  borderRadius: '8px',
                                  width: `${(videoAnalysisResult.confidence_distribution.low / videoAnalysisResult.total_detections) * 100}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Preview */}
                    {videoAnalysisResult.detection_timeline && videoAnalysisResult.detection_timeline.length > 0 && (
                      <div style={{ marginTop: '32px' }}>
                        <h5 style={{ fontSize: '18px', fontWeight: '600', color: '#cbd5e1', margin: '0 0 24px 0' }}>Detection Timeline (First 10 entries)</h5>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', fontSize: '14px' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #374151' }}>
                                <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8' }}>Frame</th>
                                <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8' }}>Timestamp</th>
                                <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8' }}>People Count</th>
                                <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8' }}>Avg Confidence</th>
                              </tr>
                            </thead>
                            <tbody>
                              {videoAnalysisResult.detection_timeline.slice(0, 10).map((entry, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #374151' }}>
                                  <td style={{ padding: '12px', color: 'white' }}>{entry.frame_number}</td>
                                  <td style={{ padding: '12px', color: '#cbd5e1' }}>{entry.timestamp.toFixed(1)}s</td>
                                  <td style={{ padding: '12px', color: 'white', fontWeight: '600' }}>{entry.people_count}</td>
                                  <td style={{ padding: '12px' }}>
                                    <span style={{
                                      fontWeight: '600',
                                      color: entry.avg_confidence >= 0.7 ? '#10b981' :
                                            entry.avg_confidence >= 0.4 ? '#f59e0b' : '#ef4444'
                                    }}>
                                      {(entry.avg_confidence * 100).toFixed(1)}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {videoAnalysisResult.detection_timeline.length > 10 && (
                            <p style={{ color: '#94a3b8', fontSize: '12px', margin: '16px 0 0 0' }}>
                              Showing first 10 of {videoAnalysisResult.detection_timeline.length} timeline entries. Download full results for complete data.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Video Upload Tab Content - Simplified since upload is now in sidebar */
            <div style={{ 
              padding: '100px',
              textAlign: 'center',
              color: '#94a3b8'
            }}>
              <FileVideo style={{ width: '64px', height: '64px', color: '#6b7280', margin: '0 auto 24px' }} />
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#cbd5e1', margin: '0 0 12px 0' }}>Video upload functionality</h3>
              <p style={{ margin: 0, fontSize: '16px' }}>
                Video upload is now available in the sidebar on the Live Cameras tab
              </p>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
