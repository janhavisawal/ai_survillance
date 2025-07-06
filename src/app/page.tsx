'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Shield, Video, VideoOff, Play, Pause, Upload, Settings, Activity, 
  Wifi, WifiOff, AlertTriangle, Users, Clock, Camera, 
  BarChart3, Maximize2, RefreshCw, Eye, Target, Bell, 
  Monitor, Cpu, HardDrive, Signal, CheckCircle, XCircle,
  FileVideo, Zap, TrendingUp, Database, RotateCcw, Download,
  Loader2, AlertCircle, LineChart, PieChart, BarChart
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
  
  // Video Upload States for both feeds
  const [uploadedFiles, setUploadedFiles] = useState<{
    feed1: File | null;
    feed2: File | null;
  }>({
    feed1: null,
    feed2: null
  });
  
  const [isProcessingVideo, setIsProcessingVideo] = useState<{
    feed1: boolean;
    feed2: boolean;
  }>({
    feed1: false,
    feed2: false
  });
  
  const [videoAnalysisResults, setVideoAnalysisResults] = useState<{
    feed1: VideoAnalysisResult | null;
    feed2: VideoAnalysisResult | null;
  }>({
    feed1: null,
    feed2: null
  });
  
  const [processingProgress, setProcessingProgress] = useState<{
    feed1: number;
    feed2: number;
  }>({
    feed1: 0,
    feed2: 0
  });
  
  const [currentStatus, setCurrentStatus] = useState<{
    feed1: string;
    feed2: string;
  }>({
    feed1: '',
    feed2: ''
  });
  
  const [videoPreview, setVideoPreview] = useState<{
    feed1: string;
    feed2: string;
  }>({
    feed1: '',
    feed2: ''
  });
  
  const [processingError, setProcessingError] = useState<{
    feed1: string;
    feed2: string;
  }>({
    feed1: '',
    feed2: ''
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [apiStatus, setApiStatus] = useState('disconnected');
  const [apiUrl, setApiUrl] = useState('');
  
  const [analytics, setAnalytics] = useState({
    totalDetections: 0,
    avgConfidence: 0,
    peakOccupancy: 0,
    detectionHistory: [] as any[],
    confidenceDistribution: { high: 0, medium: 0, low: 0 },
    processingStats: {
      avgProcessingTime: 0,
      totalFramesProcessed: 0,
      fps: 0
    }
  });
  
  const [alerts, setAlerts] = useState<any[]>([]);
  
  const [config, setConfig] = useState({
    confidence: 0.08,
    maxPeople: 15,
    alertEnabled: true,
    nightVision: false,
    motionDetection: true,
    showBoundingBoxes: true,
    realTimeMode: true,
    detectionInterval: 1000
  });

  // Refs for live camera feeds
  const videoRef1 = useRef<HTMLVideoElement | null>(null);
  const videoRef2 = useRef<HTMLVideoElement | null>(null);
  const canvasRef1 = useRef<HTMLCanvasElement | null>(null);
  const canvasRef2 = useRef<HTMLCanvasElement | null>(null);
  const detectionIntervalRef1 = useRef<NodeJS.Timeout | null>(null);
  const detectionIntervalRef2 = useRef<NodeJS.Timeout | null>(null);
  const streamRef1 = useRef<MediaStream | null>(null);
  const streamRef2 = useRef<MediaStream | null>(null);

  // Refs for video upload for both feeds
  const videoUploadInputRef1 = useRef<HTMLInputElement>(null);
  const videoUploadInputRef2 = useRef<HTMLInputElement>(null);
  const uploadVideoRef1 = useRef<HTMLVideoElement>(null);
  const uploadVideoRef2 = useRef<HTMLVideoElement>(null);
  const progressIntervalRef1 = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef2 = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Video Upload Functions
  const handleVideoFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>, feedId: 'feed1' | 'feed2') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setProcessingError(prev => ({ ...prev, [feedId]: 'Please select a valid video file' }));
      return;
    }

    // Validate file size (e.g., 500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      setProcessingError(prev => ({ ...prev, [feedId]: 'File size too large. Please select a video under 500MB' }));
      return;
    }

    setUploadedFiles(prev => ({ ...prev, [feedId]: file }));
    setProcessingError(prev => ({ ...prev, [feedId]: '' }));
    setVideoAnalysisResults(prev => ({ ...prev, [feedId]: null }));
    setProcessingProgress(prev => ({ ...prev, [feedId]: 0 }));

    // Create video preview
    const videoUrl = URL.createObjectURL(file);
    setVideoPreview(prev => ({ ...prev, [feedId]: videoUrl }));
  }, []);

  const startVideoProgressTracking = useCallback((feedId: 'feed1' | 'feed2') => {
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

    const intervalRef = feedId === 'feed1' ? progressIntervalRef1 : progressIntervalRef2;
    intervalRef.current = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 95) progress = 95; // Don't complete until we get real result
      
      setProcessingProgress(prev => ({ ...prev, [feedId]: progress }));
      
      // Update status every 20% progress
      const newStatusIndex = Math.floor(progress / 16.67);
      if (newStatusIndex !== statusIndex && newStatusIndex < statuses.length) {
        statusIndex = newStatusIndex;
        setCurrentStatus(prev => ({ ...prev, [feedId]: statuses[statusIndex] }));
      }
    }, 1000);
  }, []);

  const stopVideoProgressTracking = useCallback((feedId: 'feed1' | 'feed2') => {
    const intervalRef = feedId === 'feed1' ? progressIntervalRef1 : progressIntervalRef2;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const processUploadedVideo = useCallback(async (feedId: 'feed1' | 'feed2') => {
    const uploadedFile = uploadedFiles[feedId];
    if (!uploadedFile || !isConnected) {
      setProcessingError(prev => ({ ...prev, [feedId]: 'Please ensure you have a video file and are connected to the API' }));
      return;
    }

    setIsProcessingVideo(prev => ({ ...prev, [feedId]: true }));
    setProcessingError(prev => ({ ...prev, [feedId]: '' }));
    setProcessingProgress(prev => ({ ...prev, [feedId]: 0 }));
    setCurrentStatus(prev => ({ ...prev, [feedId]: 'Preparing video for analysis...' }));
    
    startVideoProgressTracking(feedId);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('confidence', config.confidence.toString());
      formData.append('feed_id', feedId);

      const response = await fetch(`${apiUrl}/detect/video/analyze`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const result: VideoAnalysisResult = await response.json();
      
      stopVideoProgressTracking(feedId);
      setProcessingProgress(prev => ({ ...prev, [feedId]: 100 }));
      setCurrentStatus(prev => ({ ...prev, [feedId]: 'Analysis complete!' }));
      setVideoAnalysisResults(prev => ({ ...prev, [feedId]: result }));
      setIsProcessingVideo(prev => ({ ...prev, [feedId]: false }));

      // Draw initial detections on the video
      setTimeout(() => {
        if (result.detection_timeline && result.detection_timeline.length > 0) {
          drawVideoAnalysisResults(result.detection_timeline, feedId);
        }
      }, 1000);

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
        message: `${feedId.toUpperCase()}: Video analysis complete! Found ${result.total_detections} total detections with peak occupancy of ${result.peak_occupancy} people.`,
        time: new Date().toLocaleTimeString(),
        severity: 'low'
      }, ...(prev || []).slice(0, 4)]);

    } catch (error) {
      console.error('Video processing error:', error);
      stopVideoProgressTracking(feedId);
      setProcessingError(prev => ({ ...prev, [feedId]: error instanceof Error ? error.message : 'Video processing failed' }));
      setIsProcessingVideo(prev => ({ ...prev, [feedId]: false }));
      setProcessingProgress(prev => ({ ...prev, [feedId]: 0 }));
      setCurrentStatus(prev => ({ ...prev, [feedId]: '' }));
    }
  }, [uploadedFiles, isConnected, apiUrl, config.confidence, startVideoProgressTracking, stopVideoProgressTracking]);

  const resetVideoUpload = useCallback((feedId: 'feed1' | 'feed2') => {
    setUploadedFiles(prev => ({ ...prev, [feedId]: null }));
    setVideoPreview(prev => ({ ...prev, [feedId]: '' }));
    setVideoAnalysisResults(prev => ({ ...prev, [feedId]: null }));
    setProcessingProgress(prev => ({ ...prev, [feedId]: 0 }));
    setCurrentStatus(prev => ({ ...prev, [feedId]: '' }));
    setProcessingError(prev => ({ ...prev, [feedId]: '' }));
    setIsProcessingVideo(prev => ({ ...prev, [feedId]: false }));
    stopVideoProgressTracking(feedId);
    
    const inputRef = feedId === 'feed1' ? videoUploadInputRef1 : videoUploadInputRef2;
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [stopVideoProgressTracking]);

  const downloadVideoResults = useCallback((feedId: 'feed1' | 'feed2') => {
    const result = videoAnalysisResults[feedId];
    if (!result) return;
    
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${feedId}-analysis-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [videoAnalysisResults]);

  // Real-time detection function
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
      
      if (!blob) return;
      
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
        
        // Draw bounding boxes
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

  // Enhanced video analysis drawing with transparent bounding boxes
  const drawVideoAnalysisResults = useCallback((timelineData: any[] = [], feedId: 'feed1' | 'feed2') => {
    const uploadVideoRef = feedId === 'feed1' ? uploadVideoRef1 : uploadVideoRef2;
    const canvasRef = feedId === 'feed1' ? canvasRef1 : canvasRef2;
    
    const video = uploadVideoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !timelineData.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match video display
    const videoRect = video.getBoundingClientRect();
    canvas.width = videoRect.width;
    canvas.height = videoRect.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const currentTime = video.currentTime;
    
    // Find the closest timeline entry to current video time
    const closestEntry = timelineData.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.timestamp - currentTime);
      const currDiff = Math.abs(curr.timestamp - currentTime);
      return currDiff < prevDiff ? curr : prev;
    });
    
    if (!closestEntry || !closestEntry.detections || closestEntry.detections.length === 0) {
      return;
    }
    
    // Calculate scaling factors
    const scaleX = canvas.width / (video.videoWidth || 640);
    const scaleY = canvas.height / (video.videoHeight || 480);
    
    // Draw each detection with transparent style
    closestEntry.detections.forEach((detection: any, index: number) => {
      const { bbox, confidence } = detection;
      if (!bbox || bbox.length !== 4) return;
      
      const [x1, y1, x2, y2] = bbox;
      const scaledX1 = x1 * scaleX;
      const scaledY1 = y1 * scaleY;
      const scaledX2 = x2 * scaleX;
      const scaledY2 = y2 * scaleY;
      
      // Transparent bounding box - blue theme like the example
      const boxColor = 'rgba(59, 130, 246, 0.3)';  // Transparent blue fill
      const borderColor = 'rgba(59, 130, 246, 0.8)';  // Semi-transparent blue border
      
      // Draw filled rectangle (transparent background)
      ctx.fillStyle = boxColor;
      ctx.fillRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1);
      
      // Draw border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1);
      
      // Small confidence badge in corner
      if (confidence > 0.4) {
        const badgeText = `${(confidence * 100).toFixed(0)}%`;
        ctx.font = '11px system-ui';
        const textMetrics = ctx.measureText(badgeText);
        
        // Small badge background
        ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
        ctx.fillRect(scaledX1, scaledY1 - 18, textMetrics.width + 8, 16);
        
        // Badge text
        ctx.fillStyle = 'white';
        ctx.fillText(badgeText, scaledX1 + 4, scaledY1 - 6);
      }
      
      // Small center dot
      const centerX = (scaledX1 + scaledX2) / 2;
      const centerY = (scaledY1 + scaledY2) / 2;
      
      ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Clean header with people count
    const headerText = `${closestEntry.detections.length} People Detected`;
    ctx.font = 'bold 14px system-ui';
    const headerMetrics = ctx.measureText(headerText);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, headerMetrics.width + 16, 28);
    
    ctx.fillStyle = 'white';
    ctx.fillText(headerText, 18, 28);
  }, []);

  const drawRealBoundingBoxes = (feedId: string, detections: any[]) => {
    const canvasRef = feedId === 'feed1' ? canvasRef1 : canvasRef2;
    const videoRef = feedId === 'feed1' ? videoRef1 : videoRef2;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match video display size
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!config.showBoundingBoxes || !detections.length) return;
    
    // Calculate scaling factors from video source to display
    const scaleX = canvas.width / (video.videoWidth || 640);
    const scaleY = canvas.height / (video.videoHeight || 480);
    
    detections.forEach((detection, index) => {
      const { bbox, confidence } = detection;
      const [x1, y1, x2, y2] = bbox;
      
      // Scale coordinates to canvas size
      const scaledX1 = x1 * scaleX;
      const scaledY1 = y1 * scaleY;
      const scaledX2 = x2 * scaleX;
      const scaledY2 = y2 * scaleY;
      
      // Transparent blue styling like the example
      const boxColor = 'rgba(16, 185, 129, 0.25)';  // Transparent green fill
      const borderColor = 'rgba(16, 185, 129, 0.8)';  // Semi-transparent green border
      
      // Draw filled rectangle (transparent background)
      ctx.fillStyle = boxColor;
      ctx.fillRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1);
      
      // Draw border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1);
      
      // Small confidence badge
      if (confidence > 0.4) {
        const badgeText = `${(confidence * 100).toFixed(0)}%`;
        ctx.font = '11px system-ui';
        const textMetrics = ctx.measureText(badgeText);
        
        // Badge background
        ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
        ctx.fillRect(scaledX1, scaledY1 - 18, textMetrics.width + 8, 16);
        
        // Badge text
        ctx.fillStyle = 'white';
        ctx.fillText(badgeText, scaledX1 + 4, scaledY1 - 6);
      }
      
      // Small center dot
      const centerX = (scaledX1 + scaledX2) / 2;
      const centerY = (scaledY1 + scaledY2) / 2;
      
      ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Live indicator
    if (detections.length > 0) {
      const headerText = `${detections.length} People Detected`;
      ctx.font = 'bold 14px system-ui';
      const headerMetrics = ctx.measureText(headerText);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, headerMetrics.width + 16, 28);
      
      ctx.fillStyle = 'white';
      ctx.fillText(headerText, 18, 28);
      
      // Live badge
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.fillRect(canvas.width - 60, 10, 50, 20);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px system-ui';
      ctx.fillText('● LIVE', canvas.width - 55, 24);
    }
  };

  // Update analytics with real-time data
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
        detectionHistory: [...(prev.detectionHistory || []), {
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
          fps: prev.processingStats.fps
        }
      };
    });
  };

  // Start real-time detection
  const startRealTimeDetection = (feedId: string) => {
    const intervalRef = feedId === 'feed1' ? detectionIntervalRef1 : detectionIntervalRef2;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      performRealTimeDetection(feedId);
    }, config.detectionInterval);
  };

  // Stop real-time detection
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

  // Start camera feed
  const startCameraFeed = async (feedId: string) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          facingMode: 'user'
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const videoRef = feedId === 'feed1' ? videoRef1 : videoRef2;
      const streamRef = feedId === 'feed1' ? streamRef1 : streamRef2;
      
      if (!videoRef.current) return;

      const videoElement = videoRef.current;
      videoElement.srcObject = stream;
      streamRef.current = stream;
      
      setFeeds(prev => ({
        ...prev,
        [feedId]: { ...prev[feedId], isStreaming: true }
      }));

      videoElement.onloadeddata = () => {
        videoElement.play()
          .then(() => {
            if (config.realTimeMode) {
              setTimeout(() => startRealTimeDetection(feedId), 1000);
            }
          })
          .catch(e => {
            videoElement.muted = true;
            return videoElement.play();
          });
      };
      
    } catch (error) {
      console.error(`Camera access failed for ${feedId}:`, error);
      
      let errorMessage = 'Unknown camera error';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please ensure a camera is connected.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setAlerts(prev => [{
        id: Date.now(),
        type: 'error',
        message: `Camera failed for ${feedId}: ${errorMessage}`,
        time: new Date().toLocaleTimeString(),
        severity: 'high'
      }, ...(prev || []).slice(0, 4)]);
    }
  };

  // Stop camera feed
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
        
        setAlerts(prev => [{
          id: Date.now(),
          type: 'success',
          message: `Connected to AI Detection API (${data.detector_type || 'Unknown Model'})`,
          time: new Date().toLocaleTimeString(),
          severity: 'low'
        }, ...(prev || []).slice(0, 4)]);
      } else {
        throw new Error('API not responding');
      }
    } catch (error) {
      setApiStatus('disconnected');
      setIsConnected(false);
      
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

  // Create simple timeline chart data focused on people count over time
  const createTimelineChartData = (result: VideoAnalysisResult | null) => {
    if (!result?.detection_timeline) return [];
    
    // Take more samples for better visualization, but limit for performance
    const maxSamples = 30;
    const timeline = result.detection_timeline;
    const step = Math.max(1, Math.floor(timeline.length / maxSamples));
    
    return timeline
      .filter((_, index) => index % step === 0)
      .slice(0, maxSamples)
      .map(entry => ({
        time: `${Math.floor(entry.timestamp / 60)}:${(entry.timestamp % 60).toFixed(0).padStart(2, '0')}`,
        timeSeconds: entry.timestamp,
        people: entry.people_count,
        color: entry.people_count > 8 ? '#ef4444' : 
               entry.people_count > 4 ? '#f59e0b' : 
               entry.people_count > 0 ? '#10b981' : '#6b7280'
      }));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealTimeDetection('feed1');
      stopRealTimeDetection('feed2');
      stopCameraFeed('feed1');
      stopCameraFeed('feed2');
      [progressIntervalRef1, progressIntervalRef2].forEach(ref => {
        if (ref.current) clearInterval(ref.current);
      });
      Object.values(videoPreview).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '20px 30px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield style={{ width: '32px', height: '32px', color: '#60a5fa' }} />
              <h1 style={{
                fontSize: '24px',
                fontWeight: '800',
                background: 'linear-gradient(45deg, #60a5fa, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                AI DETECTION SYSTEM
              </h1>
            </div>
            <span style={{
              fontSize: '12px',
              background: config.realTimeMode ? '#10b981' : '#6b7280',
              padding: '4px 12px',
              borderRadius: '12px',
              color: 'white',
              fontWeight: '600'
            }}>
              {config.realTimeMode ? '● LIVE DETECTION' : '○ DETECTION OFF'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter AI Detection API URL"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  background: 'rgba(30, 41, 59, 0.5)',
                  color: 'white',
                  fontSize: '14px',
                  width: '280px'
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
              padding: '12px 20px',
              borderRadius: '12px',
              background: isConnected 
                ? 'rgba(16, 185, 129, 0.2)' 
                : 'rgba(239, 68, 68, 0.2)',
              border: isConnected 
                ? '1px solid rgba(16, 185, 129, 0.3)' 
                : '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              {isConnected ? <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} /> : <XCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />}
              <span style={{ fontSize: '12px', fontWeight: '600', color: isConnected ? '#10b981' : '#ef4444' }}>
                {isConnected ? 'API CONNECTED' : 'API OFFLINE'}
              </span>
            </div>
            
            <button
              onClick={toggleRealTimeDetection}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
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
      </header>

      <div style={{ padding: '30px' }}>
        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 350px', gap: '30px' }}>
          
          {/* Feed 1 */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '20px',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Camera style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Camera Feed 1</h3>
                  <span style={{
                    fontSize: '10px',
                    background: feeds.feed1.isLiveDetection ? '#10b981' : '#6b7280',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    color: 'white'
                  }}>
                    {feeds.feed1.isLiveDetection ? 'DETECTING' : feeds.feed1.isStreaming ? 'STREAMING' : 'OFFLINE'}
                  </span>
                </div>
                <button
                  onClick={() => toggleCamera('feed1')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: feeds.feed1.isStreaming ? '#ef4444' : '#10b981',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {feeds.feed1.isStreaming ? <VideoOff style={{ width: '14px', height: '14px' }} /> : <Video style={{ width: '14px', height: '14px' }} />}
                  {feeds.feed1.isStreaming ? 'Stop' : 'Start'}
                </button>
              </div>
            </div>
            
            <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
              {/* Live camera or uploaded video */}
              {videoPreview.feed1 ? (
                <video
                  ref={uploadVideoRef1}
                  src={videoPreview.feed1}
                  controls
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onTimeUpdate={() => {
                    if (videoAnalysisResults.feed1?.detection_timeline) {
                      drawVideoAnalysisResults(videoAnalysisResults.feed1.detection_timeline, 'feed1');
                    }
                  }}
                  onSeeked={() => {
                    if (videoAnalysisResults.feed1?.detection_timeline) {
                      drawVideoAnalysisResults(videoAnalysisResults.feed1.detection_timeline, 'feed1');
                    }
                  }}
                />
              ) : (
                <video
                  ref={videoRef1}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              
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
              
              {!feeds.feed1.isStreaming && !videoPreview.feed1 && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #0f172a, #1e293b)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <Camera style={{ width: '48px', height: '48px', color: '#475569', margin: '0 auto 16px' }} />
                    <p style={{ color: '#64748b', margin: 0 }}>Start camera or upload video</p>
                  </div>
                </div>
              )}
              
              {/* Detection count overlay */}
              {(feeds.feed1.isStreaming || videoPreview.feed1) && (
                <div style={{ position: 'absolute', bottom: '16px', left: '16px' }}>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Users style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#60a5fa' }}>
                        {videoAnalysisResults.feed1?.peak_occupancy || feeds.feed1.currentCount}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {videoPreview.feed1 ? 'PEAK' : 'LIVE'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Video Upload Section for Feed 1 */}
            <div style={{ padding: '20px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <FileVideo style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Video Upload</h4>
              </div>
              
              {!uploadedFiles.feed1 ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => videoUploadInputRef1.current?.click()}
                    disabled={!isConnected}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isConnected ? '#8b5cf6' : '#6b7280',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: isConnected ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Upload style={{ width: '14px', height: '14px' }} />
                    Choose Video
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{uploadedFiles.feed1.name}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => processUploadedVideo('feed1')}
                      disabled={isProcessingVideo.feed1 || !isConnected}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: isProcessingVideo.feed1 || !isConnected ? '#6b7280' : '#8b5cf6',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: isProcessingVideo.feed1 || !isConnected ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      {isProcessingVideo.feed1 ? (
                        <>
                          <Loader2 style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />
                          {Math.round(processingProgress.feed1)}%
                        </>
                      ) : (
                        <>
                          <Play style={{ width: '12px', height: '12px' }} />
                          Analyze
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => resetVideoUpload('feed1')}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#6b7280',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <RotateCcw style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                  
                  {isProcessingVideo.feed1 && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{
                        width: '100%',
                        background: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '4px',
                        height: '4px',
                        overflow: 'hidden'
                      }}>
                        <div 
                          style={{
                            background: '#8b5cf6',
                            height: '100%',
                            borderRadius: '4px',
                            transition: 'width 0.5s ease',
                            width: `${processingProgress.feed1}%`
                          }}
                        ></div>
                      </div>
                      {currentStatus.feed1 && (
                        <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '4px' }}>
                          {currentStatus.feed1}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {processingError.feed1 && (
                    <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '4px' }}>
                      {processingError.feed1}
                    </div>
                  )}
                </div>
              )}
              
              <input
                ref={videoUploadInputRef1}
                type="file"
                accept="video/*"
                onChange={(e) => handleVideoFileSelect(e, 'feed1')}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Feed 2 */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '20px',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Camera style={{ width: '20px', height: '20px', color: '#10b981' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Camera Feed 2</h3>
                  <span style={{
                    fontSize: '10px',
                    background: feeds.feed2.isLiveDetection ? '#10b981' : '#6b7280',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    color: 'white'
                  }}>
                    {feeds.feed2.isLiveDetection ? 'DETECTING' : feeds.feed2.isStreaming ? 'STREAMING' : 'OFFLINE'}
                  </span>
                </div>
                <button
                  onClick={() => toggleCamera('feed2')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: feeds.feed2.isStreaming ? '#ef4444' : '#10b981',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {feeds.feed2.isStreaming ? <VideoOff style={{ width: '14px', height: '14px' }} /> : <Video style={{ width: '14px', height: '14px' }} />}
                  {feeds.feed2.isStreaming ? 'Stop' : 'Start'}
                </button>
              </div>
            </div>
            
            <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
              {/* Live camera or uploaded video */}
              {videoPreview.feed2 ? (
                <video
                  ref={uploadVideoRef2}
                  src={videoPreview.feed2}
                  controls
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onTimeUpdate={() => {
                    if (videoAnalysisResults.feed2?.detection_timeline) {
                      drawVideoAnalysisResults(videoAnalysisResults.feed2.detection_timeline, 'feed2');
                    }
                  }}
                  onSeeked={() => {
                    if (videoAnalysisResults.feed2?.detection_timeline) {
                      drawVideoAnalysisResults(videoAnalysisResults.feed2.detection_timeline, 'feed2');
                    }
                  }}
                />
              ) : (
                <video
                  ref={videoRef2}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              
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
              
              {!feeds.feed2.isStreaming && !videoPreview.feed2 && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #0f172a, #1e293b)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <Camera style={{ width: '48px', height: '48px', color: '#475569', margin: '0 auto 16px' }} />
                    <p style={{ color: '#64748b', margin: 0 }}>Start camera or upload video</p>
                  </div>
                </div>
              )}
              
              {/* Detection count overlay */}
              {(feeds.feed2.isStreaming || videoPreview.feed2) && (
                <div style={{ position: 'absolute', bottom: '16px', left: '16px' }}>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Users style={{ width: '16px', height: '16px', color: '#10b981' }} />
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                        {videoAnalysisResults.feed2?.peak_occupancy || feeds.feed2.currentCount}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {videoPreview.feed2 ? 'PEAK' : 'LIVE'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Video Upload Section for Feed 2 */}
            <div style={{ padding: '20px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <FileVideo style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Video Upload</h4>
              </div>
              
              {!uploadedFiles.feed2 ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => videoUploadInputRef2.current?.click()}
                    disabled={!isConnected}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isConnected ? '#8b5cf6' : '#6b7280',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: isConnected ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Upload style={{ width: '14px', height: '14px' }} />
                    Choose Video
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{uploadedFiles.feed2.name}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => processUploadedVideo('feed2')}
                      disabled={isProcessingVideo.feed2 || !isConnected}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: isProcessingVideo.feed2 || !isConnected ? '#6b7280' : '#8b5cf6',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: isProcessingVideo.feed2 || !isConnected ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      {isProcessingVideo.feed2 ? (
                        <>
                          <Loader2 style={{ width: '12px', height: '12px', animation: 'spin 1s linear infinite' }} />
                          {Math.round(processingProgress.feed2)}%
                        </>
                      ) : (
                        <>
                          <Play style={{ width: '12px', height: '12px' }} />
                          Analyze
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => resetVideoUpload('feed2')}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#6b7280',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <RotateCcw style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>
                  
                  {isProcessingVideo.feed2 && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{
                        width: '100%',
                        background: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '4px',
                        height: '4px',
                        overflow: 'hidden'
                      }}>
                        <div 
                          style={{
                            background: '#8b5cf6',
                            height: '100%',
                            borderRadius: '4px',
                            transition: 'width 0.5s ease',
                            width: `${processingProgress.feed2}%`
                          }}
                        ></div>
                      </div>
                      {currentStatus.feed2 && (
                        <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '4px' }}>
                          {currentStatus.feed2}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {processingError.feed2 && (
                    <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '4px' }}>
                      {processingError.feed2}
                    </div>
                  )}
                </div>
              )}
              
              <input
                ref={videoUploadInputRef2}
                type="file"
                accept="video/*"
                onChange={(e) => handleVideoFileSelect(e, 'feed2')}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Right Sidebar - Analytics and Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Quick Stats */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              padding: '20px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
                Live Stats
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#60a5fa', marginBottom: '4px' }}>
                    {feeds.feed1.currentCount + feeds.feed2.currentCount}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>CURRENT TOTAL</div>
                </div>
                
                <div style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>
                    {analytics.peakOccupancy}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>PEAK COUNT</div>
                </div>

                <div style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6', marginBottom: '4px' }}>
                    {Math.max(
                      videoAnalysisResults.feed1?.peak_occupancy || 0,
                      videoAnalysisResults.feed2?.peak_occupancy || 0
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>VIDEO PEAK</div>
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              padding: '20px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings style={{ width: '16px', height: '16px', color: '#a855f7' }} />
                Settings
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}>Detection Confidence</label>
                    <span style={{ color: '#06b6d4', fontSize: '14px', fontWeight: '700' }}>{(config.confidence * 100).toFixed(0)}%</span>
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
                      height: '4px',
                      background: '#374151',
                      borderRadius: '4px',
                      appearance: 'none',
                      cursor: 'pointer',
                      accentColor: '#06b6d4'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', cursor: 'pointer' }}>
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', cursor: 'pointer' }}>
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
              borderRadius: '16px',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              padding: '20px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle style={{ width: '16px', height: '16px', color: '#ea580c' }} />
                System Status
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {alerts && alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <CheckCircle style={{ width: '32px', height: '32px', color: '#10b981', margin: '0 auto 12px' }} />
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>All systems operational</p>
                  </div>
                ) : (
                  (alerts || []).map((alert) => (
                    <div
                      key={alert.id}
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
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
                      <div style={{ fontSize: '11px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>{alert.message}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#94a3b8' }}>
                        <Clock style={{ width: '8px', height: '8px' }} />
                        <span>{alert.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Simplified Timeline Analysis Section */}
        {(videoAnalysisResults.feed1 || videoAnalysisResults.feed2) && (
          <div style={{ marginTop: '30px' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '20px',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              padding: '30px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px' }}>
                <BarChart3 style={{ width: '24px', height: '24px', color: '#06b6d4' }} />
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Video Analysis</h3>
                  <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>People count over time</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: videoAnalysisResults.feed1 && videoAnalysisResults.feed2 ? '1fr 1fr' : '1fr', gap: '30px' }}>
                
                {/* Feed 1 Analysis */}
                {videoAnalysisResults.feed1 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#60a5fa' }}>Feed 1 Timeline</h4>
                      <button
                        onClick={() => downloadVideoResults('feed1')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#3b82f6',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Download style={{ width: '14px', height: '14px' }} />
                        Download Data
                      </button>
                    </div>
                    
                    {/* Simplified Timeline Chart */}
                    <div style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '20px'
                    }}>
                      <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#cbd5e1', margin: '0 0 16px 0' }}>
                        People Count Over Time
                      </h5>
                      
                      {videoAnalysisResults.feed1.detection_timeline && (
                        <div style={{ overflowX: 'auto' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'end', 
                            gap: '6px', 
                            minWidth: '600px', 
                            height: '140px', 
                            paddingBottom: '30px',
                            paddingTop: '20px'
                          }}>
                            {createTimelineChartData(videoAnalysisResults.feed1).map((entry, index) => (
                              <div key={index} style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                flex: 1,
                                minWidth: '20px'
                              }}>
                                {/* Bar */}
                                <div style={{
                                  width: '18px',
                                  height: `${Math.max(entry.people * 12, 4)}px`,
                                  background: entry.color,
                                  borderRadius: '2px 2px 0 0',
                                  marginBottom: '8px',
                                  position: 'relative',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                  {/* People count label above bar */}
                                  {entry.people > 0 && (
                                    <div style={{
                                      position: 'absolute',
                                      top: '-20px',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      fontSize: '11px',
                                      color: 'white',
                                      fontWeight: '700',
                                      background: 'rgba(0,0,0,0.6)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {entry.people}
                                    </div>
                                  )}
                                </div>
                                {/* Time label */}
                                <div style={{ 
                                  fontSize: '9px', 
                                  color: '#94a3b8', 
                                  textAlign: 'center',
                                  transform: 'rotate(-45deg)',
                                  transformOrigin: 'center',
                                  whiteSpace: 'nowrap',
                                  marginTop: '4px'
                                }}>
                                  {entry.time}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Legend */}
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', fontSize: '11px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
                              <span style={{ color: '#94a3b8' }}>1-4 People</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '2px' }}></div>
                              <span style={{ color: '#94a3b8' }}>5-8 People</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></div>
                              <span style={{ color: '#94a3b8' }}>9+ People</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Simple Summary Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#60a5fa' }}>
                          {videoAnalysisResults.feed1.peak_occupancy}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Peak Count</div>
                      </div>
                      <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                          {Math.floor(videoAnalysisResults.feed1.video_duration / 60)}:{(videoAnalysisResults.feed1.video_duration % 60).toFixed(0).padStart(2, '0')}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Duration</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Feed 2 Analysis */}
                {videoAnalysisResults.feed2 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#10b981' }}>Feed 2 Timeline</h4>
                      <button
                        onClick={() => downloadVideoResults('feed2')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#10b981',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Download style={{ width: '14px', height: '14px' }} />
                        Download Data
                      </button>
                    </div>
                    
                    {/* Simplified Timeline Chart */}
                    <div style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '20px'
                    }}>
                      <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#cbd5e1', margin: '0 0 16px 0' }}>
                        People Count Over Time
                      </h5>
                      
                      {videoAnalysisResults.feed2.detection_timeline && (
                        <div style={{ overflowX: 'auto' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'end', 
                            gap: '6px', 
                            minWidth: '600px', 
                            height: '140px', 
                            paddingBottom: '30px',
                            paddingTop: '20px'
                          }}>
                            {createTimelineChartData(videoAnalysisResults.feed2).map((entry, index) => (
                              <div key={index} style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                flex: 1,
                                minWidth: '20px'
                              }}>
                                {/* Bar */}
                                <div style={{
                                  width: '18px',
                                  height: `${Math.max(entry.people * 12, 4)}px`,
                                  background: entry.color,
                                  borderRadius: '2px 2px 0 0',
                                  marginBottom: '8px',
                                  position: 'relative',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                  {/* People count label above bar */}
                                  {entry.people > 0 && (
                                    <div style={{
                                      position: 'absolute',
                                      top: '-20px',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      fontSize: '11px',
                                      color: 'white',
                                      fontWeight: '700',
                                      background: 'rgba(0,0,0,0.6)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {entry.people}
                                    </div>
                                  )}
                                </div>
                                {/* Time label */}
                                <div style={{ 
                                  fontSize: '9px', 
                                  color: '#94a3b8', 
                                  textAlign: 'center',
                                  transform: 'rotate(-45deg)',
                                  transformOrigin: 'center',
                                  whiteSpace: 'nowrap',
                                  marginTop: '4px'
                                }}>
                                  {entry.time}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Legend */}
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', fontSize: '11px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
                              <span style={{ color: '#94a3b8' }}>1-4 People</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '2px' }}></div>
                              <span style={{ color: '#94a3b8' }}>5-8 People</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></div>
                              <span style={{ color: '#94a3b8' }}>9+ People</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Simple Summary Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                          {videoAnalysisResults.feed2.peak_occupancy}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Peak Count</div>
                      </div>
                      <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>
                          {Math.floor(videoAnalysisResults.feed2.video_duration / 60)}:{(videoAnalysisResults.feed2.video_duration % 60).toFixed(0).padStart(2, '0')}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Duration</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
