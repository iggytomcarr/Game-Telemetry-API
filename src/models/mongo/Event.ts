import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  gameId: string;
  eventType: 'crash' | 'performance' | 'session' | 'custom';
  severity: 'info' | 'warning' | 'critical';
  payload: Record<string, any>;
  timestamp: Date;
  processedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  gameId: { 
    type: String, 
    required: true, 
    index: true 
  },
  eventType: { 
    type: String, 
    required: true,
    enum: ['crash', 'performance', 'session', 'custom']
  },
  severity: { 
    type: String, 
    default: 'info',
    enum: ['info', 'warning', 'critical']
  },
  payload: { 
    type: Schema.Types.Mixed, 
    default: {} 
  },
  timestamp: { 
    type: Date, 
    required: true,
    index: true
  },
  processedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound indexes for common queries
EventSchema.index({ gameId: 1, timestamp: -1 });
EventSchema.index({ gameId: 1, eventType: 1, timestamp: -1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);
