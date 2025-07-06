'use client'

import React, { useState, useEffect } from 'react'
import { 
  Shield, Video, VideoOff, Play, Pause, Upload, Settings, Activity, 
  Wifi, WifiOff, AlertTriangle, Users, Clock, Camera, Zap, 
  BarChart3, Maximize2, Minimize2, RefreshCw, Download,
  Eye, Target, Layers, Signal, ChevronRight, Bell
} from 'lucide-react'

export default function SophisticatedSurveillanceDashboard() {
  const [feeds, setFeeds] = useState({
    feed1: { isStreaming: false, currentCount: 0, isFullscreen: false },
    feed2: { isStreaming: false, currentCount: 0, isFullscreen: false }
  })
  
  const [isConnected, setIsConnected] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'warning', message: 'Motion detected in Zone A', time: '14:23:45', severity: 'medium' },
    { id: 2, type: 'info', message: 'System calibration complete', time: '14:20:12', severity: 'low' }
  ])
  
  const [config, setConfig] = useState({
    confidence: 0.75,
    maxPeople: 25,
    alertEnabled: true,
    nightVision: false,
    motionDetection: true
  })

  const [stats, setStats] = useState({
    totalDetections: 1247,
    avgAccuracy: 94.2,
    uptime: '99.8%',
    avgResponseTime: 23
  })

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const toggleFeed = (feedId: 'feed1' | 'feed2') => {
    setFeeds(prev => ({
      ...prev,
      [feedId]: { 
        ...prev[feedId], 
        isStreaming: !prev[feedId].isStreaming,
        currentCount: !prev[feedId].isStreaming ? Math.floor(Math.random() * 8) : 0
      }
    }))
  }

  const toggleFullscreen = (feedId: 'feed1' | 'feed2') => {
    setFeeds(prev => ({
      ...prev,
      [feedId]: { 
        ...prev[feedId], 
        isFullscreen: !prev[feedId].isFullscreen
      }
    }))
  }

  const totalCount = feeds.feed1.currentCount + feeds.feed2.currentCount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sophisticated Header */}
      <div className="bg-slate-800/90 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Shield className="h-10 w-10 text-blue-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  AI Security Surveillance
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-xs bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1 rounded-full text-white font-medium">
                    Neural Vision™
                  </span>
                  <span className="text-xs text-slate-400">
                    {currentTime.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* System Status */}
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl backdrop-blur-sm ${
                  isConnected 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {isConnected ? <Signal className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {isConnected ? 'ACTIVE' : 'OFFLINE'}
                  </span>
                </div>
                
                {/* Quick Stats */}
                <div className="hidden md:flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="text-cyan-400 font-bold">{totalCount}</div>
                    <div className="text-slate-400 text-xs">DETECTED</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold">{stats.avgAccuracy}%</div>
                    <div className="text-slate-400 text-xs">ACCURACY</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Main Video Feeds Section */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Video Feeds */}
          <div className="xl:col-span-3">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="h-6 w-6 text-blue-400" />
                    <h2 className="text-xl font-semibold text-white">Live Security Feeds</h2>
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                      2 ACTIVE
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                      <Upload className="h-4 w-4" />
                      <span>Upload Media</span>
                    </button>
                    <button className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl text-slate-300 hover:text-white transition-colors">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Video Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Feed 1 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Camera className="h-5 w-5 text-blue-400" />
                          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                            feeds.feed1.isStreaming ? 'bg-green-400' : 'bg-slate-500'
                          }`}></div>
                        </div>
                        <h3 className="font-semibold text-white">Camera Feed 1</h3>
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">ZONE A</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleFullscreen('feed1')}
                          className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-300 hover:text-white transition-colors"
                        >
                          {feeds.feed1.isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => toggleFeed('feed1')}
                          className={`px-4 py-2 rounded-lg flex items-center space-x-2 font-medium transition-all duration-200 ${
                            feeds.feed1.isStreaming 
                              ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg' 
                              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg'
                          }`}
                        >
                          {feeds.feed1.isStreaming ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          <span>{feeds.feed1.isStreaming ? 'Stop' : 'Start'}</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9' }}>
                      {/* AI Detection Overlay */}
                      {feeds.feed1.isStreaming && (
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none">
                          {/* Simulated Detection Boxes */}
                          <div className="absolute top-1/4 left-1/3 w-20 h-32 border-2 border-green-400 rounded">
                            <div className="absolute -top-6 left-0 bg-green-400 text-black px-2 py-1 rounded text-xs font-bold">
                              PERSON 89%
                            </div>
                          </div>
                          <div className="absolute top-1/2 right-1/4 w-16 h-28 border-2 border-yellow-400 rounded">
                            <div className="absolute -top-6 left-0 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">
                              PERSON 67%
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!feeds.feed1.isStreaming && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                          <div className="text-center">
                            <VideoOff className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg font-medium">Camera Feed Offline</p>
                            <p className="text-slate-500 text-sm mt-2">Click Start to begin monitoring</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Live Indicator */}
                      {feeds.feed1.isStreaming && (
                        <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-600/90 backdrop-blur-sm text-white px-3 py-2 rounded-xl">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span className="text-sm font-bold">LIVE</span>
                        </div>
                      )}
                      
                      {/* Stats Overlay */}
                      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white px-4 py-3 rounded-xl">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-blue-400" />
                            <span className="text-lg font-bold text-blue-400">{feeds.feed1.currentCount}</span>
                          </div>
                          <div className="text-sm text-slate-300">
                            <div>Zone A</div>
                            <div className="text-xs text-slate-400">Main Entrance</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Feed 2 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Camera className="h-5 w-5 text-green-400" />
                          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                            feeds.feed2.isStreaming ? 'bg-green-400' : 'bg-slate-500'
                          }`}></div>
                        </div>
                        <h3 className="font-semibold text-white">Camera Feed 2</h3>
                        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">ZONE B</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleFullscreen('feed2')}
                          className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-300 hover:text-white transition-colors"
                        >
                          {feeds.feed2.isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => toggleFeed('feed2')}
                          className={`px-4 py-2 rounded-lg flex items-center space-x-2 font-medium transition-all duration-200 ${
                            feeds.feed2.isStreaming 
                              ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg' 
                              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg'
                          }`}
                        >
                          {feeds.feed2.isStreaming ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          <span>{feeds.feed2.isStreaming ? 'Stop' : 'Start'}</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9' }}>
                      {/* AI Detection Overlay */}
                      {feeds.feed2.isStreaming && (
                        <div className="absolute inset-0 bg-gradient-to-b from-green-600/10 to-transparent pointer-events-none">
                          {/* Simulated Detection Boxes */}
                          <div className="absolute top-1/3 left-1/4 w-18 h-30 border-2 border-green-400 rounded">
                            <div className="absolute -top-6 left-0 bg-green-400 text-black px-2 py-1 rounded text-xs font-bold">
                              PERSON 92%
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!feeds.feed2.isStreaming && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                          <div className="text-center">
                            <VideoOff className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg font-medium">Camera Feed Offline</p>
                            <p className="text-slate-500 text-sm mt-2">Click Start to begin monitoring</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Live Indicator */}
                      {feeds.feed2.isStreaming && (
                        <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-600/90 backdrop-blur-sm text-white px-3 py-2 rounded-xl">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span className="text-sm font-bold">LIVE</span>
                        </div>
                      )}
                      
                      {/* Stats Overlay */}
                      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white px-4 py-3 rounded-xl">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-green-400" />
                            <span className="text-lg font-bold text-green-400">{feeds.feed2.currentCount}</span>
                          </div>
                          <div className="text-sm text-slate-300">
                            <div>Zone B</div>
                            <div className="text-xs text-slate-400">Lobby Area</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Real-time Analytics */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <Activity className="h-6 w-6 text-cyan-400" />
                <h3 className="text-xl font-semibold text-white">Live Analytics</h3>
              </div>
              
              {/* Total Count with Animation */}
              <div className="text-center mb-8 p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20">
                <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  {totalCount}
                </div>
                <div className="text-slate-400 text-sm uppercase tracking-wide">Total Detected</div>
                <div className="mt-2 flex items-center justify-center space-x-2 text-xs text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Real-time</span>
                </div>
              </div>
              
              {/* Zone Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-700/30 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-400 font-medium text-sm">Zone A</span>
                    <div className={`w-3 h-3 rounded-full ${feeds.feed1.isStreaming ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></div>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">{feeds.feed1.currentCount}</div>
                  <div className="text-xs text-slate-400">Main Entrance</div>
                </div>
                
                <div className="bg-slate-700/30 rounded-xl p-4 border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 font-medium text-sm">Zone B</span>
                    <div className={`w-3 h-3 rounded-full ${feeds.feed2.isStreaming ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{feeds.feed2.currentCount}</div>
                  <div className="text-xs text-slate-400">Lobby Area</div>
                </div>
              </div>
              
              {/* Performance Metrics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">System Uptime</span>
                  <span className="text-green-400 font-semibold">{stats.uptime}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Detection Accuracy</span>
                  <span className="text-cyan-400 font-semibold">{stats.avgAccuracy}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Response Time</span>
                  <span className="text-yellow-400 font-semibold">{stats.avgResponseTime}ms</span>
                </div>
              </div>
            </div>
            
            {/* Advanced Configuration */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <Settings className="h-6 w-6 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">AI Configuration</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-slate-300">Detection Confidence</label>
                    <span className="text-cyan-400 text-sm font-semibold">{(config.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.95"
                    step="0.05"
                    value={config.confidence}
                    onChange={(e) => setConfig({...config, confidence: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.maxPeople}
                    onChange={(e) => setConfig({...config, maxPeople: parseInt(e.target.value)})}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-yellow-400" />
                      <span className="text-sm text-slate-300">Smart Alerts</span>
                    </div>
                    <button
                      onClick={() => setConfig({...config, alertEnabled: !config.alertEnabled})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.alertEnabled ? 'bg-cyan-600' : 'bg-slate-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.alertEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Target className="h-5 w-5 text-green-400" />
                      <span className="text-sm text-slate-300">Motion Detection</span>
                    </div>
                    <button
                      onClick={() => setConfig({...config, motionDetection: !config.motionDetection})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.motionDetection ? 'bg-green-600' : 'bg-slate-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.motionDetection ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Smart Alerts Panel */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-6 w-6 text-orange-400" />
                  <h3 className="text-xl font-semibold text-white">Smart Alerts</h3>
                </div>
                <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full">
                  {alerts.length} Active
                </span>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border-l-4 bg-slate-700/30 backdrop-blur-sm transition-all hover:bg-slate-700/50 ${
                      alert.severity === 'high' 
                        ? 'border-red-500 bg-red-500/5' 
                        : alert.severity === 'medium'
                        ? 'border-yellow-500 bg-yellow-500/5'
                        : 'border-blue-500 bg-blue-500/5'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white mb-1">{alert.message}</div>
                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{alert.time}</span>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.severity === 'high' 
                          ? 'bg-red-500/20 text-red-300' 
                          : alert.severity === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {alert.severity.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {alerts.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-8 w-8 text-slate-500" />
                    </div>
                    <p className="text-slate-400 text-sm">All systems operating normally</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
