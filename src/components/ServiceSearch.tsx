import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';

interface Service {
  id: number;
  type: 'offered' | 'needed';
  title: string;
  provider: string;
  location: string;
  distance: number;
  avatar: string;
}

export function ServiceSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults] = useState<Service[]>([
    {
      id: 1,
      type: 'offered',
      title: 'Professional Photography',
      provider: 'Jane Smith',
      location: 'Brooklyn, NY',
      distance: 2.5,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
    },
    {
      id: 2,
      type: 'needed',
      title: 'Web Development',
      provider: 'Mike Johnson',
      location: 'Manhattan, NY',
      distance: 3.8,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
    }
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for services..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        {searchResults.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <img
              src={service.avatar}
              alt={service.provider}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{service.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  service.type === 'offered' 
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {service.type === 'offered' ? 'Offering' : 'Needed'}
                </span>
              </div>
              <p className="text-gray-600 text-sm">{service.provider}</p>
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <MapPin className="w-4 h-4" />
                <span>{service.location}</span>
                <span className="mx-1">•</span>
                <span>{service.distance} miles away</span>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Contact
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}