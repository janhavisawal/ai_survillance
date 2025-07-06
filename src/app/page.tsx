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
  
  // Heatmap data for activity tracking
  const [heatmapData, setHeatmapData] = useState<{
    feed1: { [key: string]: number };
    feed2: { [key: string]: number };
  }>({
    feed1: {},
    feed2: {}
  });
  
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
  
  // Refs for heatmap videos (duplicates)
  const heatmapVideoRef1 = useRef<HTMLVideoElement | null>(null);
  const heatmapVideoRef2 = useRef<HTMLVideoElement | null>(null);
  const heatmapCanvasRef1 = useRef<HTMLCanvasElement | null>(null);
  const heatmapCanvasRef2 = useRef<HTMLCanvasElement | null>(null);
  
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

  // Heatmap functions
  const updateHeatmapData = useCallback((detections: any[], feedId: 'feed1' | 'feed2') => {
    if (!detections.length) return;
    
    setHeatmapData(prev => {
      const newData = { ...prev };
      const feedData = { ...newData[feedId] };
      const gridSize = 20; // Smaller grid for more detail
      
      detections.forEach(detection => {
        const [x1, y1, x2, y2] = detection.bbox;
        const centerX = Math.floor((x1 + x2) / 2 / gridSize) * gridSize;
        const centerY = Math.floor((y1 + y2) / 2 / gridSize) * gridSize;
        const key = `${centerX}_${centerY}`;
        
        feedData[key] = (feedData[key] || 0) + 1;
      });
      
      newData[feedId] = feedData;
      return newData;
    });
  }, []);

  const drawAdvancedHeatmap = useCallback((feedId: 'feed1' | 'feed2') => {
    const heatmapVideoRef = feedId === 'feed1' ? heatmapVideoRef1 : heatmapVideoRef2;
    const heatmapCanvasRef = feedId === 'feed1' ? heatmapCanvasRef1 : heatmapCanvasRef2;
    
    const canvas = heatmapCanvasRef.current;
    const video = heatmapVideoRef.current;
    
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match video
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Clear canvas with dark background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const feedData = heatmapData[feedId];
    if (!feedData || Object.keys(feedData).length === 0) {
      // Show placeholder when no data
      ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('No Activity Data', canvas.width / 2, canvas.height / 2);
      return;
    }
    
    const gridSize = 20;
    const maxDensity = Math.max(...Object.values(feedData)) || 1;
    
    // Scale factors
    const scaleX = canvas.width / (video.videoWidth || 640);
    const scaleY = canvas.height / (video.videoHeight || 480);
    
    // Create gradient map for smoother transitions
    const gradientData: { [key: string]: number } = {};
    Object.entries(feedData).forEach(([key, density]) => {
      const [x, y] = key.split('_').map(Number);
      
      // Apply Gaussian blur effect for smooth heatmap
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          const nx = x + dx * gridSize;
          const ny = y + dy * gridSize;
          const newKey = `${nx}_${ny}`;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.exp(-distance * 0.8) * density;
          gradientData[newKey] = (gradientData[newKey] || 0) + influence;
        }
      }
    });
    
    // Draw heatmap with advanced visualization
    Object.entries(gradientData).forEach(([key, density]) => {
      const [x, y] = key.split('_').map(Number);
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledSize = gridSize * Math.min(scaleX, scaleY);
      
      const intensity = Math.min(density / maxDensity, 1);
      
      // Advanced color mapping with multiple gradients
      let color;
      if (intensity < 0.2) {
        const t = intensity / 0.2;
        color = `rgba(${59 + t * 40}, ${130 + t * 25}, ${246 - t * 100}, ${intensity * 0.4})`;
      } else if (intensity < 0.5) {
        const t = (intensity - 0.2) / 0.3;
        color = `rgba(${99 + t * 146}, ${155 + t * 3}, ${146 + t * 109}, ${0.4 + t * 0.3})`;
      } else if (intensity < 0.8) {
        const t = (intensity - 0.5) / 0.3;
        color = `rgba(${245}, ${158 - t * 90}, ${11 + t * 57}, ${0.7 + t * 0.1})`;
      } else {
        const t = (intensity - 0.8) / 0.2;
        color = `rgba(${245 - t * 6}, ${68}, ${68}, ${0.8 + t * 0.2})`;
      }
      
      // Create radial gradient for each point
      const gradient = ctx.createRadialGradient(
        scaledX + scaledSize/2, scaledY + scaledSize/2, 0,
        scaledX + scaledSize/2, scaledY + scaledSize/2, scaledSize * 0.8
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(scaledX + scaledSize/2, scaledY + scaledSize/2, scaledSize * 0.8, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Advanced legend with better design
    const legendX = canvas.width - 160;
    const legendY = 20;
    const legendWidth = 140;
    const legendHeight = 120;
    
    // Legend background with blur effect
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(legendX - 10, legendY - 10, legendWidth, legendHeight);
    
    // Legend border
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX - 10, legendY - 10, legendWidth, legendHeight);
    
    // Legend title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('🔥 Activity Heatmap', legendX, legendY + 15);
    
    // Gradient scale
    const gradientScale = ctx.createLinearGradient(legendX, legendY + 30, legendX, legendY + 80);
    gradientScale.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
    gradientScale.addColorStop(0.4, 'rgba(245, 158, 11, 0.8)');
    gradientScale.addColorStop(0.8, 'rgba(99, 155, 255, 0.6)');
    gradientScale.addColorStop(1, 'rgba(59, 130, 246, 0.3)');
    
    ctx.fillStyle = gradientScale;
    ctx.fillRect(legendX, legendY + 30, 20, 50);
    
    // Scale labels
    const scaleLabels = ['High', 'Med', 'Low'];
    scaleLabels.forEach((label, index) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '11px system-ui';
      ctx.fillText(label, legendX + 30, legendY + 40 + (index * 20));
    });
    
    // Statistics
    const totalActivity = Object.values(feedData).reduce((sum, val) => sum + val, 0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '10px system-ui';
    ctx.fillText(`Total: ${totalActivity}`, legendX, legendY + 95);
    
    // Mode indicator with modern styling
    const modeX = 15;
    const modeY = canvas.height - 45;
    
    // Modern pill-shaped background
    ctx.fillStyle = 'rgba(255, 107, 53, 0.95)';
    ctx.beginPath();
    ctx.roundRect(modeX, modeY, 140, 30, 15);
    ctx.fill();
    
    // Glow effect
    ctx.shadowColor = 'rgba(255, 107, 53, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(255, 107, 53, 0.95)';
    ctx.beginPath();
    ctx.roundRect(modeX, modeY, 140, 30, 15);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Mode text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('🔥 HEATMAP MODE', modeX + 70, modeY + 20);
  }, [heatmapData]);

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
          drawAdvancedVideoAnalysisResults(result.detection_timeline, feedId);
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
        
        // Update heatmap data
        updateHeatmapData(result.detections || [], feedId as 'feed1' | 'feed2');
        
        // Draw advanced bounding boxes
        drawAdvancedBoundingBoxes(feedId, result.detections || []);
        
        // Update heatmap visualization
        setTimeout(() => drawAdvancedHeatmap(feedId as 'feed1' | 'feed2'), 100);
        
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
  }, [isConnected, config, apiUrl, updateHeatmapData, drawAdvancedHeatmap]);

  // Enhanced video analysis drawing with ultra-modern, sharp bounding boxes
  const drawAdvancedVideoAnalysisResults = useCallback((timelineData: any[] = [], feedId: 'feed1' | 'feed2') => {
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
    
    // Draw each detection with ultra-modern, sharp styling
    closestEntry.detections.forEach((detection: any, index: number) => {
      const { bbox, confidence } = detection;
      if (!bbox || bbox.length !== 4) return;
      
      const [x1, y1, x2, y2] = bbox;
      const scaledX1 = x1 * scaleX;
      const scaledY1 = y1 * scaleY;
      const scaledX2 = x2 * scaleX;
      const scaledY2 = y2 * scaleY;
      
      const boxWidth = scaledX2 - scaledX1;
      const boxHeight = scaledY2 - scaledY1;
      
      // Ultra-modern sharp-edged design
      const primaryColor = confidence >= 0.8 ? '#00ff88' : confidence >= 0.6 ? '#ffd700' : '#ff4444';
      const glowColor = confidence >= 0.8 ? '#00ff8844' : confidence >= 0.6 ? '#ffd70044' : '#ff444444';
      
      // Outer glow effect
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(scaledX1, scaledY1, boxWidth, boxHeight);
      
      // Inner precision box
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(scaledX1 + 2, scaledY1 + 2, boxWidth - 4, boxHeight - 4);
      
      // Sharp corner accents (ultra-modern design)
      const cornerSize = 15;
      const accentThickness = 4;
      
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = accentThickness;
      ctx.lineCap = 'square';
      
      // Top-left corner accent
      ctx.beginPath();
      ctx.moveTo(scaledX1, scaledY1 + cornerSize);
      ctx.lineTo(scaledX1, scaledY1);
      ctx.lineTo(scaledX1 + cornerSize, scaledY1);
      ctx.stroke();
      
      // Top-right corner accent
      ctx.beginPath();
      ctx.moveTo(scaledX2 - cornerSize, scaledY1);
      ctx.lineTo(scaledX2, scaledY1);
      ctx.lineTo(scaledX2, scaledY1 + cornerSize);
      ctx.stroke();
      
      // Bottom-right corner accent
      ctx.beginPath();
      ctx.moveTo(scaledX2, scaledY2 - cornerSize);
      ctx.lineTo(scaledX2, scaledY2);
      ctx.lineTo(scaledX2 - cornerSize, scaledY2);
      ctx.stroke();
      
      // Bottom-left corner accent
      ctx.beginPath();
      ctx.moveTo(scaledX1 + cornerSize, scaledY2);
      ctx.lineTo(scaledX1, scaledY2);
      ctx.lineTo(scaledX1, scaledY2 - cornerSize);
      ctx.stroke();
      
      // Ultra-modern floating badge
      const personId = `T${index + 1}`;
      const confidenceText = `${(confidence * 100).toFixed(0)}%`;
      
      ctx.font = 'bold 11px system-ui';
      const idMetrics = ctx.measureText(personId);
      const confMetrics = ctx.measureText(confidenceText);
      const badgeWidth = Math.max(idMetrics.width, confMetrics.width) + 16;
      const badgeHeight = 36;
      
      // Floating badge position (top-left, slightly offset)
      const badgeX = scaledX1 - 2;
      const badgeY = scaledY1 - badgeHeight - 8;
      
      // Badge background with ultra-modern gradient
      const badgeGradient = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeHeight);
      badgeGradient.addColorStop(0, `${primaryColor}f0`);
      badgeGradient.addColorStop(1, `${primaryColor}d0`);
      
      // Badge glow
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;
      ctx.fillStyle = badgeGradient;
      ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
      
      // Badge sharp border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);
      
      // Badge text with sharp typography
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(personId, badgeX + badgeWidth/2, badgeY + 15);
      ctx.font = 'bold 9px system-ui';
      ctx.fillText(confidenceText, badgeX + badgeWidth/2, badgeY + 28);
      
      // Ultra-precise center crosshair
      const centerX = (scaledX1 + scaledX2) / 2;
      const centerY = (scaledY1 + scaledY2) / 2;
      
      // Crosshair with sharp lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY);
      ctx.lineTo(centerX + 10, centerY);
      ctx.moveTo(centerX, centerY - 10);
      ctx.lineTo(centerX, centerY + 10);
      ctx.stroke();
      
      // Center point
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
      ctx.fill();
      
      // Outer ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
      ctx.stroke();
    });
    
    // Ultra-modern floating header
    const headerText = `${closestEntry.detections.length} TARGETS ACQUIRED`;
    ctx.font = 'bold 14px system-ui';
    const headerMetrics = ctx.measureText(headerText);
    const headerWidth = headerMetrics.width + 24;
    const headerHeight = 32;
    
    // Header position (top-center)
    const headerX = (canvas.width - headerWidth) / 2;
    const headerY = 15;
    
    // Header background with sharp design
    const headerGradient = ctx.createLinearGradient(headerX, headerY, headerX, headerY + headerHeight);
    headerGradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    headerGradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
    
    ctx.shadowColor = 'rgba(59, 130, 246, 0.4)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = headerGradient;
    ctx.fillRect(headerX, headerY, headerWidth, headerHeight);
    
    // Header border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(headerX, headerY, headerWidth, headerHeight);
    
    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(headerText, headerX + headerWidth/2, headerY + 21);
    
    // Scanning line effect (optional animation)
    const scanLineY = (Math.sin(Date.now() * 0.005) + 1) / 2 * canvas.height;
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, scanLineY);
    ctx.lineTo(canvas.width, scanLineY);
    ctx.stroke();
  }, []);

  const drawAdvancedBoundingBoxes = (feedId: string, detections: any[]) => {
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
      
      const boxWidth = scaledX2 - scaledX1;
      const boxHeight = scaledY2 - scaledY1;
      
      // Ultra-modern live detection styling with cyberpunk aesthetics
      const primaryColor = confidence >= 0.8 ? '#00ff88' : confidence >= 0.6 ? '#00ffff' : '#ff0080';
      const glowColor = confidence >= 0.8 ? '#00ff8866' : confidence >= 0.6 ? '#00ffff66' : '#ff008066';
      
      // Outer glow effect
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(scaledX1, scaledY1, boxWidth, boxHeight);
      
      // Inner precision frame
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(scaledX1 + 2, scaledY1 + 2, boxWidth - 4, boxHeight - 4);
      
      // Sharp corner indicators with cyberpunk design
      const cornerSize = 18;
      const accentThickness = 5;
      
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = accentThickness;
      ctx.lineCap = 'square';
      
      // Enhanced corner design
      const corners = [
        { x: scaledX1, y: scaledY1, dx: 1, dy: 1 },      // top-left
        { x: scaledX2, y: scaledY1, dx: -1, dy: 1 },     // top-right
        { x: scaledX2, y: scaledY2, dx: -1, dy: -1 },    // bottom-right
        { x: scaledX1, y: scaledY2, dx: 1, dy: -1 }      // bottom-left
      ];
      
      corners.forEach(corner => {
        ctx.beginPath();
        ctx.moveTo(corner.x, corner.y + corner.dy * cornerSize);
        ctx.lineTo(corner.x, corner.y);
        ctx.lineTo(corner.x + corner.dx * cornerSize, corner.y);
        ctx.stroke();
        
        // Additional corner accent
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(corner.x, corner.y + corner.dy * (cornerSize - 4));
        ctx.lineTo(corner.x, corner.y);
        ctx.lineTo(corner.x + corner.dx * (cornerSize - 4), corner.y);
        ctx.stroke();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = accentThickness;
      });
      
      // Ultra-modern floating HUD badge
      const personId = `L${index + 1}`;
      const confidenceText = `${(confidence * 100).toFixed(0)}%`;
      
      ctx.font = 'bold 12px system-ui';
      const idMetrics = ctx.measureText(personId);
      const confMetrics = ctx.measureText(confidenceText);
      const badgeWidth = Math.max(idMetrics.width, confMetrics.width) + 18;
      const badgeHeight = 38;
      
      // Floating badge position (top-left, offset)
      const badgeX = scaledX1 - 3;
      const badgeY = scaledY1 - badgeHeight - 10;
      
      // HUD-style badge background
      const badgeGradient = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeHeight);
      badgeGradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      badgeGradient.addColorStop(0.5, `${primaryColor}40`);
      badgeGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      
      // Badge glow
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.fillStyle = badgeGradient;
      ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
      
      // Badge sharp frame
      ctx.shadowBlur = 0;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);
      
      // Inner frame
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(badgeX + 1, badgeY + 1, badgeWidth - 2, badgeHeight - 2);
      
      // Badge text with HUD styling
      ctx.fillStyle = primaryColor;
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(personId, badgeX + badgeWidth/2, badgeY + 16);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px system-ui';
      ctx.fillText(confidenceText, badgeX + badgeWidth/2, badgeY + 30);
      
      // Ultra-precise targeting crosshair
      const centerX = (scaledX1 + scaledX2) / 2;
      const centerY = (scaledY1 + scaledY2) / 2;
      
      // Main crosshair
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(centerX - 12, centerY);
      ctx.lineTo(centerX + 12, centerY);
      ctx.moveTo(centerX, centerY - 12);
      ctx.lineTo(centerX, centerY + 12);
      ctx.stroke();
      
      // Inner crosshair
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - 8, centerY);
      ctx.lineTo(centerX + 8, centerY);
      ctx.moveTo(centerX, centerY - 8);
      ctx.lineTo(centerX, centerY + 8);
      ctx.stroke();
      
      // Center targeting point
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Outer targeting ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Pulse ring effect
      const pulseRadius = 12 + Math.sin(Date.now() * 0.01) * 3;
      ctx.strokeStyle = `${primaryColor}80`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
      ctx.stroke();
    });
    
    // Ultra-modern live status header
    if (detections.length > 0) {
      const headerText = `${detections.length} LIVE TARGETS`;
      ctx.font = 'bold 15px system-ui';
      const headerMetrics = ctx.measureText(headerText);
      const headerWidth = headerMetrics.width + 60;
      const headerHeight = 34;
      
      // Header position (top-center)
      const headerX = (canvas.width - headerWidth) / 2;
      const headerY = 12;
      
      // Cyberpunk header background
      const headerGradient = ctx.createLinearGradient(headerX, headerY, headerX, headerY + headerHeight);
      headerGradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      headerGradient.addColorStop(0.5, 'rgba(0, 255, 136, 0.2)');
      headerGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      
      ctx.shadowColor = 'rgba(0, 255, 136, 0.6)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = headerGradient;
      ctx.fillRect(headerX, headerY, headerWidth, headerHeight);
      
      // Header frame
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.strokeRect(headerX, headerY, headerWidth, headerHeight);
      
      // Header text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(headerText, headerX + headerWidth/2, headerY + 22);
      
      // Live indicator with pulsing effect
      const liveX = canvas.width - 70;
      const liveY = 12;
      const liveWidth = 55;
      const liveHeight = 24;
      
      const pulseAlpha = 0.8 + Math.sin(Date.now() * 0.008) * 0.2;
      ctx.fillStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
      ctx.fillRect(liveX, liveY, liveWidth, liveHeight);
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(liveX, liveY, liveWidth, liveHeight);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('● LIVE', liveX + liveWidth/2, liveY + 16);
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
      const heatmapVideoRef = feedId === 'feed1' ? heatmapVideoRef1 : heatmapVideoRef2;
      const streamRef = feedId === 'feed1' ? streamRef1 : streamRef2;
      
      if (!videoRef.current || !heatmapVideoRef.current) return;

      const videoElement = videoRef.current;
      const heatmapVideoElement = heatmapVideoRef.current;
      
      // Set up both main and heatmap videos with the same stream
      videoElement.srcObject = stream;
      heatmapVideoElement.srcObject = stream;
      streamRef.current = stream;
      
      setFeeds(prev => ({
        ...prev,
        [feedId]: { ...prev[feedId], isStreaming: true }
      }));

      videoElement.onloadeddata = () => {
        videoElement.play()
          .then(() => {
            // Sync heatmap video
            heatmapVideoElement.play();
            if (config.realTimeMode) {
              setTimeout(() => startRealTimeDetection(feedId), 1000);
            }
          })
          .catch(e => {
            videoElement.muted = true;
            heatmapVideoElement.muted = true;
            videoElement.play().then(() => heatmapVideoElement.play());
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

  // Create advanced timeline chart data with more sophisticated visualization
  const createAdvancedTimelineChartData = (result: VideoAnalysisResult | null) => {
    if (!result?.detection_timeline) return [];
    
    const maxSamples = 50;
    const timeline = result.detection_timeline;
    const step = Math.max(1, Math.floor(timeline.length / maxSamples));
    
    return timeline
      .filter((_, index) => index % step === 0)
      .slice(0, maxSamples)
      .map((entry, index) => ({
        time: `${Math.floor(entry.timestamp / 60)}:${(entry.timestamp % 60).toFixed(0).padStart(2, '0')}`,
        timeSeconds: entry.timestamp,
        people: entry.people_count,
        confidence: entry.avg_confidence,
        color: entry.people_count > 8 ? '#ff4444' : 
               entry.people_count > 4 ? '#ffd700' : 
               entry.people_count > 0 ? '#00ff88' : '#6b7280',
        intensity: entry.people_count / (result.peak_occupancy || 1)
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
      
      // Clean up heatmap video streams
      if (streamRef1.current) {
        streamRef1.current.getTracks().forEach(track => track.stop());
      }
      if (streamRef2.current) {
        streamRef2.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
        padding: '20px 30px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield style={{ width: '32px', height: '32px', color: '#00ff88' }} />
              <h1 style={{
                fontSize: '24px',
                fontWeight: '800',
                background: 'linear-gradient(45deg, #00ff88, #00ffff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                NEURAL SURVEILLANCE MATRIX
              </h1>
            </div>
            <span style={{
              fontSize: '12px',
              background: config.realTimeMode ? 'linear-gradient(45deg, #00ff88, #00ffff)' : '#444',
              padding: '6px 14px',
              borderRadius: '15px',
              color: config.realTimeMode ? '#000' : '#fff',
              fontWeight: '700',
              boxShadow: config.realTimeMode ? '0 0 15px rgba(0, 255, 136, 0.5)' : 'none'
            }}>
              {config.realTimeMode ? '● NEURAL ACTIVE' : '○ NEURAL STANDBY'}
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
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '2px solid #333',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: '#00ff88',
                  fontSize: '14px',
                  width: '300px',
                  fontFamily: 'monospace'
                }}
              />
              <button
                onClick={testApiConnection}
                disabled={apiStatus === 'connecting'}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: apiStatus === 'connected' ? 'linear-gradient(45deg, #00ff88, #00ffff)' : 'linear-gradient(45deg, #444, #666)',
                  color: apiStatus === 'connected' ? '#000' : '#fff',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  opacity: apiStatus === 'connecting' ? 0.7 : 1,
                  boxShadow: apiStatus === 'connected' ? '0 0 20px rgba(0, 255, 136, 0.5)' : 'none'
                }}
              >
                {apiStatus === 'connecting' ? 'SYNCING...' : 
                 apiStatus === 'connected' ? 'NEURAL LINK ACTIVE' : 'ESTABLISH NEURAL LINK'}
              </button>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 22px',
              borderRadius: '15px',
              background: isConnected 
                ? 'rgba(0, 255, 136, 0.2)' 
                : 'rgba(255, 68, 68, 0.2)',
              border: isConnected 
                ? '2px solid rgba(0, 255, 136, 0.5)' 
                : '2px solid rgba(255, 68, 68, 0.5)',
              boxShadow: isConnected
                ? '0 0 25px rgba(0, 255, 136, 0.3)'
                : '0 0 25px rgba(255, 68, 68, 0.3)'
            }}>
              {isConnected ? <CheckCircle style={{ width: '18px', height: '18px', color: '#00ff88' }} /> : <XCircle style={{ width: '18px', height: '18px', color: '#ff4444' }} />}
              <span style={{ fontSize: '13px', fontWeight: '700', color: isConnected ? '#00ff88' : '#ff4444' }}>
                {isConnected ? 'MATRIX ONLINE' : 'MATRIX OFFLINE'}
              </span>
            </div>
            
            <button
              onClick={toggleRealTimeDetection}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: config.realTimeMode 
                  ? 'linear-gradient(45deg, #ff4444, #ff6666)' 
                  : 'linear-gradient(45deg, #00ff88, #00ffff)',
                color: config.realTimeMode ? '#fff' : '#000',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: config.realTimeMode
                  ? '0 0 20px rgba(255, 68, 68, 0.5)'
                  : '0 0 20px rgba(0, 255, 136, 0.5)'
              }}
            >
              {config.realTimeMode ? <Pause style={{ width: '16px', height: '16px' }} /> : <Play style={{ width: '16px', height: '16px' }} />}
              {config.realTimeMode ? 'NEURAL PAUSE' : 'NEURAL ACTIVATE'}
            </button>
          </div>
        </div>
      </header>

      <div style={{ padding: '30px' }}>
        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 350px', gap: '30px' }}>
          
          {/* Feed 1 */}
          <div style={{
            background: 'rgba(10, 10, 10, 0.8)',
            borderRadius: '20px',
            border: '2px solid rgba(0, 255, 136, 0.3)',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(0, 255, 136, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Camera style={{ width: '20px', height: '20px', color: '#00ff88' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#00ff88' }}>NEURAL FEED ALPHA</h3>
                  <span style={{
                    fontSize: '10px',
                    background: feeds.feed1.isLiveDetection ? 'linear-gradient(45deg, #00ff88, #00ffff)' : '#444',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    color: feeds.feed1.isLiveDetection ? '#000' : '#fff',
                    fontWeight: '700'
                  }}>
                    {feeds.feed1.isLiveDetection ? 'NEURAL ACTIVE' : feeds.feed1.isStreaming ? 'STREAMING' : 'OFFLINE'}
                  </span>
                </div>
                <button
                  onClick={() => toggleCamera('feed1')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: feeds.feed1.isStreaming 
                      ? 'linear-gradient(45deg, #ff4444, #ff6666)' 
                      : 'linear-gradient(45deg, #00ff88, #00ffff)',
                    color: feeds.feed1.isStreaming ? '#fff' : '#000',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {feeds.feed1.isStreaming ? <VideoOff style={{ width: '14px', height: '14px' }} /> : <Video style={{ width: '14px', height: '14px' }} />}
                  {feeds.feed1.isStreaming ? 'DISCONNECT' : 'CONNECT'}
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
                      drawAdvancedVideoAnalysisResults(videoAnalysisResults.feed1.detection_timeline, 'feed1');
                    }
                  }}
                  onSeeked={() => {
                    if (videoAnalysisResults.feed1?.detection_timeline) {
                      drawAdvancedVideoAnalysisResults(videoAnalysisResults.feed1.detection_timeline, 'feed1');
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
                  background: 'linear-gradient(135deg, #0a0a0a, #1a1a2e)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <Camera style={{ width: '48px', height: '48px', color: '#333', margin: '0 auto 16px' }} />
                    <p style={{ color: '#666', margin: 0 }}>Neural feed offline</p>
                  </div>
                </div>
              )}
              
              {/* Detection count overlay */}
              {(feeds.feed1.isStreaming || videoPreview.feed1) && (
                <div style={{ position: 'absolute', bottom: '16px', left: '16px' }}>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '2px solid #00ff88',
                    boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)'
                  }}>
                    <Users style={{ width: '16px', height: '16px', color: '#00ff88' }} />
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#00ff88' }}>
                        {videoAnalysisResults.feed1?.peak_occupancy || feeds.feed1.currentCount}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {videoPreview.feed1 ? 'PEAK NEURAL' : 'LIVE NEURAL'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Enhanced Heatmap View Below Main Video */}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <div style={{ 
                  width: '15px', 
                  height: '15px', 
                  background: 'linear-gradient(45deg, #ff6b35, #ff0080)', 
                  borderRadius: '3px',
                  boxShadow: '0 0 10px rgba(255, 107, 53, 0.5)'
                }}></div>
                <h5 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: '#ff6b35' }}>🔥 NEURAL ACTIVITY HEATMAP</h5>
              </div>
              <div style={{ 
                position: 'relative', 
                aspectRatio: '16/9', 
                background: 'rgba(0, 0, 0, 0.9)', 
                borderRadius: '12px', 
                overflow: 'hidden',
                border: '2px solid rgba(255, 107, 53, 0.3)',
                boxShadow: '0 0 25px rgba(255, 107, 53, 0.2)'
              }}>
                {videoPreview.feed1 ? (
                  <video
                    ref={uploadVideoRef1}
                    src={videoPreview.feed1}
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.2 }}
                  />
                ) : (
                  <video
                    ref={heatmapVideoRef1}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2 }}
                  />
                )}
                
                <canvas
                  ref={heatmapCanvasRef1}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                  }}
                />
              </div>
            </div>
            
            {/* Video Upload Section for Feed 1 */}
            <div style={{ padding: '20px', borderTop: '1px solid rgba(0, 255, 136, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <FileVideo style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Neural Upload Protocol</h4>
              </div>
              
              {!uploadedFiles.feed1 ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => videoUploadInputRef1.current?.click()}
                    disabled={!isConnected}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isConnected ? 'linear-gradient(45deg, #8b5cf6, #a855f7)' : '#444',
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
                    NEURAL UPLOAD
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
                        background: isProcessingVideo.feed1 || !isConnected ? '#444' : 'linear-gradient(45deg, #8b5cf6, #a855f7)',
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
                          NEURAL ANALYZE
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
                        background: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: '4px',
                        height: '6px',
                        overflow: 'hidden'
                      }}>
                        <div 
                          style={{
                            background: 'linear-gradient(45deg, #8b5cf6, #a855f7)',
                            height: '100%',
                            borderRadius: '4px',
                            transition: 'width 0.5s ease',
                            width: `${processingProgress.feed1}%`,
                            boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
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
                    <div style={{ fontSize: '10px', color: '#ff4444', marginTop: '4px' }}>
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

          {/* Feed 2 - Similar structure with different colors */}
          <div style={{
            background: 'rgba(10, 10, 10, 0.8)',
            borderRadius: '20px',
            border: '2px solid rgba(0, 255, 255, 0.3)',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(0, 255, 255, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Camera style={{ width: '20px', height: '20px', color: '#00ffff' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#00ffff' }}>NEURAL FEED BETA</h3>
                  <span style={{
                    fontSize: '10px',
                    background: feeds.feed2.isLiveDetection ? 'linear-gradient(45deg, #00ffff, #0080ff)' : '#444',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    color: feeds.feed2.isLiveDetection ? '#000' : '#fff',
                    fontWeight: '700'
                  }}>
                    {feeds.feed2.isLiveDetection ? 'NEURAL ACTIVE' : feeds.feed2.isStreaming ? 'STREAMING' : 'OFFLINE'}
                  </span>
                </div>
                <button
                  onClick={() => toggleCamera('feed2')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: feeds.feed2.isStreaming 
                      ? 'linear-gradient(45deg, #ff4444, #ff6666)' 
                      : 'linear-gradient(45deg, #00ffff, #0080ff)',
                    color: feeds.feed2.isStreaming ? '#fff' : '#000',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {feeds.feed2.isStreaming ? <VideoOff style={{ width: '14px', height: '14px' }} /> : <Video style={{ width: '14px', height: '14px' }} />}
                  {feeds.feed2.isStreaming ? 'DISCONNECT' : 'CONNECT'}
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
                      drawAdvancedVideoAnalysisResults(videoAnalysisResults.feed2.detection_timeline, 'feed2');
                    }
                  }}
                  onSeeked={() => {
                    if (videoAnalysisResults.feed2?.detection_timeline) {
                      drawAdvancedVideoAnalysisResults(videoAnalysisResults.feed2.detection_timeline, 'feed2');
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
                  background: 'linear-gradient(135deg, #0a0a0a, #1a1a2e)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <Camera style={{ width: '48px', height: '48px', color: '#333', margin: '0 auto 16px' }} />
                    <p style={{ color: '#666', margin: 0 }}>Neural feed offline</p>
                  </div>
                </div>
              )}
              
              {/* Detection count overlay */}
              {(feeds.feed2.isStreaming || videoPreview.feed2) && (
                <div style={{ position: 'absolute', bottom: '16px', left: '16px' }}>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '2px solid #00ffff',
                    boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
                  }}>
                    <Users style={{ width: '16px', height: '16px', color: '#00ffff' }} />
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#00ffff' }}>
                        {videoAnalysisResults.feed2?.peak_occupancy || feeds.feed2.currentCount}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {videoPreview.feed2 ? 'PEAK NEURAL' : 'LIVE NEURAL'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Enhanced Heatmap View Below Main Video */}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <div style={{ 
                  width: '15px', 
                  height: '15px', 
                  background: 'linear-gradient(45deg, #ff6b35, #ff0080)', 
                  borderRadius: '3px',
                  boxShadow: '0 0 10px rgba(255, 107, 53, 0.5)'
                }}></div>
                <h5 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: '#ff6b35' }}>🔥 NEURAL ACTIVITY HEATMAP</h5>
              </div>
              <div style={{ 
                position: 'relative', 
                aspectRatio: '16/9', 
                background: 'rgba(0, 0, 0, 0.9)', 
                borderRadius: '12px', 
                overflow: 'hidden',
                border: '2px solid rgba(255, 107, 53, 0.3)',
                boxShadow: '0 0 25px rgba(255, 107, 53, 0.2)'
              }}>
                {videoPreview.feed2 ? (
                  <video
                    ref={uploadVideoRef2}
                    src={videoPreview.feed2}
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.2 }}
                  />
                ) : (
                  <video
                    ref={heatmapVideoRef2}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2 }}
                  />
                )}
                
                <canvas
                  ref={heatmapCanvasRef2}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                  }}
                />
              </div>
            </div>
            
            {/* Video Upload Section for Feed 2 */}
            <div style={{ padding: '20px', borderTop: '1px solid rgba(0, 255, 255, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <FileVideo style={{ width: '16px', height: '16px', color: '#8b5cf6' }} />
                <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>Neural Upload Protocol</h4>
              </div>
              
              {!uploadedFiles.feed2 ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => videoUploadInputRef2.current?.click()}
                    disabled={!isConnected}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isConnected ? 'linear-gradient(45deg, #8b5cf6, #a855f7)' : '#444',
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
                    NEURAL UPLOAD
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
                        background: isProcessingVideo.feed2 || !isConnected ? '#444' : 'linear-gradient(45deg, #8b5cf6, #a855f7)',
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
                          NEURAL ANALYZE
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
                        background: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: '4px',
                        height: '6px',
                        overflow: 'hidden'
                      }}>
                        <div 
                          style={{
                            background: 'linear-gradient(45deg, #8b5cf6, #a855f7)',
                            height: '100%',
                            borderRadius: '4px',
                            transition: 'width 0.5s ease',
                            width: `${processingProgress.feed2}%`,
                            boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
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
                    <div style={{ fontSize: '10px', color: '#ff4444', marginTop: '4px' }}>
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
              background: 'rgba(10, 10, 10, 0.8)',
              borderRadius: '16px',
              border: '2px solid rgba(0, 255, 136, 0.3)',
              padding: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 style={{ width: '16px', height: '16px', color: '#00ff88' }} />
                Neural Analytics
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '2px solid rgba(0, 255, 136, 0.4)',
                  boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#00ff88', marginBottom: '4px' }}>
                    {feeds.feed1.currentCount + feeds.feed2.currentCount}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>ACTIVE NEURAL TARGETS</div>
                </div>
                
                <div style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '2px solid rgba(0, 255, 255, 0.4)',
                  boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#00ffff', marginBottom: '4px' }}>
                    {analytics.peakOccupancy}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>PEAK NEURAL COUNT</div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '2px solid rgba(255, 0, 128, 0.4)',
                  boxShadow: '0 0 15px rgba(255, 0, 128, 0.2)'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#ff0080', marginBottom: '4px' }}>
                    {Math.max(
                      videoAnalysisResults.feed1?.peak_occupancy || 0,
                      videoAnalysisResults.feed2?.peak_occupancy || 0
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>VIDEO NEURAL PEAK</div>
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div style={{
              background: 'rgba(10, 10, 10, 0.8)',
              borderRadius: '16px',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              padding: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings style={{ width: '16px', height: '16px', color: '#a855f7' }} />
                Neural Configuration
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}>Neural Sensitivity</label>
                    <span style={{ color: '#a855f7', fontSize: '14px', fontWeight: '700' }}>{(config.confidence * 100).toFixed(0)}%</span>
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
                      background: 'linear-gradient(to right, #333, #a855f7)',
                      borderRadius: '3px',
                      appearance: 'none',
                      cursor: 'pointer',
                      accentColor: '#a855f7'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config.showBoundingBoxes}
                      onChange={(e) => setConfig({...config, showBoundingBoxes: e.target.checked})}
                      style={{ accentColor: '#a855f7' }}
                    />
                    Neural Target Boxes
                  </label>
                </div>
                
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config.alertEnabled}
                      onChange={(e) => setConfig({...config, alertEnabled: e.target.checked})}
                      style={{ accentColor: '#a855f7' }}
                    />
                    Neural Alerts
                  </label>
                </div>
                
                {/* Heatmap controls */}
                <div style={{ 
                  padding: '12px', 
                  background: 'rgba(0, 0, 0, 0.6)', 
                  borderRadius: '8px',
                  border: '2px solid rgba(255, 107, 53, 0.4)',
                  boxShadow: '0 0 15px rgba(255, 107, 53, 0.2)'
                }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#ff6b35', margin: '0 0 8px 0' }}>🔥 Neural Heatmap Control</h4>
                  
                  <button
                    onClick={() => {
                      setHeatmapData({ feed1: {}, feed2: {} });
                      console.log('Neural heatmap data purged');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(45deg, #666, #888)',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginBottom: '8px'
                    }}
                  >
                    PURGE NEURAL DATA
                  </button>
                  
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    Neural heatmaps visualize activity density. High-activity zones glow red.
                  </div>
                </div>
              </div>
            </div>

            {/* System Status & Alerts */}
            <div style={{
              background: 'rgba(10, 10, 10, 0.8)',
              borderRadius: '16px',
              border: '2px solid rgba(255, 68, 68, 0.3)',
              padding: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle style={{ width: '16px', height: '16px', color: '#ff4444' }} />
                Neural System Status
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {alerts && alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <CheckCircle style={{ width: '32px', height: '32px', color: '#00ff88', margin: '0 auto 12px' }} />
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>All neural systems operational</p>
                  </div>
                ) : (
                  (alerts || []).map((alert) => (
                    <div
                      key={alert.id}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${
                          alert.severity === 'high' 
                            ? '#ff4444' 
                            : alert.severity === 'medium'
                            ? '#ffd700'
                            : '#00ff88'
                        }`,
                        background: 'rgba(0, 0, 0, 0.6)',
                        border: '1px solid rgba(71, 85, 105, 0.3)',
                        boxShadow: `0 0 10px ${
                          alert.severity === 'high' 
                            ? 'rgba(255, 68, 68, 0.3)' 
                            : alert.severity === 'medium'
                            ? 'rgba(255, 215, 0, 0.3)'
                            : 'rgba(0, 255, 136, 0.3)'
                        }`
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

        {/* Enhanced Video Analysis Section with Advanced Charts */}
        {(videoAnalysisResults.feed1 || videoAnalysisResults.feed2) && (
          <div style={{ marginTop: '30px' }}>
            <div style={{
              background: 'rgba(10, 10, 10, 0.8)',
              borderRadius: '20px',
              border: '2px solid rgba(0, 255, 136, 0.3)',
              padding: '30px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px' }}>
                <BarChart3 style={{ width: '24px', height: '24px', color: '#00ff88' }} />
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#00ff88' }}>Neural Pattern Analysis</h3>
                  <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Advanced crowd dynamics visualization</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: videoAnalysisResults.feed1 && videoAnalysisResults.feed2 ? '1fr 1fr' : '1fr', gap: '30px' }}>
                
                {/* Feed 1 Analysis */}
                {videoAnalysisResults.feed1 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#00ff88' }}>Neural Feed Alpha Analytics</h4>
                      <button
                        onClick={() => downloadVideoResults('feed1')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(45deg, #00ff88, #00ffff)',
                          color: '#000',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Download style={{ width: '14px', height: '14px' }} />
                        Export Neural Data
                      </button>
                    </div>
                    
                    {/* Advanced Crowd Flow Analysis */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '20px',
                      border: '2px solid rgba(0, 255, 136, 0.2)'
                    }}>
                      <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#00ff88', margin: '0 0 20px 0' }}>
                        Neural Flow Dynamics
                      </h5>
                      
                      {videoAnalysisResults.feed1.detection_timeline && (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                          
                          {/* Advanced Area Chart Visualization */}
                          <div>
                            <h6 style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0' }}>Crowd Density Over Time</h6>
                            <div style={{ 
                              position: 'relative',
                              height: '150px', 
                              background: 'rgba(0, 0, 0, 0.8)',
                              borderRadius: '8px',
                              padding: '16px',
                              border: '1px solid rgba(0, 255, 136, 0.3)'
                            }}>
                              <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                                {/* Grid lines */}
                                {[0, 25, 50, 75, 100].map(y => (
                                  <line 
                                    key={y} 
                                    x1="0" 
                                    y1={`${y}%`} 
                                    x2="100%" 
                                    y2={`${y}%`} 
                                    stroke="rgba(0, 255, 136, 0.1)" 
                                    strokeWidth="1"
                                  />
                                ))}
                                
                                {/* Area fill */}
                                <defs>
                                  <linearGradient id="areaGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="rgba(0, 255, 136, 0.3)" />
                                    <stop offset="100%" stopColor="rgba(0, 255, 136, 0.05)" />
                                  </linearGradient>
                                </defs>
                                
                                <polygon
                                  fill="url(#areaGradient1)"
                                  points={
                                    createAdvancedTimelineChartData(videoAnalysisResults.feed1)
                                      .map((entry, index, arr) => {
                                        const x = (index / (arr.length - 1)) * 100;
                                        const y = 100 - ((entry.people / Math.max(...arr.map(e => e.people), 1)) * 80);
                                        return `${x},${y}`;
                                      })
                                      .concat(['100,100', '0,100'])
                                      .join(' ')
                                  }
                                />
                                
                                {/* Main line */}
                                <polyline
                                  fill="none"
                                  stroke="#00ff88"
                                  strokeWidth="3"
                                  points={
                                    createAdvancedTimelineChartData(videoAnalysisResults.feed1)
                                      .map((entry, index, arr) => {
                                        const x = (index / (arr.length - 1)) * 100;
                                        const y = 100 - ((entry.people / Math.max(...arr.map(e => e.people), 1)) * 80);
                                        return `${x},${y}`;
                                      })
                                      .join(' ')
                                  }
                                />
                                
                                {/* Enhanced data points */}
                                {createAdvancedTimelineChartData(videoAnalysisResults.feed1).map((entry, index, arr) => {
                                  const x = (index / (arr.length - 1)) * 100;
                                  const y = 100 - ((entry.people / Math.max(...arr.map(e => e.people), 1)) * 80);
                                  return (
                                    <g key={index}>
                                      <circle
                                        cx={`${x}%`}
                                        cy={`${y}%`}
                                        r="4"
                                        fill={entry.color}
                                        stroke="white"
                                        strokeWidth="2"
                                      />
                                      <circle
                                        cx={`${x}%`}
                                        cy={`${y}%`}
                                        r="8"
                                        fill="none"
                                        stroke={entry.color}
                                        strokeWidth="1"
                                        opacity="0.5"
                                      />
                                    </g>
                                  );
                                })}
                              </svg>
                              
                              {/* Enhanced Y-axis labels */}
                              <div style={{ position: 'absolute', left: '-15px', top: '0', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '10px', color: '#00ff88', fontWeight: '600' }}>
                                <span>{videoAnalysisResults.feed1.peak_occupancy}</span>
                                <span>{Math.floor(videoAnalysisResults.feed1.peak_occupancy * 0.75)}</span>
                                <span>{Math.floor(videoAnalysisResults.feed1.peak_occupancy * 0.5)}</span>
                                <span>{Math.floor(videoAnalysisResults.feed1.peak_occupancy * 0.25)}</span>
                                <span>0</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Enhanced Activity Patterns */}
                          <div>
                            <h6 style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0' }}>Crowd Behavior Patterns</h6>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              
                              {/* Critical Activity */}
                              <div style={{ 
                                background: 'linear-gradient(135deg, rgba(255, 68, 68, 0.15), rgba(255, 68, 68, 0.05))', 
                                border: '2px solid rgba(255, 68, 68, 0.4)',
                                borderRadius: '8px', 
                                padding: '10px',
                                boxShadow: '0 0 15px rgba(255, 68, 68, 0.2)'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#ff4444' }}>🚨 Critical Density</div>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#ff4444' }}>
                                  {videoAnalysisResults.feed1.peak_occupancy} people
                                </div>
                                <div style={{ fontSize: '9px', color: '#fca5a5' }}>
                                  at {(() => {
                                    const peakFrame = videoAnalysisResults.feed1.detection_timeline?.find(entry => 
                                      entry.people_count === videoAnalysisResults.feed1.peak_occupancy
                                    );
                                    const time = peakFrame?.timestamp || 0;
                                    return `${Math.floor(time / 60)}:${(time % 60).toFixed(0).padStart(2, '0')}`;
                                  })()}
                                </div>
                              </div>
                              
                              {/* Flow Rate */}
                              <div style={{ 
                                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05))', 
                                border: '2px solid rgba(255, 215, 0, 0.4)',
                                borderRadius: '8px', 
                                padding: '10px',
                                boxShadow: '0 0 15px rgba(255, 215, 0, 0.2)'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#ffd700' }}>⚡ Average Flow</div>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffd700' }}>
                                  {videoAnalysisResults.feed1.detection_timeline ? 
                                    (videoAnalysisResults.feed1.detection_timeline.reduce((sum, entry) => sum + entry.people_count, 0) / 
                                     videoAnalysisResults.feed1.detection_timeline.length).toFixed(1) : '0'} people
                                </div>
                                <div style={{ fontSize: '9px', color: '#fbbf24' }}>continuous monitoring</div>
                              </div>
                              
                              {/* Surge Events */}
                              <div style={{ 
                                background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 255, 136, 0.05))', 
                                border: '2px solid rgba(0, 255, 136, 0.4)',
                                borderRadius: '8px', 
                                padding: '10px',
                                boxShadow: '0 0 15px rgba(0, 255, 136, 0.2)'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#00ff88' }}>📊 Surge Events</div>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#00ff88' }}>
                                  {videoAnalysisResults.feed1.detection_timeline ? 
                                    videoAnalysisResults.feed1.detection_timeline.filter(entry => 
                                      entry.people_count > (videoAnalysisResults.feed1.peak_occupancy * 0.7)
                                    ).length : 0}
                                </div>
                                <div style={{ fontSize: '9px', color: '#6ee7b7' }}>high-density moments</div>
                              </div>
                              
                            </div>
                          </div>
                          
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced Summary Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.05))',
                        borderRadius: '10px',
                        padding: '16px',
                        textAlign: 'center',
                        border: '2px solid rgba(0, 255, 136, 0.3)',
                        boxShadow: '0 0 20px rgba(0, 255, 136, 0.15)'
                      }}>
                        <div style={{ fontSize: '22px', fontWeight: '700', color: '#00ff88' }}>
                          {videoAnalysisResults.feed1.peak_occupancy}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Neural Peak</div>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(0, 255, 255, 0.05))',
                        borderRadius: '10px',
                        padding: '16px',
                        textAlign: 'center',
                        border: '2px solid rgba(0, 255, 255, 0.3)',
                        boxShadow: '0 0 20px rgba(0, 255, 255, 0.15)'
                      }}>
                        <div style={{ fontSize: '22px', fontWeight: '700', color: '#00ffff' }}>
                          {Math.floor(videoAnalysisResults.feed1.video_duration / 60)}:{(videoAnalysisResults.feed1.video_duration % 60).toFixed(0).padStart(2, '0')}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Analysis Duration</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Feed 2 Analysis */}
                {videoAnalysisResults.feed2 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#00ffff' }}>Neural Feed Beta Analytics</h4>
                      <button
                        onClick={() => downloadVideoResults('feed2')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(45deg, #00ffff, #0080ff)',
                          color: '#000',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Download style={{ width: '14px', height: '14px' }} />
                        Export Neural Data
                      </button>
                    </div>
                    
                    {/* Advanced Crowd Flow Analysis */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '20px',
                      border: '2px solid rgba(0, 255, 255, 0.2)'
                    }}>
                      <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#00ffff', margin: '0 0 20px 0' }}>
                        Neural Flow Dynamics
                      </h5>
                      
                      {videoAnalysisResults.feed2.detection_timeline && (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                          
                          {/* Advanced Area Chart Visualization */}
                          <div>
                            <h6 style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0' }}>Crowd Density Over Time</h6>
                            <div style={{ 
                              position: 'relative',
                              height: '150px', 
                              background: 'rgba(0, 0, 0, 0.8)',
                              borderRadius: '8px',
                              padding: '16px',
                              border: '1px solid rgba(0, 255, 255, 0.3)'
                            }}>
                              <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                                {/* Grid lines */}
                                {[0, 25, 50, 75, 100].map(y => (
                                  <line 
                                    key={y} 
                                    x1="0" 
                                    y1={`${y}%`} 
                                    x2="100%" 
                                    y2={`${y}%`} 
                                    stroke="rgba(0, 255, 255, 0.1)" 
                                    strokeWidth="1"
                                  />
                                ))}
                                
                                {/* Area fill */}
                                <defs>
                                  <linearGradient id="areaGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="rgba(0, 255, 255, 0.3)" />
                                    <stop offset="100%" stopColor="rgba(0, 255, 255, 0.05)" />
                                  </linearGradient>
                                </defs>
                                
                                <polygon
                                  fill="url(#areaGradient2)"
                                  points={
                                    createAdvancedTimelineChartData(videoAnalysisResults.feed2)
                                      .map((entry, index, arr) => {
                                        const x = (index / (arr.length - 1)) * 100;
                                        const y = 100 - ((entry.people / Math.max(...arr.map(e => e.people), 1)) * 80);
                                        return `${x},${y}`;
                                      })
                                      .concat(['100,100', '0,100'])
                                      .join(' ')
                                  }
                                />
                                
                                {/* Main line */}
                                <polyline
                                  fill="none"
                                  stroke="#00ffff"
                                  strokeWidth="3"
                                  points={
                                    createAdvancedTimelineChartData(videoAnalysisResults.feed2)
                                      .map((entry, index, arr) => {
                                        const x = (index / (arr.length - 1)) * 100;
                                        const y = 100 - ((entry.people / Math.max(...arr.map(e => e.people), 1)) * 80);
                                        return `${x},${y}`;
                                      })
                                      .join(' ')
                                  }
                                />
                                
                                {/* Enhanced data points */}
                                {createAdvancedTimelineChartData(videoAnalysisResults.feed2).map((entry, index, arr) => {
                                  const x = (index / (arr.length - 1)) * 100;
                                  const y = 100 - ((entry.people / Math.max(...arr.map(e => e.people), 1)) * 80);
                                  return (
                                    <g key={index}>
                                      <circle
                                        cx={`${x}%`}
                                        cy={`${y}%`}
                                        r="4"
                                        fill={entry.color}
                                        stroke="white"
                                        strokeWidth="2"
                                      />
                                      <circle
                                        cx={`${x}%`}
                                        cy={`${y}%`}
                                        r="8"
                                        fill="none"
                                        stroke={entry.color}
                                        strokeWidth="1"
                                        opacity="0.5"
                                      />
                                    </g>
                                  );
                                })}
                              </svg>
                              
                              {/* Enhanced Y-axis labels */}
                              <div style={{ position: 'absolute', left: '-15px', top: '0', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '10px', color: '#00ffff', fontWeight: '600' }}>
                                <span>{videoAnalysisResults.feed2.peak_occupancy}</span>
                                <span>{Math.floor(videoAnalysisResults.feed2.peak_occupancy * 0.75)}</span>
                                <span>{Math.floor(videoAnalysisResults.feed2.peak_occupancy * 0.5)}</span>
                                <span>{Math.floor(videoAnalysisResults.feed2.peak_occupancy * 0.25)}</span>
                                <span>0</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Enhanced Activity Patterns */}
                          <div>
                            <h6 style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0' }}>Crowd Behavior Patterns</h6>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              
                              {/* Critical Activity */}
                              <div style={{ 
                                background: 'linear-gradient(135deg, rgba(255, 68, 68, 0.15), rgba(255, 68, 68, 0.05))', 
                                border: '2px solid rgba(255, 68, 68, 0.4)',
                                borderRadius: '8px', 
                                padding: '10px',
                                boxShadow: '0 0 15px rgba(255, 68, 68, 0.2)'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#ff4444' }}>🚨 Critical Density</div>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#ff4444' }}>
                                  {videoAnalysisResults.feed2.peak_occupancy} people
                                </div>
                                <div style={{ fontSize: '9px', color: '#fca5a5' }}>
                                  at {(() => {
                                    const peakFrame = videoAnalysisResults.feed2.detection_timeline?.find(entry => 
                                      entry.people_count === videoAnalysisResults.feed2.peak_occupancy
                                    );
                                    const time = peakFrame?.timestamp || 0;
                                    return `${Math.floor(time / 60)}:${(time % 60).toFixed(0).padStart(2, '0')}`;
                                  })()}
                                </div>
                              </div>
                              
                              {/* Flow Rate */}
                              <div style={{ 
                                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05))', 
                                border: '2px solid rgba(255, 215, 0, 0.4)',
                                borderRadius: '8px', 
                                padding: '10px',
                                boxShadow: '0 0 15px rgba(255, 215, 0, 0.2)'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#ffd700' }}>⚡ Average Flow</div>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffd700' }}>
                                  {videoAnalysisResults.feed2.detection_timeline ? 
                                    (videoAnalysisResults.feed2.detection_timeline.reduce((sum, entry) => sum + entry.people_count, 0) / 
                                     videoAnalysisResults.feed2.detection_timeline.length).toFixed(1) : '0'} people
                                </div>
                                <div style={{ fontSize: '9px', color: '#fbbf24' }}>continuous monitoring</div>
                              </div>
                              
                              {/* Surge Events */}
                              <div style={{ 
                                background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.15), rgba(0, 255, 255, 0.05))', 
                                border: '2px solid rgba(0, 255, 255, 0.4)',
                                borderRadius: '8px', 
                                padding: '10px',
                                boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#00ffff' }}>📊 Surge Events</div>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#00ffff' }}>
                                  {videoAnalysisResults.feed2.detection_timeline ? 
                                    videoAnalysisResults.feed2.detection_timeline.filter(entry => 
                                      entry.people_count > (videoAnalysisResults.feed2.peak_occupancy * 0.7)
                                    ).length : 0}
                                </div>
                                <div style={{ fontSize: '9px', color: '#6ee7b7' }}>high-density moments</div>
                              </div>
                              
                            </div>
                          </div>
                          
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced Summary Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(0, 255, 255, 0.05))',
                        borderRadius: '10px',
                        padding: '16px',
                        textAlign: 'center',
                        border: '2px solid rgba(0, 255, 255, 0.3)',
                        boxShadow: '0 0 20px rgba(0, 255, 255, 0.15)'
                      }}>
                        <div style={{ fontSize: '22px', fontWeight: '700', color: '#00ffff' }}>
                          {videoAnalysisResults.feed2.peak_occupancy}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Neural Peak</div>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(255, 0, 128, 0.2), rgba(255, 0, 128, 0.05))',
                        borderRadius: '10px',
                        padding: '16px',
                        textAlign: 'center',
                        border: '2px solid rgba(255, 0, 128, 0.3)',
                        boxShadow: '0 0 20px rgba(255, 0, 128, 0.15)'
                      }}>
                        <div style={{ fontSize: '22px', fontWeight: '700', color: '#ff0080' }}>
                          {Math.floor(videoAnalysisResults.feed2.video_duration / 60)}:{(videoAnalysisResults.feed2.video_duration % 60).toFixed(0).padStart(2, '0')}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Analysis Duration</div>
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
        
        /* Custom scrollbar for cyberpunk theme */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #00ff88, #00ffff);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #00ffff, #ff0080);
        }
        
        /* Enhanced input styling */
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        
        input[type="range"]::-webkit-slider-track {
          background: rgba(0, 0, 0, 0.5);
          height: 6px;
          border-radius: 3px;
          border: 1px solid rgba(0, 255, 136, 0.3);
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #00ff88, #00ffff);
          cursor: pointer;
          border: 2px solid #000;
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }
        
        input[type="range"]::-moz-range-track {
          background: rgba(0, 0, 0, 0.5);
          height: 6px;
          border-radius: 3px;
          border: 1px solid rgba(0, 255, 136, 0.3);
        }
        
        input[type="range"]::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #00ff88, #00ffff);
          cursor: pointer;
          border: 2px solid #000;
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }
        
        /* Enhanced checkbox styling */
        input[type="checkbox"] {
          appearance: none;
          width: 16px;
          height: 16px;
          border: 2px solid #00ff88;
          border-radius: 3px;
          background: rgba(0, 0, 0, 0.5);
          cursor: pointer;
          position: relative;
        }
        
        input[type="checkbox"]:checked {
          background: linear-gradient(45deg, #00ff88, #00ffff);
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }
        
        input[type="checkbox"]:checked::after {
          content: '✓';
          position: absolute;
          color: #000;
          font-size: 12px;
          font-weight: bold;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }
      `}</style>
    </div>
  );
}
