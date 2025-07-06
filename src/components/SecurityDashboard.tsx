'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, Upload, Settings, Shield, AlertTriangle, Users, Activity, Wifi, WifiOff, Play, Pause, Video, VideoOff } from 'lucide-react'

interface Detection {
  center: [number, number]
  bbox: [number, number, number, number]
  confidence: number
  area: number
  width: number
  height: number
}

interface FeedStats {
  fps: number
  avgProcessingTime: number
}

interface Feed {
  isStreaming: boolean
  currentCount: number
  detections: Detection[]
  stats: FeedStats
}

interface Alert {
  id: number
  feedId?: string
  message: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  people_count?: number
}

interface Config {
  confidence: number
  maxPeople: number
  alertEnabled: boolean
  realtimeMode: boolean
}

const SecurityDashboard: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [feeds, setFeeds] = useState<{ feed1: Feed; feed2: Feed }>({
    feed1: { isStreaming: false, currentCount: 0, detections: [], stats: { fps: 0, avgProcessingTime: 0 } },
    feed2: { isStreaming: false, currentCount: 0, detections: [], stats: { fps: 0, avgProcessingTime: 0 } }
  })
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [config, setConfig] = useState<Config>({
    confidence: 0.08,
    maxPeople: 50,
    alertEnabled: true,
    realtimeMode: true
  })
  
  const videoRef1 = useRef<HTMLVideoElement>(null)
  const videoRef2 = useRef<HTMLVideoElement>(null)
  const canvasRef1 = useRef<HTMLCanvasElement>(null)
  const canvasRef2 = useRef<HTMLCanvasElement>(null)
  const wsRef1 = useRef<WebSocket | null>(null)
  const wsRef2 = useRef<WebSocket | null>(null)
  const streamRef1 = useRef<MediaStream | null>(null)
  const streamRef2 = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  
  // Initialize WebSocket connections for both feeds
  const connectWebSocket = useCallback((feedId: 'feed1' | 'feed2') => {
    try {
      const wsRef = feedId === 'feed1' ? wsRef1 : wsRef2
      const wsUrl = API_BASE.replace('http', 'ws').replace('https', 'wss')
      wsRef.current = new WebSocket(`${wsUrl}/ws/detect`)
      
      wsRef.current.onopen = () => {
        setIsConnected(true)
        console.log(`WebSocket connected for ${feedId}`)
      }
      
      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data)
        
        if (message.type === 'detection_result') {
          const result = message.data
          setFeeds(prev => ({
            ...prev,
            [feedId]: {
              ...prev[feedId],
              currentCount: result.people_count,
              detections: result.detections,
              stats: {
                ...prev[feedId].stats,
                avgProcessingTime: result.processing_time_ms
              }
            }
          }))
          
          // Draw detections on canvas
          const canvasRef = feedId === 'feed1' ? canvasRef1 : canvasRef2
          const videoRef = feedId === 'feed1' ? videoRef1 : videoRef2
          drawDetections(result.detections, result.people_count, canvasRef, videoRef, feedId)
        } else if (message.type === 'alert') {
          const alert: Alert = {
            id: Date.now(),
            feedId,
            ...message.data,
            timestamp: new Date().toLocaleTimeString()
          }
          setAlerts(prev => [alert, ...prev.slice(0, 9)])
        }
      }
      
      wsRef.current.onerror = (error) => {
        console.error(`WebSocket error for ${feedId}:`, error)
      }
      
      wsRef.current.onclose = () => {
        console.log(`WebSocket disconnected for ${feedId}`)
        setIsConnected(false)
      }
    } catch (error) {
      console.error(`WebSocket connection failed for ${feedId}:`, error)
    }
  }, [API_BASE])
  
  // Start camera stream for specific feed
  const startCamera = useCallback(async (feedId: 'feed1' | 'feed2') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 } 
      })
      
      const videoRef = feedId === 'feed1' ? videoRef1 : videoRef2
      const streamRef = feedId === 'feed1' ? streamRef1 : streamRef2
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        setFeeds(prev => ({
          ...prev,
          [feedId]: { ...prev[feedId], isStreaming: true }
        }))
        
        // Start sending frames
        startFrameCapture(feedId)
      }
    } catch (error) {
      console.error(`Camera access failed for ${feedId}:`, error)
      alert(`Camera access denied for ${feedId}. Please allow camera permissions.`)
    }
  }, [])
  
  // Stop camera stream for specific feed
  const stopCamera = useCallback((feedId: 'feed1' | 'feed2') => {
    const streamRef = feedId === 'feed1' ? streamRef1 : streamRef2
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    setFeeds(prev => ({
      ...prev,
      [feedId]: { ...prev[feedId], isStreaming: false }
    }))
  }, [])
  
  // Capture and send frames to WebSocket for specific feed
  const startFrameCapture = useCallback((feedId: 'feed1' | 'feed2') => {
    const captureFrame = () => {
      const videoRef = feedId === 'feed1' ? videoRef1 : videoRef2
      const wsRef = feedId === 'feed1' ? wsRef1 : wsRef2
      
      if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return
      }
      
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return
      
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      
      ctx.drawImage(videoRef.current, 0, 0)
      
      canvas.toBlob((blob) => {
        if (!blob) return
        
        const reader = new FileReader()
        reader.onload = () => {
          const base64Data = (reader.result as string).split(',')[1]
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'frame',
              data: base64Data,
              confidence: config.confidence,
              feedId: feedId,
              alert_config: {
                max_people: config.maxPeople,
                alert_enabled: config.alertEnabled
              }
            }))
          }
        }
        reader.readAsDataURL(blob)
      }, 'image/jpeg', 0.8)
    }
    
    const intervalId = setInterval(captureFrame, 200) // 5 FPS
    
    return () => clearInterval(intervalId)
  }, [config])
  
  // Draw detections on overlay canvas
  const drawDetections = useCallback((detections: Detection[], count: number, canvasRef: React.RefObject<HTMLCanvasElement>, videoRef: React.RefObject<HTMLVideoElement>, feedId: string) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    
    if (!canvas || !video) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw detections
    detections.forEach((detection) => {
      const [x1, y1, x2, y2] = detection.bbox
      const confidence = detection.confidence
      
      // Color based on confidence
      let color = confidence >= 0.7 ? '#10b981' : confidence >= 0.4 ? '#f59e0b' : '#ef4444'
      
      // Draw bounding box
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
      
      // Draw confidence
      ctx.fillStyle = color
      ctx.font = '14px Inter, sans-serif'
      ctx.fillText(`${(confidence * 100).toFixed(0)}%`, x1, y1 - 5)
      
      // Draw center point
      const [centerX, centerY] = detection.center
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI)
      ctx.fill()
    })
    
    // Draw header info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(10, 10, 320, 80)
    
    ctx.fillStyle = feedId === 'feed1' ? '#3b82f6' : '#10b981'
    ctx.font = 'bold 18px Inter, sans-serif'
    ctx.fillText(`${feedId.toUpperCase()}: ${count} PEOPLE`, 20, 35)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px Inter, sans-serif'
    ctx.fillText(`Detections: ${detections.length}`, 20, 55)
    ctx.fillText(`Confidence: ${(config.confidence * 100).toFixed(0)}%`, 20, 75)
  }, [config.confidence])
  
  // Handle image upload
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('confidence', config.confidence.toString())
    
    try {
      const response = await fetch(`${API_BASE}/detect/image/annotated`, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const imageUrl = URL.createObjectURL(blob)
        
        // Display annotated image
        const img = new Image()
        img.onload = () => {
          const canvas = canvasRef1.current
          if (!canvas) return
          
          const ctx = canvas.getContext('2d')
          if (!ctx) return
          
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
        }
        img.src = imageUrl
        
        // Get count from headers
        const peopleCount = response.headers.get('X-People-Count')
        if (peopleCount) {
          setFeeds(prev => ({
            ...prev,
            feed1: { ...prev.feed1, currentCount: parseInt(peopleCount) }
          }))
        }
      }
    } catch (error) {
      console.error('Image upload failed:', error)
    }
  }, [API_BASE, config.confidence])
  
  // Update configuration
  const updateConfig = useCallback(async (newConfig: Config) => {
    setConfig(newConfig)
    
    try {
      await fetch(`${API_BASE}/stream/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confidence: newConfig.confidence,
          realtime_mode: newConfig.realtimeMode,
          alert_config: {
            max_people: newConfig.maxPeople,
            alert_enabled: newConfig.alertEnabled
          }
        })
      })
    } catch (error) {
      console.error('Config update failed:', error)
    }
  }, [API_BASE])
  
  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])
  
  // Component mount effect
  useEffect(() => {
    connectWebSocket('feed1')
    connectWebSocket('feed2')
    
    return () => {
      if (wsRef1.current) wsRef1.current.close()
      if (wsRef2.current) wsRef2.current.close()
      stopCamera('feed1')
      stopCamera('feed2')
    }
  }, [connectWebSocket, stopCamera])
  
  const totalCount = feeds.feed1.currentCount + feeds.feed2.currentCount
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold">AI Security Surveillance</h1>
            <span className="text-xs bg-blue-600 px-2 py-1 rounded">Ultra-Sensitive</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              isConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            }`}>
              {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
        {/* Dual Video Feeds */}
        <div className="lg:col-span-3">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Security Feeds</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            {/* Always Side-by-Side Feed Layout */}
            <div className="flex flex-row gap-6">
              {/* Feed 1 */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center">
                    <Video className="h-5 w-5 mr-2 text-blue-400" />
                    Camera Feed 1
                  </h3>
                  <button
                    onClick={() => feeds.feed1.isStreaming ? stopCamera('feed1') : startCamera('feed1')}
                    className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-sm transition-colors ${
                      feeds.feed1.isStreaming 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {feeds.feed1.isStreaming ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    <span>{feeds.feed1.isStreaming ? 'Stop' : 'Start'}</span>
                  </button>
                </div>
                
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <video
                    ref={videoRef1}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover gpu-accelerated"
                  />
                  <canvas
                    ref={canvasRef1}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  />
                  
                  {!feeds.feed1.isStreaming && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <VideoOff className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Feed 1 Offline</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Feed 1 Live Indicator */}
                  {feeds.feed1.isStreaming && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                    </div>
                  )}
                  
                  {/* Feed 1 Stats Overlay */}
                  <div className="absolute bottom-3 left-3 bg-black bg-opacity-80 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
                    <div className="text-sm font-medium text-blue-400">
                      Count: {feeds.feed1.currentCount}
                    </div>
                    <div className="text-xs text-gray-300">
                      {feeds.feed1.stats.avgProcessingTime.toFixed(0)}ms
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Feed 2 */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center">
                    <Video className="h-5 w-5 mr-2 text-green-400" />
                    Camera Feed 2
                  </h3>
                  <button
                    onClick={() => feeds.feed2.isStreaming ? stopCamera('feed2') : startCamera('feed2')}
                    className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-sm transition-colors ${
                      feeds.feed2.isStreaming 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {feeds.feed2.isStreaming ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    <span>{feeds.feed2.isStreaming ? 'Stop' : 'Start'}</span>
                  </button>
                </div>
                
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <video
                    ref={videoRef2}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover gpu-accelerated"
                  />
                  <canvas
                    ref={canvasRef2}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  />
                  
                  {!feeds.feed2.isStreaming && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <VideoOff className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Feed 2 Offline</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Feed 2 Live Indicator */}
                  {feeds.feed2.isStreaming && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>LIVE</span>
                    </div>
                  )}
                  
                  {/* Feed 2 Stats Overlay */}
                  <div className="absolute bottom-3 left-3 bg-black bg-opacity-80 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
                    <div className="text-sm font-medium text-green-400">
                      Count: {feeds.feed2.currentCount}
                    </div>
                    <div className="text-xs text-gray-300">
                      {feeds.feed2.stats.avgProcessingTime.toFixed(0)}ms
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - Stats and Controls */}
        <div className="space-y-6">
          {/* Combined Stats for Both Feeds */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Live Statistics
            </h3>
            
            {/* Total Count Summary */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-green-400">
                {totalCount}
              </div>
              <div className="text-sm text-gray-400">Total People Detected</div>
            </div>
            
            {/* Individual Feed Stats - Side by Side */}
            <div className="flex gap-4">
              <div className="flex-1 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400 font-medium">Feed 1</span>
                  <div className={`w-2 h-2 rounded-full ${feeds.feed1.isStreaming ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-400">{feeds.feed1.currentCount}</div>
                    <div className="text-gray-400">People</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{feeds.feed1.stats.avgProcessingTime.toFixed(0)}ms</div>
                    <div className="text-gray-400">Process</div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-400 font-medium">Feed 2</span>
                  <div className={`w-2 h-2 rounded-full ${feeds.feed2.isStreaming ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-400">{feeds.feed2.currentCount}</div>
                    <div className="text-gray-400">People</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{feeds.feed2.stats.avgProcessingTime.toFixed(0)}ms</div>
                    <div className="text-gray-400">Process</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* System Status */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Connection Status</span>
                <div className={`flex items-center space-x-1 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  <span>{isConnected ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Configuration */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Confidence Threshold</label>
                <input
                  type="range"
                  min="0.01"
                  max="0.9"
                  step="0.01"
                  value={config.confidence}
                  onChange={(e) => updateConfig({...config, confidence: parseFloat(e.target.value)})}
                  className="w-full accent-blue-500"
                />
                <div className="text-xs text-gray-400 mt-1">{(config.confidence * 100).toFixed(0)}%</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Alert Threshold</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={config.maxPeople}
                  onChange={(e) => updateConfig({...config, maxPeople: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="alertEnabled"
                  checked={config.alertEnabled}
                  onChange={(e) => updateConfig({...config, alertEnabled: e.target.checked})}
                  className="rounded accent-blue-500"
                />
                <label htmlFor="alertEnabled" className="text-sm">Enable Alerts</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="realtimeMode"
                  checked={config.realtimeMode}
                  onChange={(e) => updateConfig({...config, realtimeMode: e.target.checked})}
                  className="rounded accent-blue-500"
                />
                <label htmlFor="realtimeMode" className="text-sm">Real-time Mode</label>
              </div>
            </div>
          </div>
          
          {/* Alerts */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Alerts
              </h3>
              {alerts.length > 0 && (
                <button
                  onClick={clearAlerts}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-gray-400 text-sm">No alerts</p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border-l-4 animate-slide-in-right ${
                      alert.severity === 'critical' 
                        ? 'bg-red-900/20 border-red-500' 
                        : alert.severity === 'high'
                        ? 'bg-red-900/15 border-red-600'
                        : alert.severity === 'medium'
                        ? 'bg-yellow-900/20 border-yellow-500'
                        : 'bg-green-900/20 border-green-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{alert.message}</div>
                      {alert.feedId && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          alert.feedId === 'feed1' ? 'bg-blue-600' : 'bg-green-600'
                        } text-white`}>
                          {alert.feedId === 'feed1' ? 'Feed 1' : 'Feed 2'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{alert.timestamp}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecurityDashboard
