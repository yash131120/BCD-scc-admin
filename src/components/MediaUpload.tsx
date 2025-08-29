import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Video, FileText, Plus, ExternalLink } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load media items from database on component mount
  useEffect(() => {
    loadMediaItems();
  }, [cardId]);

  const loadMediaItems = async () => {
    if (!cardId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .eq('card_id', cardId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error loading media items:', error);
        return;
      }

      const formattedItems: MediaItem[] = (data || []).map(item => ({
        id: item.id,
        type: item.type as 'image' | 'video' | 'document',
        url: item.url,
        title: item.title,
        description: item.description || undefined,
        thumbnail_url: item.thumbnail_url || undefined
      }));

      onMediaChange(formattedItems);
    } catch (error) {
      console.error('Error loading media items:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, type: 'image' | 'document') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${cardId}/${type}-${Date.now()}.${fileExt}`;
    const bucket = type === 'image' ? 'avatars' : 'avatars'; // Using avatars bucket for now

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
        
        // Save to database first
        const { data, error } = await supabase
          .from('media_items')
          .insert({
            card_id: cardId,
            type: type,
            title: file.name.split('.')[0],
            description: '',
            url: url,
            file_size: file.size,
            mime_type: file.type,
            display_order: mediaItems.length + newItems.length,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          continue;
        }

        const mediaItem: MediaItem = {
          id: data.id,
          type: data.type as 'image' | 'video' | 'document',
          url: data.url,
          title: data.title,
          description: data.description || undefined
        };

        newItems.push(mediaItem);
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
      setUploading(true);
      
      // Save to database first
      const { data, error } = await supabase
        .from('media_items')
        .insert({
          card_id: cardId,
          type: 'video',
          title: 'Video Link',
          description: '',
          url: newVideoUrl,
          display_order: mediaItems.length,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        alert('Failed to add video link. Please try again.');
        return;
      }

      const mediaItem: MediaItem = {
        id: data.id,
        type: 'video',
        url: data.url,
        title: data.title,
        description: data.description || undefined
      };

      onMediaChange([...mediaItems, mediaItem]);
      setNewVideoUrl('');
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Failed to add video. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeMediaItem = async (id: string) => {
    try {
      // Remove from database
      const { error } = await supabase
        .from('media_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database error:', error);
        alert('Failed to remove media item. Please try again.');
        return;
      }

      // Update local state
      onMediaChange(mediaItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing media:', error);
      alert('Failed to remove media item. Please try again.');
    }
  };

  const updateMediaTitle = async (id: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('media_items')
        .update({ title: newTitle })
        .eq('id', id);

      if (error) {
        console.error('Database error:', error);
        return;
      }

      // Update local state
      const updatedItems = mediaItems.map(media =>
        media.id === id ? { ...media, title: newTitle } : media
      );
      onMediaChange(updatedItems);
    } catch (error) {
      console.error('Error updating title:', error);
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

  const isVideoUrl = (url: string) => {
    return url.includes('youtube.com') || 
           url.includes('youtu.be') || 
           url.includes('vimeo.com') || 
           url.includes('dailymotion.com') ||
           url.includes('twitch.tv');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading media...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          multiple
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Media Files</h4>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to browse
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Choose Files
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Supports images, videos, and documents (max 50MB)
        </p>
      </div>

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
            disabled={!newVideoUrl.trim() || uploading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Supports YouTube, Vimeo, Dailymotion, Twitch, and other video platforms
        </p>
      </div>

      {/* Media Items Grid */}
      {mediaItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaItems.map((item) => {
            const Icon = getMediaIcon(item.type);
            
            return (
              <div key={item.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : item.type === 'video' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-purple-50">
                      <Video className="w-8 h-8 text-red-600 mb-2" />
                      <span className="text-xs text-gray-600 text-center px-2 font-medium">
                        Video Link
                      </span>
                      {isVideoUrl(item.url) && (
                        <ExternalLink className="w-4 h-4 text-gray-400 mt-1" />
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <Icon className="w-8 h-8 text-gray-600 mb-2" />
                      <span className="text-xs text-gray-600 text-center px-2">
                        Document
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                    {item.type === 'video' && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all"
                        title="Open video"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => removeMediaItem(item.id)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
                      title="Remove item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Title */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateMediaTitle(item.id, e.target.value)}
                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Title"
                  />
                  {item.type === 'video' && (
                    <p className="text-xs text-gray-500 mt-1 truncate" title={item.url}>
                      {item.url}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Media Files</h3>
          <p className="text-gray-600 mb-4">
            Upload images, videos, or documents to showcase your work.
          </p>
          <p className="text-sm text-gray-500">
            You can upload files or add video links from platforms like YouTube and Vimeo.
          </p>
        </div>
      )}

      {/* Media Count Info */}
      {mediaItems.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {mediaItems.length} media item{mediaItems.length !== 1 ? 's' : ''} added
          </p>
        </div>
      )}
    </div>
  );
};