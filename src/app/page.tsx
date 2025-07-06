'use client'

import React, { useState } from 'react'
import { Shield, Camera, Video, VideoOff, Play, Pause, Upload, Settings, Activity, Wifi, WifiOff, AlertTriangle } from 'lucide-react'

export default function HomePage() {
  const [feeds, setFeeds] = useState({
    feed1: { isStreaming: false, currentCount: 0 },
    feed2: { isStreaming: false, currentCount: 0 }
  })
  
  const [isConnected, setIsConnected] = useState(false)
  const [config, setConfig] = useState({
    confidence: 0.08,
    maxPeople: 50,
    alertEnabled: true
  })

  const toggleFeed = (feedId: 'feed1' | 'feed2') => {
    setFeeds(prev => ({
      ...prev,
      [feedId]: { 
        ...prev[feedId], 
        isStreaming: !prev[feedId].isStreaming 
      }
    }))
  }

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
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </button>
              </div>
            </div>
            
            {/* Side-by-Side Feed Layout */}
            <div className="flex flex-row gap-6">
              {/* Feed 1 */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center">
                    <Video className="h-5 w-5 mr-2 text-blue-400" />
                    Camera Feed 1
                  </h3>
                  <button
                    onClick={() => toggleFeed('feed1')}
                    className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-sm ${
                      feeds.feed1.isStreaming 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {feeds.feed1.isStreaming ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    <span>{feeds.feed1.isStreaming ? 'Stop' : 'Start'}</span>
                  </button>
                </div>
                
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  {!feeds.feed1.isStreaming && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <VideoOff className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Feed 1 Offline</p>
                      </div>
                    </div>
                  )}
                  
                  {feeds.feed1.isStreaming && (
                    <>
                      <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>LIVE</span>
                      </div>
                      
                      <div className="absolute bottom-3 left-3 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg">
                        <div className="text-sm font-medium text-blue-400">
                          Count: {feeds.feed1.currentCount}
                        </div>
                        <div className="text-xs text-gray-300">
                          Ready
                        </div>
                      </div>
                    </>
                  )}
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
                    onClick={() => toggleFeed('feed2')}
                    className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-sm ${
                      feeds.feed2.isStreaming 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {feeds.feed2.isStreaming ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    <span>{feeds.feed2.isStreaming ? 'Stop' : 'Start'}</span>
                  </button>
                </div>
                
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  {!feeds.feed2.isStreaming && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <VideoOff className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Feed 2 Offline</p>
                      </div>
                    </div>
                  )}
                  
                  {feeds.feed2.isStreaming && (
                    <>
                      <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>LIVE</span>
                      </div>
                      
                      <div className="absolute bottom-3 left-3 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg">
                        <div className="text-sm font-medium text-green-400">
                          Count: {feeds.feed2.currentCount}
                        </div>
                        <div className="text-xs text-gray-300">
                          Ready
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Live Statistics */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Live Statistics
            </h3>
            
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-green-400">
                {totalCount}
              </div>
              <div className="text-sm text-gray-400">Total People Detected</div>
            </div>
            
            {/* Individual Feed Stats */}
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
                </div>
              </div>
            </div>
            
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
                  onChange={(e) => setConfig({...config, confidence: parseFloat(e.target.value)})}
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
                  onChange={(e) => setConfig({...config, maxPeople: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="alertEnabled"
                  checked={config.alertEnabled}
                  onChange={(e) => setConfig({...config, alertEnabled: e.target.checked})}
                  className="rounded accent-blue-500"
                />
                <label htmlFor="alertEnabled" className="text-sm">Enable Alerts</label>
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
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-gray-400 text-sm">No alerts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
