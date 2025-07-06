
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
