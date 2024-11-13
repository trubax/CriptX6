import React from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineAlert() {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-orange-600/20 border border-orange-600/30 rounded-lg flex items-center gap-2 text-orange-400 z-50 backdrop-blur-sm">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm">Modalità offline - Le modifiche verranno sincronizzate quando tornerai online</span>
    </div>
  );
}