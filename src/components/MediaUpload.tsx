import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Video, FileText, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
}

interface MediaUploadProps {
  cardId: string;
  mediaItems: MediaItem[];
  onMediaChange: (items: MediaItem[]) => void;
  userId: string;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  cardId,
  mediaItems,
  onMediaChange,
  userId
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, type: 'image' | 'document') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${cardId}/${type}-${Date.now()}.${fileExt}`;
    const bucket = type === 'image' ? 'media' : 'documents';

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleFileSelect = async (files: FileList) => {
    if (!files.length) return;

    setUploading(true);
    try {
      const newItems: MediaItem[] = [];

      for (const file of Array.from(files)) {
        let type: 'image' | 'video' | 'document' = 'document';
        
        if (file.type.startsWith('image/')) {
          type = 'image';
        } else if (file.type.startsWith('video/')) {
          type = 'video';
        }

        const url = await uploadFile(file, type === 'video' ? 'image' : type);
        
        const mediaItem: MediaItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type,
          url,
          title: file.name.split('.')[0],
          description: ''
        };

        // Save to database
        const { error } = await supabase
          .from('media_items')
          .insert({
            card_id: cardId,
            type: mediaItem.type,
            title: mediaItem.title,
            description: mediaItem.description,
            url: mediaItem.url,
            file_size: file.size,
            mime_type: file.type
          });

        if (!error) {
          newItems.push(mediaItem);
        }
      }

      onMediaChange([...mediaItems, ...newItems]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUrlAdd = async () => {
    if (!newVideoUrl.trim()) return;

    try {
      const mediaItem: MediaItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: 'video',
        url: newVideoUrl,
        title: 'Video Link',
        description: ''
      };

      // Save to database
      const { error } = await supabase
        .from('media_items')
        .insert({
          card_id: cardId,
          type: mediaItem.type,
          title: mediaItem.title,
          description: mediaItem.description,
          url: mediaItem.url
        });

      if (!error) {
        onMediaChange([...mediaItems, mediaItem]);
        setNewVideoUrl('');
      }
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Failed to add video. Please try again.');
    }
  };

  const removeMediaItem = async (id: string) => {
    try {
      // Remove from database
      await supabase
        .from('media_items')
        .delete()
        .eq('id', id);

      onMediaChange(mediaItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing media:', error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return ImageIcon;
      case 'video':
        return Video;
      case 'document':
        return FileText;
      default:
        return FileText;
    }
  };

  return (
    <div className="space-y-6">
      {/* Video URL Input */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Add Video Link</h4>
        <div className="flex gap-2">
          <input
            type="url"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            placeholder="Paste YouTube, Vimeo, or other video URL"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleVideoUrlAdd}
            disabled={!newVideoUrl.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Media Items Grid */}
      {mediaItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaItems.map((item) => {
            const Icon = getMediaIcon(item.type);
            
            return (
              <div key={item.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <Icon className="w-8 h-8 text-gray-600 mb-2" />
                      <span className="text-xs text-gray-600 text-center px-2">
                        {item.title}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => removeMediaItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Title */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const updatedItems = mediaItems.map(media =>
                        media.id === item.id ? { ...media, title: e.target.value } : media
                      );
                      onMediaChange(updatedItems);
                    }}
                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Title"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mediaItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p>No media files uploaded yet.</p>
          <p className="text-sm">Upload images, videos, or documents to showcase your work.</p>
        </div>
      )}
    </div>
  );
};