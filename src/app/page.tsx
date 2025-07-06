'use client'

import React, { useState, useEffect } from 'react'
import { 
  Shield, Video, VideoOff, Play, Pause, Upload, Settings, Activity, 
  Wifi, WifiOff, AlertTriangle, Users, Clock, Camera, 
  BarChart3, Maximize2, RefreshCw, Eye, Target, Bell, 
  Monitor, Cpu, HardDrive, Signal
} from 'lucide-react'

export default function UltimateSecurityDashboard() {
  const [feeds, setFeeds] = useState({
    feed1: { isStreaming: false, currentCount: 0, isFullscreen: false },
    feed2: { isStreaming: false, currentCount: 0, isFullscreen: false }
  })
  
  const [isConnected, setIsConnected] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'warning', message: 'Motion detected in Zone A', time: '14:23:45', severity: 'high' },
    { id: 2, type: 'info', message: 'System scan completed', time: '14:20:12', severity: 'low' },
    { id: 3, type: 'warning', message: 'Unusual activity detected', time: '14:18:33', severity: 'medium' }
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Animated Background Effects */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1), transparent 70%)',
        pointerEvents: 'none'
      }}></div>
      
      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Ultra-Modern Header */}
        <header style={{
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ padding: '24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Left Section */}
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
                      background: '#10b981',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite',
                      boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
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
                    AEGIS SECURITY
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
                      Neural Vision™ AI
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
              
              {/* Right Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {/* System Status */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 24px',
                  borderRadius: '16px',
                  backdropFilter: 'blur(8px)',
                  background: isConnected 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : 'rgba(239, 68, 68, 0.2)',
                  border: isConnected 
                    ? '1px solid rgba(16, 185, 129, 0.3)' 
                    : '1px solid rgba(239, 68, 68, 0.3)',
                  color: isConnected ? '#6ee7b7' : '#fca5a5',
                  boxShadow: isConnected 
                    ? '0 8px 32px rgba(16, 185, 129, 0.2)' 
                    : '0 8px 32px rgba(239, 68, 68, 0.2)'
                }}>
                  <Signal style={{ width: '20px', height: '20px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700' }}>SYSTEM ACTIVE</div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>All sensors online</div>
                  </div>
                </div>
                
                {/* Quick Metrics */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#06b6d4' }}>{totalCount}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Detected</div>
                  </div>
                  <div style={{ width: '1px', height: '32px', background: '#475569' }}></div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{systemStats.avgAccuracy}%</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Accuracy</div>
                  </div>
                  <div style={{ width: '1px', height: '32px', background: '#475569' }}></div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#fbbf24' }}>{systemStats.uptime}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard */}
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            {/* Video Feeds Section */}
            <div>
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
              }}>
                {/* Section Header */}
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
                        <Eye style={{ width: '24px', height: '24px', color: 'white' }} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'white', margin: 0 }}>Live Security Feeds</h2>
                        <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Real-time AI-powered surveillance</p>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          background: '#60a5fa',
                          borderRadius: '50%',
                          animation: 'pulse 2s infinite'
                        }}></div>
                        <span style={{ color: '#93c5fd', fontSize: '14px', fontWeight: '600' }}>2 FEEDS ACTIVE</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: 'linear-gradient(45deg, #3b82f6, #06b6d4)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4)'
                      }}>
                        <Upload style={{ width: '20px', height: '20px' }} />
                        <span>Upload Media</span>
                      </button>
                      <button style={{
                        padding: '12px',
                        background: 'rgba(71, 85, 105, 0.5)',
                        color: '#94a3b8',
                        border: 'none',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}>
                        <RefreshCw style={{ width: '20px', height: '20px' }} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Video Grid - Always Side by Side */}
                <div style={{ padding: '32px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
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
                              animation: feeds.feed1.isStreaming ? 'pulse 2s infinite' : 'none',
                              boxShadow: feeds.feed1.isStreaming ? '0 0 20px rgba(16, 185, 129, 0.5)' : 'none'
                            }}></div>
                          </div>
                          <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>Camera Feed 1</h3>
                            <span style={{
                              fontSize: '12px',
                              background: 'rgba(59, 130, 246, 0.2)',
                              color: '#93c5fd',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              border: '1px solid rgba(59, 130, 246, 0.3)'
                            }}>
                              ZONE A - Main Entrance
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFeed('feed1')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            background: feeds.feed1.isStreaming 
                              ? 'linear-gradient(45deg, #dc2626, #ec4899)' 
                              : 'linear-gradient(45deg, #059669, #10b981)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4)',
                            transform: 'scale(1)'
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                          {feeds.feed1.isStreaming ? <Pause style={{ width: '16px', height: '16px' }} /> : <Play style={{ width: '16px', height: '16px' }} />}
                          <span>{feeds.feed1.isStreaming ? 'STOP' : 'START'}</span>
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
                        {/* AI Detection Overlay */}
                        {feeds.feed1.isStreaming && (
                          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                            {/* Simulated Detection Boxes */}
                            <div style={{
                              position: 'absolute',
                              top: '25%',
                              left: '33%',
                              width: '96px',
                              height: '144px',
                              border: '2px solid #10b981',
                              borderRadius: '8px',
                              boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '-32px',
                                left: 0,
                                background: '#10b981',
                                color: 'black',
                                padding: '4px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700',
                                boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)'
                              }}>
                                PERSON 94%
                              </div>
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                width: '8px',
                                height: '8px',
                                background: '#10b981',
                                borderRadius: '50%',
                                animation: 'pulse 2s infinite'
                              }}></div>
                            </div>
                            <div style={{
                              position: 'absolute',
                              top: '50%',
                              right: '25%',
                              width: '80px',
                              height: '128px',
                              border: '2px solid #fbbf24',
                              borderRadius: '8px',
                              boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '-32px',
                                left: 0,
                                background: '#fbbf24',
                                color: 'black',
                                padding: '4px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700',
                                boxShadow: '0 4px 14px 0 rgba(251, 191, 36, 0.4)'
                              }}>
                                PERSON 78%
                              </div>
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                width: '8px',
                                height: '8px',
                                background: '#fbbf24',
                                borderRadius: '50%',
                                animation: 'pulse 2s infinite'
                              }}></div>
                            </div>
                            {/* Scanning Line Effect */}
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.1), transparent)',
                              animation: 'pulse 3s infinite'
                            }}></div>
                          </div>
                        )}
                        
                        {!feeds.feed1.isStreaming && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #0f172a, #1e293b, #0f172a)'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <VideoOff style={{ width: '80px', height: '80px', color: '#475569', margin: '0 auto 24px' }} />
                              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#cbd5e1', margin: '0 0 8px 0' }}>Camera Offline</h3>
                              <p style={{ color: '#64748b', margin: 0 }}>Click START to begin monitoring</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Live Indicator */}
                        {feeds.feed1.isStreaming && (
                          <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 20 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: 'rgba(220, 38, 38, 0.9)',
                              backdropFilter: 'blur(8px)',
                              color: 'white',
                              padding: '8px 16px',
                              borderRadius: '16px',
                              boxShadow: '0 4px 14px 0 rgba(220, 38, 38, 0.4)'
                            }}>
                              <div style={{
                                width: '12px',
                                height: '12px',
                                background: 'white',
                                borderRadius: '50%',
                                animation: 'pulse 2s infinite'
                              }}></div>
                              <span style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.1em' }}>LIVE</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Enhanced Stats Overlay */}
                        {feeds.feed1.isStreaming && (
                          <div style={{ position: 'absolute', bottom: '24px', left: '24px', zIndex: 20 }}>
                            <div style={{
                              background: 'rgba(0, 0, 0, 0.8)',
                              backdropFilter: 'blur(8px)',
                              color: 'white',
                              padding: '16px 24px',
                              borderRadius: '16px',
                              border: '1px solid rgba(148, 163, 184, 0.1)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <Users style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
                                  <div>
                                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#60a5fa' }}>{feeds.feed1.currentCount}</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>DETECTED</div>
                                  </div>
                                </div>
                                <div style={{ width: '1px', height: '32px', background: '#475569' }}></div>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Zone A</div>
                                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Main Entrance</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Feed 2 - Similar structure */}
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
                              animation: feeds.feed2.isStreaming ? 'pulse 2s infinite' : 'none',
                              boxShadow: feeds.feed2.isStreaming ? '0 0 20px rgba(16, 185, 129, 0.5)' : 'none'
                            }}></div>
                          </div>
                          <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>Camera Feed 2</h3>
                            <span style={{
                              fontSize: '12px',
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#6ee7b7',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              ZONE B - Lobby Area
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFeed('feed2')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            background: feeds.feed2.isStreaming 
                              ? 'linear-gradient(45deg, #dc2626, #ec4899)' 
                              : 'linear-gradient(45deg, #059669, #10b981)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4)',
                            transform: 'scale(1)'
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                          {feeds.feed2.isStreaming ? <Pause style={{ width: '16px', height: '16px' }} /> : <Play style={{ width: '16px', height: '16px' }} />}
                          <span>{feeds.feed2.isStreaming ? 'STOP' : 'START'}</span>
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
                        {/* AI Detection Overlay for Feed 2 */}
                        {feeds.feed2.isStreaming && (
                          <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                            <div style={{
                              position: 'absolute',
                              top: '33%',
                              left: '25%',
                              width: '88px',
                              height: '136px',
                              border: '2px solid #10b981',
                              borderRadius: '8px',
                              boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '-32px',
                                left: 0,
                                background: '#10b981',
                                color: 'black',
                                padding: '4px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700'
                              }}>
                                PERSON 96%
                              </div>
                            </div>
                            <div style={{
                              position: 'absolute',
                              top: '25%',
                              right: '33%',
                              width: '72px',
                              height: '120px',
                              border: '2px solid #06b6d4',
                              borderRadius: '8px',
                              boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '-32px',
                                left: 0,
                                background: '#06b6d4',
                                color: 'black',
                                padding: '4px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700'
                              }}>
                                PERSON 87%
                              </div>
                            </div>
                          </div>
                        )}
                        
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
                              <VideoOff style={{ width: '80px', height: '80px', color: '#475569', margin: '0 auto 24px' }} />
                              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#cbd5e1', margin: '0 0 8px 0' }}>Camera Offline</h3>
                              <p style={{ color: '#64748b', margin: 0 }}>Click START to begin monitoring</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Live Indicator */}
                        {feeds.feed2.isStreaming && (
                          <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 20 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: 'rgba(220, 38, 38, 0.9)',
                              backdropFilter: 'blur(8px)',
                              color: 'white',
                              padding: '8px 16px',
                              borderRadius: '16px',
                              boxShadow: '0 4px 14px 0 rgba(220, 38, 38, 0.4)'
                            }}>
                              <div style={{
                                width: '12px',
                                height: '12px',
                                background: 'white',
                                borderRadius: '50%',
                                animation: 'pulse 2s infinite'
                              }}></div>
                              <span style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.1em' }}>LIVE</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Enhanced Stats Overlay */}
                        {feeds.feed2.isStreaming && (
                          <div style={{ position: 'absolute', bottom: '24px', left: '24px', zIndex: 20 }}>
                            <div style={{
                              background: 'rgba(0, 0, 0, 0.8)',
                              backdropFilter: 'blur(8px)',
                              color: 'white',
                              padding: '16px 24px',
                              borderRadius: '16px',
                              border: '1px solid rgba(148, 163, 184, 0.1)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <Users style={{ width: '20px', height: '20px', color: '#10b981' }} />
                                  <div>
                                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{feeds.feed2.currentCount}</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>DETECTED</div>
                                  </div>
                                </div>
                                <div style={{ width: '1px', height: '32px', background: '#475569' }}></div>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Zone B</div>
                                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Lobby Area</div>
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
            
            {/* Right Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
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
                    <Activity style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '24px', fontWeight: '700', color: 'white', margin: 0 }}>Live Analytics</h3>
                    <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Real-time system metrics</p>
                  </div>
                </div>
                
                {/* Total Count Display */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '40px',
                  padding: '32px',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
                  borderRadius: '24px',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  boxShadow: '0 8px 32px rgba(6, 182, 212, 0.2)'
                }}>
                  <div style={{
                    fontSize: '64px',
                    fontWeight: '900',
                    background: 'linear-gradient(45deg, #06b6d4, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '12px'
                  }}>
                    {totalCount}
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>TOTAL DETECTED</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', color: '#10b981' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: '#10b981',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite'
                    }}></div>
                    <span style={{ fontWeight: '600' }}>REAL-TIME</span>
                  </div>
                </div>
                
                {/* Zone Metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ color: '#60a5fa', fontSize: '18px', fontWeight: '700' }}>Zone A</span>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        background: feeds.feed1.isStreaming ? '#10b981' : '#6b7280',
                        borderRadius: '50%',
                        animation: feeds.feed1.isStreaming ? 'pulse 2s infinite' : 'none',
                        boxShadow: feeds.feed1.isStreaming ? '0 0 20px rgba(16, 185, 129, 0.5)' : 'none'
                      }}></div>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#60a5fa', marginBottom: '8px' }}>{feeds.feed1.currentCount}</div>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>Main Entrance</div>
                  </div>
                  
                  <div style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ color: '#10b981', fontSize: '18px', fontWeight: '700' }}>Zone B</span>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        background: feeds.feed2.isStreaming ? '#10b981' : '#6b7280',
                        borderRadius: '50%',
                        animation: feeds.feed2.isStreaming ? 'pulse 2s infinite' : 'none',
                        boxShadow: feeds.feed2.isStreaming ? '0 0 20px rgba(16, 185, 129, 0.5)' : 'none'
                      }}></div>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>{feeds.feed2.currentCount}</div>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>Lobby Area</div>
                  </div>
                </div>
                
                {/* System Performance */}
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '16px' }}>System Performance</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Cpu style={{ width: '16px', height: '16px', color: '#fbbf24' }} />
                          <span style={{ fontSize: '14px', color: '#cbd5e1' }}>CPU Usage</span>
                        </div>
                        <span style={{ color: '#fbbf24', fontWeight: '700' }}>{systemStats.cpuUsage}%</span>
                      </div>
                      <div style={{ width: '100%', background: '#374151', borderRadius: '8px', height: '8px', marginTop: '8px' }}>
                        <div style={{
                          background: 'linear-gradient(45deg, #fbbf24, #f97316)',
                          height: '8px',
                          borderRadius: '8px',
                          width: `${systemStats.cpuUsage}%`,
                          transition: 'all 0.5s ease'
                        }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <HardDrive style={{ width: '16px', height: '16px', color: '#a855f7' }} />
                          <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Memory</span>
                        </div>
                        <span style={{ color: '#a855f7', fontWeight: '700' }}>{systemStats.memoryUsage}%</span>
                      </div>
                      <div style={{ width: '100%', background: '#374151', borderRadius: '8px', height: '8px', marginTop: '8px' }}>
                        <div style={{
                          background: 'linear-gradient(45deg, #a855f7, #ec4899)',
                          height: '8px',
                          borderRadius: '8px',
                          width: `${systemStats.memoryUsage}%`,
                          transition: 'all 0.5s ease'
                        }}></div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Signal style={{ width: '16px', height: '16px', color: '#10b981' }} />
                        <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Network</span>
                      </div>
                      <span style={{ color: '#10b981', fontWeight: '700' }}>{systemStats.networkLatency}ms</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Advanced Configuration */}
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
                    <h3 style={{ fontSize: '24px', fontWeight: '700', color: 'white', margin: 0 }}>AI Configuration</h3>
                    <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Neural network settings</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <label style={{ fontSize: '18px', fontWeight: '700', color: '#cbd5e1' }}>Detection Confidence</label>
                      <span style={{ color: '#06b6d4', fontSize: '20px', fontWeight: '700' }}>{(config.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.95"
                      step="0.05"
                      value={config.confidence}
                      onChange={(e) => setConfig({...config, confidence: parseFloat(e.target.value)})}
                      style={{
                        width: '100%',
                        height: '12px',
                        background: '#374151',
                        borderRadius: '8px',
                        appearance: 'none',
                        cursor: 'pointer',
                        accentColor: '#06b6d4'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '18px', fontWeight: '700', color: '#cbd5e1', marginBottom: '16px' }}>Alert Threshold</label>
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
                        borderRadius: '16px',
                        padding: '16px 24px',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '600'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: 'rgba(30, 41, 59, 0.3)',
                      borderRadius: '16px',
                      border: '1px solid rgba(71, 85, 105, 0.3)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Bell style={{ width: '24px', height: '24px', color: '#fbbf24' }} />
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>Smart Alerts</div>
                          <div style={{ fontSize: '14px', color: '#94a3b8' }}>AI-powered notifications</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfig({...config, alertEnabled: !config.alertEnabled})}
                        style={{
                          position: 'relative',
                          display: 'inline-flex',
                          height: '32px',
                          width: '56px',
                          alignItems: 'center',
                          borderRadius: '20px',
                          background: config.alertEnabled ? '#06b6d4' : '#6b7280',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <span style={{
                          display: 'inline-block',
                          height: '24px',
                          width: '24px',
                          transform: config.alertEnabled ? 'translateX(28px)' : 'translateX(4px)',
                          borderRadius: '50%',
                          background: 'white',
                          transition: 'transform 0.3s ease'
                        }} />
                      </button>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: 'rgba(30, 41, 59, 0.3)',
                      borderRadius: '16px',
                      border: '1px solid rgba(71, 85, 105, 0.3)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Target style={{ width: '24px', height: '24px', color: '#10b981' }} />
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>Motion Detection</div>
                          <div style={{ fontSize: '14px', color: '#94a3b8' }}>Advanced movement tracking</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfig({...config, motionDetection: !config.motionDetection})}
                        style={{
                          position: 'relative',
                          display: 'inline-flex',
                          height: '32px',
                          width: '56px',
                          alignItems: 'center',
                          borderRadius: '20px',
                          background: config.motionDetection ? '#10b981' : '#6b7280',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <span style={{
                          display: 'inline-block',
                          height: '24px',
                          width: '24px',
                          transform: config.motionDetection ? 'translateX(28px)' : 'translateX(4px)',
                          borderRadius: '50%',
                          background: 'white',
                          transition: 'transform 0.3s ease'
                        }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Smart Alerts */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                padding: '32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      padding: '12px',
                      background: 'linear-gradient(45deg, #ea580c, #dc2626)',
                      borderRadius: '16px'
                    }}>
                      <AlertTriangle style={{ width: '24px', height: '24px', color: 'white' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '24px', fontWeight: '700', color: 'white', margin: 0 }}>Smart Alerts</h3>
                      <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Security notifications</p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '14px',
                    background: 'rgba(234, 88, 12, 0.2)',
                    color: '#fed7aa',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid rgba(234, 88, 12, 0.3)',
                    fontWeight: '600'
                  }}>
                    {alerts.length} ACTIVE
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '384px', overflowY: 'auto' }}>
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      style={{
                        padding: '24px',
                        borderRadius: '16px',
                        borderLeft: `4px solid ${
                          alert.severity === 'high' 
                            ? '#ef4444' 
                            : alert.severity === 'medium'
                            ? '#fbbf24'
                            : '#3b82f6'
                        }`,
                        background: 'rgba(30, 41, 59, 0.3)',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        boxShadow: `0 8px 32px ${
                          alert.severity === 'high' 
                            ? 'rgba(239, 68, 68, 0.2)' 
                            : alert.severity === 'medium'
                            ? 'rgba(251, 191, 36, 0.2)'
                            : 'rgba(59, 130, 246, 0.2)'
                        }`
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(71, 85, 105, 0.4)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(30, 41, 59, 0.3)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>{alert.message}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#94a3b8' }}>
                            <Clock style={{ width: '16px', height: '16px' }} />
                            <span style={{ fontFamily: 'monospace' }}>{alert.time}</span>
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: alert.severity === 'high' 
                            ? 'rgba(239, 68, 68, 0.2)' 
                            : alert.severity === 'medium'
                            ? 'rgba(251, 191, 36, 0.2)'
                            : 'rgba(59, 130, 246, 0.2)',
                          color: alert.severity === 'high' 
                            ? '#fca5a5' 
                            : alert.severity === 'medium'
                            ? '#fcd34d'
                            : '#93c5fd',
                          border: `1px solid ${
                            alert.severity === 'high' 
                              ? 'rgba(239, 68, 68, 0.3)' 
                              : alert.severity === 'medium'
                              ? 'rgba(251, 191, 36, 0.3)'
                              : 'rgba(59, 130, 246, 0.3)'
                          }`
                        }}>
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
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
