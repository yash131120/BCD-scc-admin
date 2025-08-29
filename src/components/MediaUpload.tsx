import React, { useState, useEffect } from 'react';
import { X, Loader2, Video, Plus, ExternalLink, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MediaItem {
  id: string;
  type: 'video';
  url: string;
  title: string;
  description?: string;
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
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);

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
        .eq('type', 'video')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error loading media items:', error);
        return;
      }

      const formattedItems: MediaItem[] = (data || []).map(item => ({
        id: item.id,
        type: 'video',
        url: item.url,
        title: item.title,
        description: item.description || undefined
      }));

      onMediaChange(formattedItems);
    } catch (error) {
      console.error('Error loading media items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVideoEmbedUrl = (url: string) => {
    // YouTube
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Vimeo
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    return null;
  };

  const getVideoThumbnail = (url: string) => {
    // YouTube thumbnail
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    
    return null;
  };

  const handleVideoUrlAdd = async () => {
    if (!newVideoUrl.trim()) return;

    try {
      setUploading(true);
      
      // Extract title from URL or use default
      let title = 'Video Link';
      if (newVideoUrl.includes('youtube.com') || newVideoUrl.includes('youtu.be')) {
        title = 'YouTube Video';
      } else if (newVideoUrl.includes('vimeo.com')) {
        title = 'Vimeo Video';
      }
      
      // Save to database first
      const { data, error } = await supabase
        .from('media_items')
        .insert({
          card_id: cardId,
          type: 'video',
          title: title,
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
        alert('Failed to remove video link. Please try again.');
        return;
      }

      // Update local state
      onMediaChange(mediaItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing video:', error);
      alert('Failed to remove video link. Please try again.');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading videos...</span>
      </div>
    );
  }

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

      {/* Video Links Grid */}
      {mediaItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mediaItems.map((item) => {
            const embedUrl = getVideoEmbedUrl(item.url);
            const thumbnail = getVideoThumbnail(item.url);
            
            return (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Video Preview */}
                <div className="relative aspect-video bg-gray-100">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title={item.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : thumbnail ? (
                    <div className="relative w-full h-full">
                      <img
                        src={thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="text-center">
                        <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Video Preview</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Remove button */}
                  <button
                    onClick={() => removeMediaItem(item.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg"
                    title="Remove video"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Video Info */}
                <div className="p-4">
                  
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate flex-1 mr-2" title={item.url}>
                      {item.url}
                    </p>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Open video"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Video Links</h3>
          <p className="text-gray-600 mb-4">
            Add video links to showcase your work and content.
          </p>
          <p className="text-sm text-gray-500">
            Supports YouTube, Vimeo, Dailymotion, Twitch, and other video platforms.
          </p>
        </div>
      )}

      {/* Video Count Info */}
      {mediaItems.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {mediaItems.length} video link{mediaItems.length !== 1 ? 's' : ''} added
          </p>
        </div>
      )}
    </div>
  );
};