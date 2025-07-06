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
