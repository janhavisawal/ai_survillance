import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Video, VideoOff, Play, Pause, Upload, Settings, Activity, 
  Wifi, WifiOff, AlertTriangle, Users, Clock, Camera, 
  BarChart3, Maximize2, RefreshCw, Eye, Target, Bell, 
  Monitor, Cpu, HardDrive, Signal, CheckCircle, XCircle,
  FileVideo, Zap, TrendingUp, Database
} from 'lucide-react';

export default function VideoAnalyticsDashboard() {
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
      analysisResult: null
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
      analysisResult: null
    }
  });
  
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
    showBoundingBoxes: true
  });

  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);
  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);
  const canvasRef1 = useRef(null);
  const canvasRef2 = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const drawBoundingBoxes = (canvasRef, videoRef, detections, feedId) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || !detections) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || video.offsetWidth;
    canvas.height = video.videoHeight || video.offsetHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!config.showBoundingBoxes) return;
    
    detections.forEach((detection, index) => {
      const { bbox, confidence } = detection;
      const [x1, y1, x2, y2] = bbox;
      
      const scaleX = canvas.width / (video.videoWidth || canvas.width);
      const scaleY = canvas.height / (video.videoHeight || canvas.height);
      
      const scaledX1 = x1 * scaleX;
      const scaledY1 = y1 * scaleY;
      const scaledX2 = x2 * scaleX;
      const scaledY2 = y2 * scaleY;
      
      let color, thickness;
      if (confidence >= 0.7) {
        color = '#10b981';
        thickness = 3;
      } else if (confidence >= 0.4) {
        color = '#fbbf24';
        thickness = 2;
      } else {
        color = '#ef4444';
        thickness = 2;
      }
      
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.strokeRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1);
      
      ctx.fillStyle = color;
      ctx.font = '14px Arial';
      ctx.fontWeight = 'bold';
      const text = `${(confidence * 100).toFixed(1)}%`;
      const textWidth = ctx.measureText(text).width;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(scaledX1, scaledY1 - 25, textWidth + 8, 20);
      
      ctx.fillStyle = color;
      ctx.fillText(text, scaledX1 + 4, scaledY1 - 8);
      
      const centerX = (scaledX1 + scaledX2) / 2;
      const centerY = (scaledY1 + scaledY2) / 2;
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    if (detections.length > 0) {
      const summaryText = `${detections.length} People Detected`;
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(10, 10, ctx.measureText(summaryText).width + 20, 30);
      ctx.fillStyle = '#60a5fa';
      ctx.fillText(summaryText, 20, 30);
    }
  };

  const handleVideoTimeUpdate = (feedId) => {
    const feed = feeds[feedId];
    if (!feed.analysisResult || !feed.analysisResult.detection_timeline) return;
    
    const videoRef = feedId === 'feed1' ? videoRef1 : videoRef2;
    const canvasRef = feedId === 'feed1' ? canvasRef1 : canvasRef2;
    const video = videoRef.current;
    
    if (!video) return;
    
    const currentTime = video.currentTime;
    const timeline = feed.analysisResult.detection_timeline;
    let closestDetection = null;
    let minTimeDiff = Infinity;
    
    timeline.forEach(entry => {
      const timeDiff = Math.abs(entry.timestamp - currentTime);
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestDetection = entry;
      }
    });
    
    if (closestDetection && closestDetection.people_count > 0) {
      const mockDetections = [];
      for (let i = 0; i < closestDetection.people_count; i++) {
        const x1 = Math.random() * (video.videoWidth * 0.7);
        const y1 = Math.random() * (video.videoHeight * 0.7);
        const width = 40 + Math.random() * 80;
        const height = 80 + Math.random() * 120;
        
        mockDetections.push({
          bbox: [x1, y1, x1 + width, y1 + height],
          confidence: 0.3 + Math.random() * 0.7,
          center: [x1 + width/2, y1 + height/2]
        });
      }
      
      drawBoundingBoxes(canvasRef, videoRef, mockDetections, feedId);
    } else {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const testApiConnection = async () => {
    if (!apiUrl.trim()) {
      alert('Please enter your Google Colab API URL');
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
          message: `Connected to Ultra-Sensitive API (${data.detector_type})`,
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
        message: 'Failed to connect to API. Check your Colab URL.',
        time: new Date().toLocaleTimeString(),
        severity: 'high'
      }, ...prev.slice(0, 4)]);
    }
  };

  const processVideo = async (file, feedId) => {
    if (!isConnected) {
      alert('Please connect to your API first!');
      return;
    }

    setFeeds(prev => ({
      ...prev,
      [feedId]: {
        ...prev[feedId],
        isProcessing: true,
        videoFile: file,
        processedFrames: 0,
        analysisComplete: false,
        analysisResult: null
      }
    }));

    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    
    video.onloadedmetadata = async () => {
      const duration = video.duration;
      const fps = 30;
      const totalFrames = Math.floor(duration * fps);
      
      setFeeds(prev => ({
        ...prev,
        [feedId]: { ...prev[feedId], totalFrames }
      }));

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('confidence', config.confidence.toString());
        formData.append('feed_id', feedId);

        const response = await fetch(`${apiUrl}/detect/video/analyze`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          
          updateAnalyticsFromResult(result, feedId);
          
          setFeeds(prev => ({
            ...prev,
            [feedId]: {
              ...prev[feedId],
              isProcessing: false,
              analysisComplete: true,
              currentCount: result.peak_occupancy || 0,
              analysisResult: result
            }
          }));

          setAlerts(prev => [{
            id: Date.now(),
            type: 'success',
            message: `Video analysis complete for ${feedId}. Found ${result.total_detections || 0} detections.`,
            time: new Date().toLocaleTimeString(),
            severity: 'low'
          }, ...prev.slice(0, 4)]);

        } else {
          throw new Error('Video processing failed');
        }
      } catch (error) {
        console.error('Video processing error:', error);
        setFeeds(prev => ({
          ...prev,
          [feedId]: { ...prev[feedId], isProcessing: false }
        }));
        
        setAlerts(prev => [{
          id: Date.now(),
          type: 'error',
          message: `Video processing failed for ${feedId}`,
          time: new Date().toLocaleTimeString(),
          severity: 'high'
        }, ...prev.slice(0, 4)]);
      }
    };
  };

  const updateAnalyticsFromResult = (result, feedId) => {
    setAnalytics(prev => {
      const newHistory = [...prev.detectionHistory];
      
      if (result.detection_timeline) {
        result.detection_timeline.forEach(point => {
          newHistory.push({
            timestamp: point.timestamp,
            count: point.people_count,
            feedId: feedId,
            confidence: point.avg_confidence
          });
        });
      }

      const confidenceDistribution = { high: 0, medium: 0, low: 0 };
      if (result.confidence_distribution) {
        confidenceDistribution.high = result.confidence_distribution.high || 0;
        confidenceDistribution.medium = result.confidence_distribution.medium || 0;
        confidenceDistribution.low = result.confidence_distribution.low || 0;
      }

      return {
        totalDetections: prev.totalDetections + (result.total_detections || 0),
        avgConfidence: result.avg_confidence || prev.avgConfidence,
        peakOccupancy: Math.max(prev.peakOccupancy, result.peak_occupancy || 0),
        detectionHistory: newHistory.slice(-100),
        confidenceDistribution,
        processingStats: {
          avgProcessingTime: result.processing_stats?.avg_processing_time || prev.processingStats.avgProcessingTime,
          totalFramesProcessed: prev.processingStats.totalFramesProcessed + (result.frames_processed || 0),
          fps: result.processing_stats?.processing_fps || prev.processingStats.fps
        }
      };
    });
  };

  const handleVideoUpload = (event, feedId) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please upload a valid video file');
      return;
    }

    processVideo(file, feedId);
  };

  const playVideo = (feedId) => {
    const videoRef = feedId === 'feed1' ? videoRef1 : videoRef2;
    const feed = feeds[feedId];
    
    if (feed.videoFile && videoRef.current) {
      videoRef.current.src = URL.createObjectURL(feed.videoFile);
      videoRef.current.play();
      
      setFeeds(prev => ({
        ...prev,
        [feedId]: { ...prev[feedId], isStreaming: true }
      }));
    }
  };

  const pauseVideo = (feedId) => {
    const videoRef = feedId === 'feed1' ? videoRef1 : videoRef2;
    
    if (videoRef.current) {
      videoRef.current.pause();
      
      setFeeds(prev => ({
        ...prev,
        [feedId]: { ...prev[feedId], isStreaming: false }
      }));
    }
  };

  const toggleVideo = (feedId) => {
    if (feeds[feedId].isStreaming) {
      pauseVideo(feedId);
    } else {
      playVideo(feedId);
    }
  };

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
                    VIDEO ANALYTICS
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                    <span style={{
                      fontSize: '14px',
                      background: 'linear-gradient(45deg, #3b82f6, #06b6d4)',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      color: 'white',
                      fontWeight: '600',
                      boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4)'
                    }}>
                      Ultra-Sensitive AI
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Enter your Google Colab API URL"
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
                      {isConnected ? 'Ultra-sensitive ready' : 'Connect to Colab'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Video Feeds Section - Full Width, Stacked Vertically */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    padding: '12px',
                    background: 'linear-gradient(45deg, #3b82f6, #06b6d4)',
                    borderRadius: '16px'
                  }}>
                    <FileVideo style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'white', margin: 0 }}>Video Analysis</h2>
                    <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Upload videos for AI-powered analysis</p>
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
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
                            background: feeds.feed1.analysisComplete ? '#10b981' : feeds.feed1.isProcessing ? '#fbbf24' : '#6b7280',
                            borderRadius: '50%',
                            animation: feeds.feed1.isProcessing ? 'pulse 1s infinite' : 'none'
                          }}></div>
                        </div>
                        <div>
                          <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: 0 }}>Video Feed 1</h3>
                          <span style={{
                            fontSize: '12px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#93c5fd',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            border: '1px solid rgba(59, 130, 246, 0.3)'
                          }}>
                            {feeds.feed1.isProcessing ? 'PROCESSING...' : 
                             feeds.feed1.analysisComplete ? 'ANALYSIS COMPLETE' : 'READY'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => fileInputRef1.current && fileInputRef1.current.click()}
                          disabled={feeds.feed1.isProcessing}
                          style={{
                            padding: '12px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            background: '#3b82f6',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            opacity: feeds.feed1.isProcessing ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <Upload style={{ width: '16px', height: '16px' }} />
                          Upload Video
                        </button>
                        {feeds.feed1.videoFile && (
                          <button
                            onClick={() => toggleVideo('feed1')}
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
                                <Pause style={{ width: '16px', height: '16px' }} />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play style={{ width: '16px', height: '16px' }} />
                                Play
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <input
                      ref={fileInputRef1}
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleVideoUpload(e, 'feed1')}
                      style={{ display: 'none' }}
                    />
                    
                    <div style={{
                      position: 'relative',
                      background: 'black',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(148, 163, 184, 0.1)',
                      aspectRatio: '16/9',
                      width: '100%',
                      maxHeight: '500px'
                    }}>
                      {feeds.feed1.videoFile ? (
                        <>
                          <video
                            ref={videoRef1}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            controls
                            onTimeUpdate={() => handleVideoTimeUpdate('feed1')}
                            onLoadedData={() => handleVideoTimeUpdate('feed1')}
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
                      ) : (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #0f172a, #1e293b, #0f172a)'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <FileVideo style={{ width: '80px', height: '80px', color: '#475569', margin: '0 auto 24px' }} />
                            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#cbd5e1', margin: '0 0 8px 0' }}>Upload Video</h3>
                            <p style={{ color: '#64748b', margin: 0 }}>Select a video file for Feed 1 analysis</p>
                          </div>
                        </div>
                      )}
                      
                      {feeds.feed1.isProcessing && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0, 0, 0, 0.8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: '16px'
                        }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            border: '4px solid #475569',
                            borderTop: '4px solid #3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
                            Processing Video...
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                            {feeds.feed1.processedFrames} / {feeds.feed1.totalFrames} frames
                          </div>
                        </div>
                      )}
                      
                      {feeds.feed1.analysisComplete && (
                        <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(16, 185, 129, 0.9)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '16px',
                            fontSize: '14px',
                            fontWeight: '700'
                          }}>
                            <CheckCircle style={{ width: '16px', height: '16px' }} />
                            ANALYZED
                          </div>
                        </div>
                      )}
                      
                      {feeds.feed1.analysisComplete && (
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
                            background: feeds.feed2.analysisComplete ? '#10b981' : feeds.feed2.isProcessing ? '#fbbf24' : '#6b7280',
                            borderRadius: '50%',
                            animation: feeds.feed2.isProcessing ? 'pulse 1s infinite' : 'none'
                          }}></div>
                        </div>
                        <div>
                          <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: 0 }}>Video Feed 2</h3>
                          <span style={{
                            fontSize: '12px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#6ee7b7',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}>
                            {feeds.feed2.isProcessing ? 'PROCESSING...' : 
                             feeds.feed2.analysisComplete ? 'ANALYSIS COMPLETE' : 'READY'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => fileInputRef2.current && fileInputRef2.current.click()}
                          disabled={feeds.feed2.isProcessing}
                          style={{
                            padding: '12px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            background: '#10b981',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            opacity: feeds.feed2.isProcessing ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <Upload style={{ width: '16px', height: '16px' }} />
                          Upload Video
                        </button>
                        {feeds.feed2.videoFile && (
                          <button
                            onClick={() => toggleVideo('feed2')}
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
                                <Pause style={{ width: '16px', height: '16px' }} />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play style={{ width: '16px', height: '16px' }} />
                                Play
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <input
                      ref={fileInputRef2}
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleVideoUpload(e, 'feed2')}
                      style={{ display: 'none' }}
                    />
                    
                    <div style={{
                      position: 'relative',
                      background: 'black',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(148, 163, 184, 0.1)',
                      aspectRatio: '16/9',
                      width: '100%',
                      maxHeight: '500px'
                    }}>
                      {feeds.feed2.videoFile ? (
                        <>
                          <video
                            ref={videoRef2}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            controls
                            onTimeUpdate={() => handleVideoTimeUpdate('feed2')}
                            onLoadedData={() => handleVideoTimeUpdate('feed2')}
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
                        </>
                      ) : (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #0f172a, #1e293b, #0f172a)'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <FileVideo style={{ width: '80px', height: '80px', color: '#475569', margin: '0 auto 24px' }} />
                            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#cbd5e1', margin: '0 0 8px 0' }}>Upload Video</h3>
                            <p style={{ color: '#64748b', margin: 0 }}>Select a video file for Feed 2 analysis</p>
                          </div>
                        </div>
                      )}
                      
                      {feeds.feed2.isProcessing && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0, 0, 0, 0.8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: '16px'
                        }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            border: '4px solid #475569',
                            borderTop: '4px solid #10b981',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          <div style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
                            Processing Video...
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                            {feeds.feed2.processedFrames} / {feeds.feed2.totalFrames} frames
                          </div>
                        </div>
                      )}
                      
                      {feeds.feed2.analysisComplete && (
                        <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(16, 185, 129, 0.9)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '16px',
                            fontSize: '14px',
                            fontWeight: '700'
                          }}>
                            <CheckCircle style={{ width: '16px', height: '16px' }} />
                            ANALYZED
                          </div>
                        </div>
                      )}
                      
                      {feeds.feed2.analysisComplete && (
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
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>PEAK DETECTED</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Analytics Section - Full Width, Three Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px' }}>
              {/* Real-time Analytics */}
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
                    background: 'linear-gradient(45deg, #06b6d4, #3b82f6)',
                    borderRadius: '16px'
                  }}>
                    <BarChart3 style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: 0 }}>Video Analytics</h3>
                    <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Real-time results</p>
                  </div>
                </div>
                
                <div style={{
                  textAlign: 'center',
                  marginBottom: '24px',
                  padding: '24px',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
                  borderRadius: '24px',
                  border: '1px solid rgba(6, 182, 212, 0.3)'
                }}>
                  <div style={{
                    fontSize: '36px',
                    fontWeight: '900',
                    background: 'linear-gradient(45deg, #06b6d4, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '8px'
                  }}>
                    {analytics.totalDetections}
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>TOTAL DETECTIONS</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Peak: {analytics.peakOccupancy} people
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#60a5fa', fontSize: '14px', fontWeight: '600' }}>Avg Confidence</span>
                      <Zap style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#60a5fa' }}>
                      {(analytics.avgConfidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '600' }}>Processing Speed</span>
                      <TrendingUp style={{ width: '14px', height: '14px', color: '#10b981' }} />
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                      {analytics.processingStats.fps.toFixed(1)} FPS
                    </div>
                  </div>
                </div>
              </div>
              
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
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: 0 }}>AI Configuration</h3>
                    <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Ultra-sensitive settings</p>
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
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#cbd5e1', marginBottom: '12px' }}>Alert Threshold</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={config.maxPeople}
                      onChange={(e) => setConfig({...config, maxPeople: parseInt(e.target.value)})}
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
          </div>
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
