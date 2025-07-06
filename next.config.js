/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add strict mode control
  reactStrictMode: process.env.NODE_ENV === 'production',
  
  // Improve error reporting
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // Enhanced compiler options
  compiler: {
    // Remove console logs in production but keep errors
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Experimental features for debugging
  experimental: {
    // Enable better error overlay
    forceSwcTransforms: false,
    // Better source maps in development
    optimizeCss: false,
  },

  images: {
    domains: [
      'localhost',
      'your-api-domain.vercel.app',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel.app',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Enhanced headers for debugging
  async headers() {
    const headers = [
      {
        key: 'Cross-Origin-Embedder-Policy',
        value: 'unsafe-none',
      },
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin-allow-popups',
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=*, microphone=*, geolocation=()',
      },
    ];

    // Add development-specific headers
    if (process.env.NODE_ENV === 'development') {
      headers.push({
        key: 'X-Development-Mode',
        value: 'true'
      });
    }

    return [
      {
        source: '/(.*)',
        headers,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/:path*`
          : 'http://localhost:8000/:path*',
      },
    ];
  },

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize for client-side performance
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        punycode: false,
      };
    }

    // Enhanced error handling in development
    if (dev) {
      config.optimization = {
        ...config.optimization,
        // Better source maps for debugging
        minimize: false,
      };
    }

    // Add source map support for production debugging
    if (!dev && !isServer) {
      config.devtool = 'source-map';
    }

    // Better chunk splitting
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    };
    
    return config;
  },

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Better build output
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },

  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: false,
  },

  poweredByHeader: false,
  compress: true,
  swcMinify: true,
  trailingSlash: false,

  // Output standalone for better debugging
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
};

// Validate environment variables
const requiredEnvVars = [];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(`Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
}

module.exports = nextConfig;
