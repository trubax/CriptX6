import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { CreateStory } from './CreateStory';

interface Story {
  id: number;
  title: string;
  image: string;
}

export function StoryHighlights() {
  const [isCreating, setIsCreating] = useState(false);
  const [stories, setStories] = useState<Story[]>([
    { id: 1, title: 'Travel', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=100&h=100&fit=crop' },
    { id: 2, title: 'Food', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&h=100&fit=crop' },
    { id: 3, title: 'Nature', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=100&h=100&fit=crop' },
    { id: 4, title: 'Work', image: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=100&h=100&fit=crop' },
  ]);

  const handleCreateStory = (image: string) => {
    const newStory = {
      id: Date.now(),
      title: 'New Story',
      image,
    };
    setStories([newStory, ...stories]);
  };

  return (
    <>
      <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
        <button 
          onClick={() => setIsCreating(true)}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors">
            <Plus className="w-6 h-6 text-gray-600" />
          </div>
          <span className="text-xs">New Story</span>
        </button>

        {stories.map((story) => (
          <button 
            key={story.id} 
            className="flex flex-col items-center gap-1 focus:outline-none"
            onClick={() => alert(`Opening ${story.title} story...`)}
          >
            <div className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors">
              <img
                src={story.image}
                alt={story.title}
                className="w-14 h-14 rounded-full object-cover"
              />
            </div>
            <span className="text-xs">{story.title}</span>
          </button>
        ))}
      </div>

      {isCreating && (
        <CreateStory
          onClose={() => setIsCreating(false)}
          onCreateStory={handleCreateStory}
        />
      )}
    </>
  );
}