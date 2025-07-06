import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Security Surveillance',
  description: 'Advanced AI-powered security surveillance system',
}

// Add error handling for layout
function SafeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Add meta tags for better debugging */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        {/* Disable Strict Mode in development if needed */}
        {process.env.NODE_ENV === 'development' && (
          <script dangerouslySetInnerHTML={{
            __html: `
              console.log('App loading in development mode');
              window.addEventListener('error', function(e) {
                console.error('Global error caught:', e.error);
              });
              window.addEventListener('unhandledrejection', function(e) {
                console.error('Unhandled promise rejection:', e.reason);
              });
            `
          }} />
        )}
      </head>
      <body className={`${inter.className} bg-gray-900 text-white antialiased`}>
        <ErrorBoundary>
          <div id="root">
            {children}
          </div>
        </ErrorBoundary>
        
        {/* Development debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div id="dev-info" style={{ 
            position: 'fixed', 
            bottom: '10px', 
            right: '10px', 
            background: 'rgba(0,0,0,0.8)', 
            color: 'white', 
            padding: '8px', 
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 9999,
            fontFamily: 'monospace'
          }}>
            <div>Next.js: {process.env.NODE_ENV}</div>
            <div>React: {React.version}</div>
          </div>
        )}
      </body>
    </html>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    return <SafeLayout>{children}</SafeLayout>
  } catch (error) {
    console.error('Layout error:', error)
    // Fallback layout
    return (
      <html lang="en">
        <body>
          <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#111827',
            color: 'white',
            fontFamily: 'system-ui'
          }}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <h1>Application Error</h1>
              <p>Please refresh the page</p>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Reload
              </button>
            </div>
          </div>
        </body>
      </html>
    )
  }
}
