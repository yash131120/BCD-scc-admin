import React, { useState, useEffect } from 'react';
import { Plus, X, ExternalLink, Star, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Review {
  id: string;
  review_url: string;
  title: string;
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
    title: '',
    review_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Load reviews from database on component mount
  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line
  }, [cardId]);

  const loadReviews = async () => {
    if (!cardId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('review_links')
        .select('*')
        .eq('card_id', cardId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reviews:', error);
        return;
      }

      const formattedReviews: Review[] = (data || []).map(item => ({
        id: item.id,
        review_url: item.review_url,
        title: item.title,
        created_at: item.created_at
      }));

      onReviewsChange(formattedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async () => {
    if (!newReview.title.trim() || !newReview.review_url.trim()) {
      alert('Please fill in both title and review URL');
      return;
    }

    try {
      setUploading(true);

      const reviewData = {
        card_id: cardId,
        title: newReview.title,
        review_url: newReview.review_url,
        is_active: true
      };

      const { data, error } = await supabase
        .from('review_links')
        .insert(reviewData)
        .select()
        .single();

      if (error) throw error;

      const review: Review = {
        id: data.id,
        title: data.title,
        review_url: data.review_url,
        created_at: data.created_at
      };

      onReviewsChange([review, ...reviews]);
      setNewReview({
        title: '',
        review_url: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding review:', error);
      alert('Failed to add review link. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveReview = async (id: string) => {
    try {
      const { error } = await supabase
        .from('review_links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      onReviewsChange(reviews.filter(review => review.id !== id));
    } catch (error) {
      console.error('Error removing review:', error);
      alert('Failed to remove review link. Please try again.');
    }
  };

  const updateReviewTitle = async (id: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('review_links')
        .update({ title: newTitle })
        .eq('id', id);

      if (error) {
        console.error('Database error:', error);
        return;
      }

      // Update local state
      const updatedReviews = reviews.map(review =>
        review.id === id ? { ...review, title: newTitle } : review
      );
      onReviewsChange(updatedReviews);
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading reviews...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Review Links</h3>
          <p className="text-sm text-gray-600">Add links to your Google Reviews, testimonials, etc.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Review Link
        </button>
      </div>

      {/* Add Review Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Add Review Link</h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Google Reviews, Customer Testimonials"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review URL *
              </label>
              <input
                type="url"
                value={newReview.review_url}
                onChange={(e) => setNewReview({ ...newReview, review_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://review.sccinfotech.com/{business-name}"
              />
              <p className="text-xs text-gray-500 mt-1">
                Link to your Google Reviews, testimonials page, or any review platform
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddReview}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </div>
                ) : (
                  'Add Review Link'
                )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                  <input
                    type="text"
                    value={review.title}
                    onChange={(e) => updateReviewTitle(review.id, e.target.value)}
                    className="flex-1 text-sm font-medium px-2 py-1 bg-transparent border border-transparent rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Review title"
                    style={{ minWidth: 0 }}
                  />
                </div>
                <button
                  onClick={() => handleRemoveReview(review.id)}
                  className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove review link"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 truncate mt-2 mb-4" title={review.review_url}>
                {review.review_url}
              </p>
              <a
                href={review.review_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm w-fit"
              >
                <ExternalLink className="w-4 h-4" />
                View Reviews
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Review Links</h3>
          <p className="text-gray-600 mb-6">
            Add links to your Google Reviews, testimonials, or review platforms to build trust.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Review Link
          </button>
        </div>
      )}

      {/* Review Count Info */}
      {reviews.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {reviews.length} review link{reviews.length !== 1 ? 's' : ''} added
          </p>
        </div>
      )}
    </div>
  );
};