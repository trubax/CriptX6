import React, { useState } from 'react';
import { MapPin, Link2, Camera, Edit2, Check, X } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface ProfileData {
  name: string;
  bio: string;
  location: string;
  website: string;
  avatar: string;
  servicesOffered: string[];
  servicesNeeded: string[];
}

export function ProfileInfo() {
  const [isEditing, setIsEditing] = useState(false);
  const [newService, setNewService] = useState({ offered: '', needed: '' });
  
  const [profile, setProfile] = useState<ProfileData>({
    name: 'John Doe',
    bio: 'Digital creator\nCapturing life\'s moments one photo at a time ✨\nCreating content that inspires',
    location: 'New York, USA',
    website: 'linktr.ee/johndoe',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
    servicesOffered: ['Photography', 'Video Editing', 'Social Media Management'],
    servicesNeeded: ['Graphic Design', 'Web Development']
  });

  const [editedProfile, setEditedProfile] = useState(profile);

  const [stats] = React.useState({
    posts: 0,
    followers: 0,
    following: 0
  });

  const handleProfilePhotoChange = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setEditedProfile({ ...editedProfile, avatar: imageUrl });
  };

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const addService = (type: 'offered' | 'needed') => {
    const service = type === 'offered' ? newService.offered : newService.needed;
    if (service.trim()) {
      const key = type === 'offered' ? 'servicesOffered' : 'servicesNeeded';
      setEditedProfile({
        ...editedProfile,
        [key]: [...editedProfile[key], service.trim()]
      });
      setNewService({ ...newService, [type]: '' });
    }
  };

  const removeService = (type: 'offered' | 'needed', index: number) => {
    const key = type === 'offered' ? 'servicesOffered' : 'servicesNeeded';
    setEditedProfile({
      ...editedProfile,
      [key]: editedProfile[key].filter((_, i) => i !== index)
    });
  };

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <div className="flex flex-col items-center">
        {/* Profile Image */}
        <div className="relative group mb-6">
          <img
            src={isEditing ? editedProfile.avatar : profile.avatar}
            alt="Profile"
            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-2 border-gray-200"
          />
          {isEditing && (
            <ImageUpload
              onImageSelect={handleProfilePhotoChange}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="w-8 h-8 text-white" />
            </ImageUpload>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 md:gap-16 mb-6 w-full">
          <div className="text-center">
            <div className="font-semibold text-lg">{stats.posts.toLocaleString()}</div>
            <div className="text-gray-500">Posts</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">{stats.followers.toLocaleString()}</div>
            <div className="text-gray-500">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">{stats.following.toLocaleString()}</div>
            <div className="text-gray-500">Following</div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="text-center w-full max-w-md">
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editedProfile.name}
                onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                className="w-full text-xl font-semibold text-center border rounded-lg px-3 py-2"
              />
              <textarea
                value={editedProfile.bio}
                onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                className="w-full text-center border rounded-lg px-3 py-2 resize-none"
                rows={3}
              />
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4" />
                <input
                  type="text"
                  value={editedProfile.location}
                  onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                  className="border rounded-lg px-3 py-1 text-center"
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <Link2 className="w-4 h-4" />
                <input
                  type="text"
                  value={editedProfile.website}
                  onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
                  className="border rounded-lg px-3 py-1 text-center"
                />
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-semibold text-xl">{profile.name}</h2>
              <div className="whitespace-pre-line text-gray-600 mt-2">{profile.bio}</div>
              <div className="flex items-center justify-center gap-2 text-gray-600 mt-2">
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-blue-600 mt-1">
                <Link2 className="w-4 h-4" />
                <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {profile.website}
                </a>
              </div>
            </>
          )}

          {/* Edit Controls */}
          <div className="mt-4">
            {isEditing ? (
              <div className="flex justify-center gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <Check className="w-4 h-4" /> Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 mx-auto"
              >
                <Edit2 className="w-4 h-4" /> Edit Profile
              </button>
            )}
          </div>

          {/* Services Section */}
          <div className="mt-8 space-y-6">
            {/* Services Offered */}
            <div className="text-left">
              <h3 className="font-semibold text-lg mb-2">Services Offered</h3>
              <div className="flex flex-wrap gap-2">
                {(isEditing ? editedProfile : profile).servicesOffered.map((service, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {service}
                    {isEditing && (
                      <button onClick={() => removeService('offered', index)} className="hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </span>
                ))}
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newService.offered}
                      onChange={(e) => setNewService({ ...newService, offered: e.target.value })}
                      placeholder="Add service..."
                      className="border rounded-lg px-3 py-1 text-sm"
                    />
                    <button
                      onClick={() => addService('offered')}
                      className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Services Needed */}
            <div className="text-left">
              <h3 className="font-semibold text-lg mb-2">Services Needed</h3>
              <div className="flex flex-wrap gap-2">
                {(isEditing ? editedProfile : profile).servicesNeeded.map((service, index) => (
                  <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {service}
                    {isEditing && (
                      <button onClick={() => removeService('needed', index)} className="hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </span>
                ))}
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newService.needed}
                      onChange={(e) => setNewService({ ...newService, needed: e.target.value })}
                      placeholder="Add needed service..."
                      className="border rounded-lg px-3 py-1 text-sm"
                    />
                    <button
                      onClick={() => addService('needed')}
                      className="bg-purple-500 text-white p-1 rounded-full hover:bg-purple-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}