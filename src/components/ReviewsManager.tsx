import React, { useState } from 'react';
import { Star, Plus, X, ExternalLink, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_email?: string;
  reviewer_avatar?: string;
  rating: number;
  comment: string;
  source_url?: string;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
}

interface ReviewsManagerProps {
  cardId: string;
  reviews: Review[];
  onReviewsChange: (reviews: Review[]) => void;
}

export const ReviewsManager: React.FC<ReviewsManagerProps> = ({
  cardId,
  reviews,
  onReviewsChange
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReview, setNewReview] = useState({
    reviewer_name: '',
    reviewer_email: '',
    rating: 5,
    comment: '',
    source_url: ''
  });

  const handleAddReview = async () => {
    if (!newReview.reviewer_name.trim() || !newReview.comment.trim()) {
      alert('Please fill in reviewer name and comment');
      return;
    }

    try {
      const reviewData = {
        card_id: cardId,
        reviewer_name: newReview.reviewer_name,
        reviewer_email: newReview.reviewer_email || null,
        rating: newReview.rating,
        comment: newReview.comment,
        source_url: newReview.source_url || null,
        is_verified: false,
        is_featured: false,
        is_active: true
      };

      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) throw error;

      const review: Review = {
        id: data.id,
        reviewer_name: data.reviewer_name,
        reviewer_email: data.reviewer_email,
        reviewer_avatar: data.reviewer_avatar,
        rating: data.rating,
        comment: data.comment,
        source_url: data.source_url,
        is_verified: data.is_verified,
        is_featured: data.is_featured,
        created_at: data.created_at
      };

      onReviewsChange([...reviews, review]);
      setNewReview({
        reviewer_name: '',
        reviewer_email: '',
        rating: 5,
        comment: '',
        source_url: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding review:', error);
      alert('Failed to add review. Please try again.');
    }
  };

  const handleRemoveReview = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      onReviewsChange(reviews.filter(review => review.id !== id));
    } catch (error) {
      console.error('Error removing review:', error);
      alert('Failed to remove review. Please try again.');
    }
  };

  const toggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_featured: !currentFeatured })
        .eq('id', id);

      if (error) throw error;

      onReviewsChange(reviews.map(review =>
        review.id === id ? { ...review, is_featured: !currentFeatured } : review
      ));
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 cursor-pointer transition-colors ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
        onClick={() => interactive && onChange && onChange(i + 1)}
      />
    ));
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Customer Reviews</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex">{renderStars(Math.round(parseFloat(averageRating)))}</div>
            <span className="text-sm text-gray-600">
              {averageRating} ({reviews.length} reviews)
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Review
        </button>
      </div>

      {/* Add Review Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Add New Review</h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reviewer Name *
                </label>
                <input
                  type="text"
                  value={newReview.reviewer_name}
                  onChange={(e) => setNewReview({ ...newReview, reviewer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Customer name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={newReview.reviewer_email}
                  onChange={(e) => setNewReview({ ...newReview, reviewer_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="customer@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating *
              </label>
              <div className="flex gap-1">
                {renderStars(newReview.rating, true, (rating) => 
                  setNewReview({ ...newReview, rating })
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Comment *
              </label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What did the customer say about your service?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source URL (optional)
              </label>
              <input
                type="url"
                value={newReview.source_url}
                onChange={(e) => setNewReview({ ...newReview, source_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://google.com/reviews/... or https://facebook.com/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Link to the original review (Google, Facebook, etc.)
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddReview}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Review
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {review.reviewer_avatar ? (
                        <img
                          src={review.reviewer_avatar}
                          alt={review.reviewer_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{review.reviewer_name}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(review.rating)}</div>
                        <span className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-2">"{review.comment}"</p>
                  
                  {review.source_url && (
                    <a
                      href={review.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Original
                    </a>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleFeatured(review.id, review.is_featured)}
                    className={`px-2 py-1 text-xs rounded ${
                      review.is_featured
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {review.is_featured ? 'Featured' : 'Feature'}
                  </button>
                  <button
                    onClick={() => handleRemoveReview(review.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-600 mb-6">
            Add customer reviews to build trust and showcase your excellent service.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Review
          </button>
        </div>
      )}
    </div>
  );
};