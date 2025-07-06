// src/components/LoadingSpinner.tsx
'use client'

import React from 'react'
import { Shield } from 'lucide-react'

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <Shield className="h-16 w-16 text-blue-400 mx-auto animate-pulse" />
          <div className="absolute inset-0 h-16 w-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-white">Loading AI Security System</h2>
        <p className="mt-2 text-gray-400">Initializing ultra-sensitive detection...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner

// src/components/ErrorBoundary.tsx
'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
            <p className="text-gray-400 mb-4">
              The security system encountered an error. Please try refreshing the page.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh Page</span>
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full btn-secondary"
              >
                Try Again
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">Error Details</summary>
                <pre className="text-xs text-red-400 mt-2 overflow-auto max-h-32">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// src/types/index.ts
export interface Detection {
  center: [number, number]
  bbox: [number, number, number, number]
  confidence: number
  area: number
  width: number
  height: number
}

export interface FeedStats {
  fps: number
  avgProcessingTime: number
}

export interface Feed {
  isStreaming: boolean
  currentCount: number
  detections: Detection[]
  stats: FeedStats
}

export interface Alert {
  id: number
  feedId?: string
  message: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  people_count?: number
}

export interface Config {
  confidence: number
  maxPeople: number
  alertEnabled: boolean
  realtimeMode: boolean
}

export interface DetectionResult {
  frame_id: string
  timestamp: string
  people_count: number
  detections: Detection[]
  confidence_threshold: number
  processing_time_ms: number
  model_info: {
    models_used: number
    realtime_mode: boolean
    device: string
    feed_id: string
  }
  performance_stats: {
    current_fps: number
    target_fps: number
    raw_detections: number
    filtered_detections: number
  }
}

export interface WebSocketMessage {
  type: 'frame' | 'detection_result' | 'alert' | 'ping' | 'pong'
  data?: any
  [key: string]: any
}
