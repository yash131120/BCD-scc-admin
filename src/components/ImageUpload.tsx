import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { uploadAvatar, deleteAvatar, compressImage } from '../utils/uploadUtils';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (url: string | null) => void;
  userId: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onImageChange,
  userId,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      // Compress image before upload
      const compressedFile = await compressImage(file);
      
      // Delete old image if exists
      if (currentImageUrl) {
        await deleteAvatar(currentImageUrl);
      }

      // Upload new image
      const { url, error } = await uploadAvatar(compressedFile, userId);
      
      if (error) {
        alert(error);
      } else if (url) {
        onImageChange(url);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    setUploading(true);
    try {
      await deleteAvatar(currentImageUrl);
      onImageChange(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to remove image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {currentImageUrl ? (
        // Show current image with edit/remove options
        <div className="relative group items-center justify-center ml-5">
          <img
            src={currentImageUrl}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
          />
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black bg-opacity-50 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                title="Change image"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleRemoveImage}
                disabled={uploading}
                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Show upload area
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 ${
            dragOver ? 'border-blue-500 bg-blue-50' : ''
          } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-xs text-gray-500 text-center px-2">
                Click or drag image here
              </span>
            </>
          )}
        </div>
      )}

      {/* Upload instructions */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-500">
          Supports JPEG, PNG, WebP, GIF
        </p>
        <p className="text-xs text-gray-400">
          Max size: 5MB
        </p>
      </div>
    </div>
  );
};