import React, { useState } from 'react';
import { Heart, Share2, Trash2, Plus } from 'lucide-react';
import { CreatePost } from './CreatePost';

interface Post {
  id: number;
  image: string;
  caption?: string;
  likes: number;
  shares: number;
}

export function PostGrid() {
  const [isCreating, setIsCreating] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);

  const deletePost = (postId: number) => {
    if (confirm('Are you sure you want to delete this post?')) {
      setPosts(posts.filter(post => post.id !== postId));
    }
  };

  const handleCreatePost = (image: string, caption: string) => {
    const newPost = {
      id: Date.now(),
      image,
      caption,
      likes: 0,
      shares: 0
    };
    setPosts([newPost, ...posts]);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5 md:gap-1">
        <button
          onClick={() => setIsCreating(true)}
          className="aspect-square bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
        >
          <Plus className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
        </button>

        {posts.map((post) => (
          <div key={post.id} className="relative aspect-square group">
            <img
              src={post.image}
              alt={`Post ${post.id}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 text-white">
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-1">
                  <Heart className="w-5 h-5 md:w-6 md:h-6" />
                  <span>{post.likes.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Share2 className="w-5 h-5 md:w-6 md:h-6" />
                  <span>{post.shares.toLocaleString()}</span>
                </div>
              </div>
              <button 
                onClick={() => deletePost(post.id)}
                className="mt-2 p-2 hover:bg-red-500 rounded-full transition-colors"
              >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isCreating && (
        <CreatePost
          onClose={() => setIsCreating(false)}
          onCreatePost={handleCreatePost}
        />
      )}
    </>
  );
}