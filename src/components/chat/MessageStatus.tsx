import React from 'react';
import { Check } from 'lucide-react';

interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  className?: string;
}

export default function MessageStatus({ status, className = '' }: MessageStatusProps) {
  if (status === 'sending') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="w-3 h-3 rounded-full bg-gray-400/50" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`text-red-500 ${className}`}>
        <div className="w-3 h-3 rounded-full bg-red-500" />
      </div>
    );
  }

  return (
    <div className={`flex ${className} ${status === 'read' ? 'text-blue-500' : 'text-gray-400'}`}>
      <Check className="w-3 h-3" strokeWidth={3} />
      {(status === 'delivered' || status === 'read') && (
        <Check className="w-3 h-3 -ml-1" strokeWidth={3} />
      )}
    </div>
  );
} 