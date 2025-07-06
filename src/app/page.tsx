'use client'

import React, { useState, useEffect } from 'react'
import { 
  Shield, Video, VideoOff, Play, Pause, Upload, Settings, Activity, 
  Wifi, WifiOff, AlertTriangle, Users, Clock, Camera, Zap, 
  BarChart3, Maximize2, Minimize2, RefreshCw, Download,
  Eye, Target, Layers, Signal, ChevronRight, Bell, 
  Monitor, Cpu, HardDrive, Database
} from 'lucide-react'

export default function AdvancedSecurityDashboard() {
  const [feeds, setFeeds] = useState({
    feed1: { isStreaming: false, currentCount: 0, isFullscreen: false },
    feed2: { isStreaming: false, currentCount: 0, isFullscreen: false }
  })
  
  const [isConnected, setIsConnected] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'warning', message: 'Unusual activity detected in Zone A', time: '14:23:45', severity: 'high' },
    { id: 2, type: 'info', message: 'System scan completed successfully', time: '14:20:12', severity: 'low' },
    { id: 3, type: 'warning', message: 'Motion detected after hours', time: '14:18:33', severity: 'medium' }
  ])
  
  const [config, setConfig] = useState({
    confidence: 0.85,
    maxPeople: 15,
    alertEnabled: true,
    nightVision: false,
    motionDetection: true
  })

  const [systemStats, setSystemStats] = useState({
    cpuUsage: 45,
    memoryUsage: 67,
    diskUsage: 23,
    networkLatency: 12,
    totalDetections: 2847,
    avgAccuracy: 96.8,
    uptime: '99.9%'
  })

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (feeds.feed1.isStreaming || feeds.feed2.isStreaming) {
        setSystemStats(prev => ({
          ...prev,
          cpuUsage: Math.max(20, Math.min(80, prev.cpuUsage + (Math.random() - 0.5) * 10)),
          memoryUsage: Math.max(30, Math.min(90, prev.memoryUsage + (Math.random() - 0.5) * 8)),
          networkLatency: Math.max(5, Math.min(50, prev.networkLatency + (Math.random() - 0.5) * 5))
        }))
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [feeds])

  const toggleFeed = (feedId: 'feed1' | 'feed2') => {
    setFeeds(prev => ({
      ...prev,
      [feedId]: { 
        ...prev[feedId], 
        isStreaming: !prev[feedId].isStreaming,
        currentCount: !prev[feedId].isStreaming ? Math.floor(Math.random() * 12) + 1 : 0
      }
    }))
  }

  const totalCount = feeds.feed1.currentCount + feeds.feed2.currentCount

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 opacity-50"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      
      {/* Main Content */}
      <div className="relative z-10">
        {/* Ultra-Modern Header */}
        <header className="bg-slate-900/80 backdrop-blur-2xl border-b border-slate-700/50 shadow-2xl">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Left Section */}
              <div className="flex items-center space-x-6">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative bg-slate-800 p-3 rounded-2xl">
                    <Shield className="h-10 w-10 text-blue-400" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-tight">
                    AEGIS SECURITY
                  </h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-1.5 rounded-full text-white font-semibold shadow-lg">
                      Neural Vision™ AI
                    </span>
                    <span className="text-sm text-slate-400 font-mono">
                      {currentTime.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Right Section */}
              <div className="flex items-center space-x-6">
                {/* System Status */}
                <div className={`flex items-center space-x-3 px-6 py-3 rounded-2xl backdrop-blur-sm transition-all ${
                  isConnected 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/20' 
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  <Signal className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-bold">SYSTEM ACTIVE</div>
                    <div className="text-xs opacity-80">All sensors online</div>
                  </div>
                </div>
                
                {/* Quick Metrics */}
                <div className="hidden xl:flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">{totalCount}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Detected</div>
                  </div>
                  <div className="w-px h-8 bg-slate-600"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{systemStats.avgAccuracy}%</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Accuracy</div>
                  </div>
                  <div className="w-px h-8 bg-slate-600"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{systemStats.uptime}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard */}
        <div className="p-8">
          <div className="grid grid-cols-12 gap-8">
            {/* Video Feeds Section - Takes up 8/12 columns */}
            <div className="col-span-8">
              <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
                {/* Section Header */}
                <div className="p-8 border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Live Security Feeds</h2>
                        <p className="text-slate-400">Real-time AI-powered surveillance</p>
                      </div>
                      <div className="flex items-center space-x-2 bg-blue-500/20 px-4 py-2 rounded-full border border-blue-500/30">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-blue-300 text-sm font-semibold">2 FEEDS ACTIVE</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-2xl text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                        <Upload className="h-5 w-5" />
                        <span>Upload Media</span>
                      </button>
                      <button className="p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-2xl text-slate-300 hover:text-white transition-all">
                        <RefreshCw className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Video Grid - Always Side by Side */}
                <div className="p-8">
                  <div className="grid grid-cols-2 gap-8">
                    {/* Feed 1 */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="p-2 bg-blue-600/20 rounded-xl border border-blue-500/30">
                              <Camera className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                              feeds.feed1.isStreaming ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-slate-500'
                            }`}></div>
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-lg">Camera Feed 1</h3>
                            <span className="text-sm bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                              ZONE A - Main Entrance
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleFeed('feed1')}
                            className={`px-6 py-3 rounded-2xl flex items-center space-x-2 font-bold transition-all duration-300 shadow-lg transform hover:scale-105 ${
                              feeds.feed1.isStreaming 
                                ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white' 
                                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                            }`}
                          >
                            {feeds.feed1.isStreaming ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            <span>{feeds.feed1.isStreaming ? 'STOP' : 'START'}</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50" style={{ aspectRatio: '16/9' }}>
                        {/* AI Detection Overlay */}
                        {feeds.feed1.isStreaming && (
                          <div className="absolute inset-0 z-10">
                            {/* Simulated Detection Boxes */}
                            <div className="absolute top-1/4 left-1/3 w-24 h-36 border-2 border-green-400 rounded-lg shadow-lg shadow-green-400/50">
                              <div className="absolute -top-8 left-0 bg-green-400 text-black px-3 py-1 rounded-lg text-xs font-bold shadow-lg">
                                PERSON 94%
                              </div>
                              <div className="absolute top-2 left-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                            <div className="absolute top-1/2 right-1/4 w-20 h-32 border-2 border-yellow-400 rounded-lg shadow-lg shadow-yellow-400/50">
                              <div className="absolute -top-8 left-0 bg-yellow-400 text-black px-3 py-1 rounded-lg text-xs font-bold shadow-lg">
                                PERSON 78%
                              </div>
                              <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            </div>
                            {/* Scanning Line Effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/10 to-transparent animate-pulse"></div>
                          </div>
                        )}
                        
                        {!feeds.feed1.isStreaming && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                            <div className="text-center">
                              <VideoOff className="h-20 w-20 text-slate-600 mx-auto mb-6" />
                              <h3 className="text-2xl font-bold text-slate-300 mb-2">Camera Offline</h3>
                              <p className="text-slate-500">Click START to begin monitoring</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Live Indicator */}
                        {feeds.feed1.isStreaming && (
                          <div className="absolute top-6 right-6 z-20">
                            <div className="flex items-center space-x-2 bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-2xl shadow-lg">
                              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                              <span className="text-sm font-bold tracking-wider">LIVE</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Enhanced Stats Overlay */}
                        {feeds.feed1.isStreaming && (
                          <div className="absolute bottom-6 left-6 z-20">
                            <div className="bg-black/80 backdrop-blur-sm text-white px-6 py-4 rounded-2xl border border-slate-600/50">
                              <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-3">
                                  <Users className="h-5 w-5 text-blue-400" />
                                  <div>
                                    <div className="text-2xl font-bold text-blue-400">{feeds.feed1.currentCount}</div>
                                    <div className="text-xs text-slate-400">DETECTED</div>
                                  </div>
                                </div>
                                <div className="w-px h-8 bg-slate-600"></div>
                                <div>
                                  <div className="text-sm font-semibold">Zone A</div>
                                  <div className="text-xs text-slate-400">Main Entrance</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Feed 2 */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="p-2 bg-green-600/20 rounded-xl border border-green-500/30">
                              <Camera className="h-5 w-5 text-green-400" />
                            </div>
                            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                              feeds.feed2.isStreaming ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-slate-500'
                            }`}></div>
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-lg">Camera Feed 2</h3>
                            <span className="text-sm bg-green-500/20 text-green-300 px-3 py-1 rounded-full border border-green-500/30">
                              ZONE B - Lobby Area
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleFeed('feed2')}
                            className={`px-6 py-3 rounded-2xl flex items-center space-x-2 font-bold transition-all duration-300 shadow-lg transform hover:scale-105 ${
                              feeds.feed2.isStreaming 
                                ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white' 
                                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                            }`}
                          >
                            {feeds.feed2.isStreaming ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            <span>{feeds.feed2.isStreaming ? 'STOP' : 'START'}</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50" style={{ aspectRatio: '16/9' }}>
                        {/* AI Detection Overlay */}
                        {feeds.feed2.isStreaming && (
                          <div className="absolute inset-0 z-10">
                            {/* Simulated Detection Boxes */}
                            <div className="absolute top-1/3 left-1/4 w-22 h-34 border-2 border-green-400 rounded-lg shadow-lg shadow-green-400/50">
                              <div className="absolute -top-8 left-0 bg-green-400 text-black px-3 py-1 rounded-lg text-xs font-bold shadow-lg">
                                PERSON 96%
                              </div>
                              <div className="absolute top-2 left-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                            <div className="absolute top-1/4 right-1/3 w-18 h-30 border-2 border-cyan-400 rounded-lg shadow-lg shadow-cyan-400/50">
                              <div className="absolute -top-8 left-0 bg-cyan-400 text-black px-3 py-1 rounded-lg text-xs font-bold shadow-lg">
                                PERSON 87%
                              </div>
                              <div className="absolute top-2 left-2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                            </div>
                            {/* Scanning Line Effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/10 to-transparent animate-pulse"></div>
                          </div>
                        )}
                        
                        {!feeds.feed2.isStreaming && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                            <div className="text-center">
                              <VideoOff className="h-20 w-20 text-slate-600 mx-auto mb-6" />
                              <h3 className="text-2xl font-bold text-slate-300 mb-2">Camera Offline</h3>
                              <p className="text-slate-500">Click START to begin monitoring</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Live Indicator */}
                        {feeds.feed2.isStreaming && (
                          <div className="absolute top-6 right-6 z-20">
                            <div className="flex items-center space-x-2 bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-2xl shadow-lg">
                              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                              <span className="text-sm font-bold tracking-wider">LIVE</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Enhanced Stats Overlay */}
                        {feeds.feed2.isStreaming && (
                          <div className="absolute bottom-6 left-6 z-20">
                            <div className="bg-black/80 backdrop-blur-sm text-white px-6 py-4 rounded-2xl border border-slate-600/50">
                              <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-3">
                                  <Users className="h-5 w-5 text-green-400" />
                                  <div>
                                    <div className="text-2xl font-bold text-green-400">{feeds.feed2.currentCount}</div>
                                    <div className="text-xs text-slate-400">DETECTED</div>
                                  </div>
                                </div>
                                <div className="w-px h-8 bg-slate-600"></div>
                                <div>
                                  <div className="text-sm font-semibold">Zone B</div>
                                  <div className="text-xs text-slate-400">Lobby Area</div>
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
            </div>
            
            {/* Right Sidebar - Takes up 4/12 columns */}
            <div className="col-span-4 space-y-8">
              {/* Real-time Analytics */}
              <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Live Analytics</h3>
                    <p className="text-slate-400">Real-time system metrics</p>
                  </div>
                </div>
                
                {/* Total Count Display */}
                <div className="text-center mb-10 p-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-3xl border border-cyan-500/30 shadow-lg">
                  <div className="text-6xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-3">
                    {totalCount}
                  </div>
                  <div className="text-slate-300 text-lg font-semibold mb-2">TOTAL DETECTED</div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-semibold">REAL-TIME</span>
                  </div>
                </div>
                
                {/* Zone Metrics */}
                <div className="grid grid-cols-1 gap-6 mb-8">
                  <div className="bg-slate-800/50 rounded-2xl p-6 border border-blue-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-blue-400 font-bold text-lg">Zone A</span>
                      <div className={`w-3 h-3 rounded-full ${feeds.feed1.isStreaming ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-slate-500'}`}></div>
                    </div>
                    <div className="text-3xl font-bold text-blue-400 mb-2">{feeds.feed1.currentCount}</div>
                    <div className="text-sm text-slate-400">Main Entrance</div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-2xl p-6 border border-green-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-green-400 font-bold text-lg">Zone B</span>
                      <div className={`w-3 h-3 rounded-full ${feeds.feed2.isStreaming ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-slate-500'}`}></div>
                    </div>
                    <div className="text-3xl font-bold text-green-400 mb-2">{feeds.feed2.currentCount}</div>
                    <div className="text-sm text-slate-400">Lobby Area</div>
                  </div>
                </div>
                
                {/* System Performance */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white mb-4">System Performance</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Cpu className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm text-slate-300">CPU Usage</span>
                      </div>
                      <span className="text-yellow-400 font-bold">{systemStats.cpuUsage}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500" style={{width: `${systemStats.cpuUsage}%`}}></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <HardDrive className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-slate-300">Memory</span>
                      </div>
                      <span className="text-purple-400 font-bold">{systemStats.memoryUsage}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500" style={{width: `${systemStats.memoryUsage}%`}}></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Signal className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-slate-300">Network</span>
                      </div>
                      <span className="text-green-400 font-bold">{systemStats.networkLatency}ms</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Advanced Configuration */}
              <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">AI Configuration</h3>
                    <p className="text-slate-400">Neural network settings</p>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-lg font-bold text-slate-200">Detection Confidence</label>
                      <span className="text-cyan-400 text-xl font-bold">{(config.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.95"
                      step="0.05"
                      value={config.confidence}
                      onChange={(e) => setConfig({...config, confidence: parseFloat(e.target.value)})}
                      className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-lg font-bold text-slate-200 mb-4">Alert Threshold</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={config.maxPeople}
                      onChange={(e) => setConfig({...config, maxPeople: parseInt(e.target.value)})}
                      className="w-full bg-slate-800/50 border border-slate-600 rounded-2xl px-6 py-4 text-white text-lg font-semibold focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-600/30">
                      <div className="flex items-center space-x-4">
                        <Bell className="h-6 w-6 text-yellow-400" />
                        <div>
                          <div className="text-lg font-bold text-white">Smart Alerts</div>
                          <div className="text-sm text-slate-400">AI-powered notifications</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfig({...config, alertEnabled: !config.alertEnabled})}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                          config.alertEnabled ? 'bg-cyan-600' : 'bg-slate-600'
                        }`}
                      >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          config.alertEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-600/30">
                      <div className="flex items-center space-x-4">
                        <Target className="h-6 w-6 text-green-400" />
                        <div>
                          <div className="text-lg font-bold text-white">Motion Detection</div>
                          <div className="text-sm text-slate-400">Advanced movement tracking</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfig({...config, motionDetection: !config.motionDetection})}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                          config.motionDetection ? 'bg-green-600' : 'bg-slate-600'
                        }`}
                      >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          config.motionDetection ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Smart Alerts */}
              <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Smart Alerts</h3>
                      <p className="text-slate-400">Security notifications</p>
                    </div>
                  </div>
                  <span className="text-sm bg-orange-500/20 text-orange-300 px-4 py-2 rounded-full border border-orange-500/30 font-semibold">
                    {alerts.length} ACTIVE
                  </span>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-6 rounded-2xl border-l-4 bg-slate-800/30 backdrop-blur-sm transition-all hover:bg-slate-700/40 cursor-pointer ${
                        alert.severity === 'high' 
                          ? 'border-red-500 shadow-lg shadow-red-500/20' 
                          : alert.severity === 'medium'
                          ? 'border-yellow-500 shadow-lg shadow-yellow-500/20'
                          : 'border-blue-500 shadow-lg shadow-blue-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-lg font-bold text-white mb-2">{alert.message}</div>
                          <div className="flex items-center space-x-3 text-sm text-slate-400">
                            <Clock className="h-4 w-4" />
                            <span className="font-mono">{alert.time}</span>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          alert.severity === 'high' 
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                            : alert.severity === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
