'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Bug, ExternalLink } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; reset?: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    console.error('ErrorBoundary caught error:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Production Error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error || undefined} reset={this.handleReset} />
      }

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Application Error</h2>
            <p className="text-gray-400 mb-4">
              A client-side error occurred. This might be due to a temporary issue.
            </p>
            
            {/* Error Details */}
            {this.state.error && (
              <div className="bg-gray-900 rounded-lg p-4 mb-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">Error Details</span>
                </div>
                <pre className="text-xs text-gray-300 overflow-auto max-h-32 whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Go Home</span>
              </button>
            </div>

            {/* Development Info */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer mb-2">
                  Development Details
                </summary>
                <div className="bg-gray-900 rounded p-3">
                  <h4 className="text-sm font-medium text-red-400 mb-2">Component Stack:</h4>
                  <pre className="text-xs text-gray-400 overflow-auto max-h-40 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                  {this.state.error?.stack && (
                    <>
                      <h4 className="text-sm font-medium text-red-400 mb-2 mt-4">Error Stack:</h4>
                      <pre className="text-xs text-gray-400 overflow-auto max-h-40 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <p className="text-xs text-gray-500 mt-4">
              If this issue persists, please check the browser console for more details.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
