'use client'

import SecurityDashboard from '@/components/SecurityDashboard'
import { Suspense } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-900">
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <SecurityDashboard />
        </Suspense>
      </ErrorBoundary>
    </main>
  )
}
