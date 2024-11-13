import React, { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface CreatePostProps {
  onClose: () => void;
  onCreatePost: (image: string, caption: string) => void;
}

export function CreatePost({ onClose, onCreatePost }: CreatePostProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  const handleImageSelect = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedImage) {
      onCreatePost(selectedImage, caption);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Create New Post</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {!selectedImage ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <ImageUpload
                onImageSelect={handleImageSelect}
                className="mx-auto flex flex-col items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ImagePlus className="w-12 h-12" />
                <span>Click to upload an image</span>
              </ImageUpload>
            </div>
          ) : (
            <div className="space-y-4">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full aspect-square object-cover rounded-lg"
              />
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                className="w-full p-2 border rounded-lg resize-none"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Change Image
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Share
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}