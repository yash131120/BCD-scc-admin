import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Settings,
  Eye,
  Share2,
  BarChart3,
  LogOut,
  Save,
  Globe,
  Palette,
  Layout,
  Camera,
  Phone,
  Mail,
  Building,
  Briefcase,
  MapPin,
  MessageCircle,
  Plus,
  X,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  Star
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { CardPreview } from './CardPreview';
import { ImageUpload } from './ImageUpload';
import { MediaUpload } from './MediaUpload';
import { ReviewsManager } from './ReviewsManager';
import { generateSocialLink, SOCIAL_PLATFORMS } from '../utils/socialUtils';
import type { Database } from '../lib/supabase';

type BusinessCard = Database['public']['Tables']['business_cards']['Row'];
type SocialLink = Database['public']['Tables']['social_links']['Row'];

interface MediaItem {
  id: string;
  type: 'video';
  url: string;
  title: string;
  description?: string;
}

interface Review {
  id: string;
  review_url: string;
  title: string;
  created_at: string;
}

interface FormData {
  // Basic Information
  title: string;
  username: string;
  globalUsername: string;
  company: string;
  tagline: string;
  profession: string;
  avatar_url: string;

  // Contact Information
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  map_link: string;

  // Theme and Layout
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    name: string;
  };
  shape: string;
  layout: {
    style: string;
    alignment: string;
    font: string;
  };
  is_published: boolean;
}

const THEMES = [
  { name: 'Ocean Blue', primary: '#3B82F6', secondary: '#1E40AF', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Forest Green', primary: '#10B981', secondary: '#047857', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Sunset Orange', primary: '#F59E0B', secondary: '#D97706', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Royal Purple', primary: '#8B5CF6', secondary: '#7C3AED', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Rose Pink', primary: '#EC4899', secondary: '#DB2777', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Dark Mode', primary: '#60A5FA', secondary: '#3B82F6', background: '#1F2937', text: '#F9FAFB' },
];

const FONTS = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins'];

export const AdminPanel: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [cardId, setCardId] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [newSocialLink, setNewSocialLink] = useState({
    platform: 'Instagram',
    username: '',
    url: ''
  });

  const [formData, setFormData] = useState<FormData>({
    title: '',
    username: '',
    globalUsername: '',
    company: '',
    tagline: '',
    profession: '',
    avatar_url: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    address: '',
    map_link: '',
    theme: THEMES[0],
    shape: 'rectangle',
    layout: {
      style: 'modern',
      alignment: 'center',
      font: 'Inter'
    },
    is_published: false
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Load business card
      const { data: card } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (card) {
        setCardId(card.id);
        const cardTheme = card.theme as any || THEMES[0];
        const cardLayout = card.layout as any || { style: 'modern', alignment: 'center', font: 'Inter' };

        setFormData({
          title: card.title || '',
          username: card.slug || '',
          globalUsername: profile?.global_username || '',
          company: card.company || '',
          tagline: card.bio || '',
          profession: card.position || '',
          avatar_url: card.avatar_url || '',
          phone: card.phone || '',
          whatsapp: card.whatsapp || '',
          email: card.email || '',
          website: card.website || '',
          address: card.address || '',
          map_link: card.map_link || '',
          theme: cardTheme,
          shape: card.shape || 'rectangle',
          layout: cardLayout,
          is_published: card.is_published || false
        });

        // Load social links
        const { data: socialData } = await supabase
          .from('social_links')
          .select('*')
          .eq('card_id', card.id)
          .order('display_order');

        setSocialLinks(socialData || []);
      } else {
        // Set default values from profile
        setFormData(prev => ({
          ...prev,
          title: profile?.name || '',
          email: profile?.email || user.email || '',
          globalUsername: profile?.global_username || ''
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setSaveStatus('idle');

      // Update or create business card
      const cardData = {
        user_id: user.id,
        title: formData.title,
        company: formData.company,
        position: formData.profession,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        avatar_url: formData.avatar_url,
        bio: formData.tagline,
        whatsapp: formData.whatsapp,
        address: formData.address,
        map_link: formData.map_link,
        theme: formData.theme,
        shape: formData.shape,
        layout: formData.layout,
        is_published: formData.is_published,
        slug: formData.username || null
      };

      let currentCardId = cardId;

      if (cardId) {
        // Update existing card
        const { error } = await supabase
          .from('business_cards')
          .update(cardData)
          .eq('id', cardId);

        if (error) throw error;
      } else {
        // Create new card
        const { data, error } = await supabase
          .from('business_cards')
          .insert(cardData)
          .select()
          .single();

        if (error) throw error;
        currentCardId = data.id;
        setCardId(data.id);
        setFormData(prev => ({ ...prev, username: data.slug || '' }));
      }

      // Update profile
      await supabase
        .from('profiles')
        .update({
          name: formData.title,
          global_username: formData.globalUsername,
          avatar_url: formData.avatar_url
        })
        .eq('id', user.id);

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleThemeChange = (theme: typeof THEMES[0]) => {
    setFormData(prev => ({
      ...prev,
      theme
    }));
  };

  const handleLayoutChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        [field]: value
      }
    }));
  };

  const handleAddSocialLink = async () => {
    if (!cardId || !newSocialLink.platform) return;

    try {
      const url = newSocialLink.url || generateSocialLink(newSocialLink.platform, newSocialLink.username);
      
      const { data, error } = await supabase
        .from('social_links')
        .insert({
          card_id: cardId,
          platform: newSocialLink.platform,
          username: newSocialLink.username || null,
          url: url,
          display_order: socialLinks.length,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setSocialLinks([...socialLinks, data]);
      setNewSocialLink({ platform: 'Instagram', username: '', url: '' });
      setShowAddSocial(false);
    } catch (error) {
      console.error('Error adding social link:', error);
      alert('Failed to add social link. Please try again.');
    }
  };

  const removeSocialLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('social_links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSocialLinks(socialLinks.filter(link => link.id !== id));
    } catch (error) {
      console.error('Error removing social link:', error);
      alert('Failed to remove social link. Please try again.');
    }
  };

  const copyCardUrl = () => {
    const url = `${window.location.origin}/c/${formData.username}`;
    navigator.clipboard.writeText(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Digital Business Card</h1>
                <p className="text-sm text-gray-600">Welcome back, {formData.title || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {formData.username && (
                <a
                  href={`/c/${formData.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Live Card
                </a>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
              <div className="flex space-x-1">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'design', label: 'Design', icon: Palette },
                  { id: 'social', label: 'Social', icon: Globe },
                  { id: 'media', label: 'Videos', icon: Play },
                  { id: 'reviews', label: 'Reviews', icon: Star },
                  { id: 'settings', label: 'Settings', icon: Settings }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Profile Image */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Profile Picture
                      </label>
                      <ImageUpload
                        currentImageUrl={formData.avatar_url}
                        onImageChange={(url) => handleInputChange('avatar_url', url)}
                        userId={user?.id || ''}
                      />
                    </div>

                    {/* Basic Info */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username *
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="johndoe"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Your card will be available at: /c/{formData.username || 'username'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={formData.profession}
                        onChange={(e) => handleInputChange('profession', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Software Engineer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Acme Corp"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio / Tagline
                      </label>
                      <textarea
                        value={formData.tagline}
                        onChange={(e) => handleInputChange('tagline', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Brief description about yourself or your work..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-6 mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Phone className="w-6 h-6 text-green-600" />
                    <h3 className="text-xl font-bold text-gray-900">Contact Information</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="www.example.com"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123 Main St, City, State 12345"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'design' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Palette className="w-6 h-6 text-purple-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Design & Theme</h2>
                  </div>

                  {/* Theme Selection */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Color Theme</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {THEMES.map((theme) => (
                        <button
                          key={theme.name}
                          onClick={() => handleThemeChange(theme)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            formData.theme.name === theme.name
                              ? 'border-blue-500 shadow-lg scale-105'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: theme.primary }}
                            />
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: theme.secondary }}
                            />
                          </div>
                          <div className="text-sm font-medium text-gray-900">{theme.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shape Selection */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Shape</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'rectangle', label: 'Rectangle' },
                        { value: 'rounded', label: 'Rounded' },
                        { value: 'circle', label: 'Circle' }
                      ].map((shape) => (
                        <button
                          key={shape.value}
                          onClick={() => handleInputChange('shape', shape.value)}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            formData.shape === shape.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-sm font-medium">{shape.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Layout Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Style</h3>
                      <select
                        value={formData.layout.style}
                        onChange={(e) => handleLayoutChange('style', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="modern">Modern</option>
                        <option value="classic">Classic</option>
                        <option value="minimal">Minimal</option>
                        <option value="creative">Creative</option>
                      </select>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Font</h3>
                      <select
                        value={formData.layout.font}
                        onChange={(e) => handleLayoutChange('font', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {FONTS.map((font) => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'social' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">Social Media Links</h2>
                    </div>
                    <button
                      onClick={() => setShowAddSocial(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Link
                    </button>
                  </div>

                  {/* Add Social Link Form */}
                  {showAddSocial && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900">Add Social Media Link</h3>
                        <button
                          onClick={() => setShowAddSocial(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Platform
                          </label>
                          <select
                            value={newSocialLink.platform}
                            onChange={(e) => setNewSocialLink({ ...newSocialLink, platform: e.target.value, username: '', url: '' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {Object.keys(SOCIAL_PLATFORMS).map((platform) => (
                              <option key={platform} value={platform}>{platform}</option>
                            ))}
                          </select>
                        </div>

                        {newSocialLink.platform === 'Custom Link' ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              URL
                            </label>
                            <input
                              type="url"
                              value={newSocialLink.url}
                              onChange={(e) => setNewSocialLink({ ...newSocialLink, url: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="https://example.com"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Username
                            </label>
                            <input
                              type="text"
                              value={newSocialLink.username}
                              onChange={(e) => setNewSocialLink({ ...newSocialLink, username: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={SOCIAL_PLATFORMS[newSocialLink.platform]?.placeholder || 'username'}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleAddSocialLink}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add Link
                        </button>
                        <button
                          onClick={() => setShowAddSocial(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Social Links List */}
                  {socialLinks.length > 0 ? (
                    <div className="space-y-3">
                      {socialLinks.map((link) => {
                        const Icon = SOCIAL_ICONS[link.platform] || Globe;
                        return (
                          <div
                            key={link.id}
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                          >
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: formData.theme.primary }}
                            >
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{link.platform}</div>
                              <div className="text-sm text-gray-600">{link.username || link.url}</div>
                            </div>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => removeSocialLink(link.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Social Links</h3>
                      <p className="text-gray-600 mb-6">
                        Add your social media profiles to help people connect with you.
                      </p>
                      <button
                        onClick={() => setShowAddSocial(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        Add Your First Social Link
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'media' && cardId && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Play className="w-6 h-6 text-red-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Video Gallery</h2>
                  </div>
                  <MediaUpload
                    cardId={cardId}
                    mediaItems={mediaItems}
                    onMediaChange={setMediaItems}
                    userId={user?.id || ''}
                  />
                </div>
              )}

              {activeTab === 'reviews' && cardId && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Star className="w-6 h-6 text-yellow-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Reviews & Testimonials</h2>
                  </div>
                  <ReviewsManager
                    cardId={cardId}
                    reviews={reviews}
                    onReviewsChange={setReviews}
                  />
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Settings className="w-6 h-6 text-gray-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Card Settings</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Publish Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Publish Card</h3>
                        <p className="text-sm text-gray-600">Make your card visible to others</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_published}
                          onChange={(e) => handleInputChange('is_published', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Card URL */}
                    {formData.username && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2">Your Card URL</h3>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm">
                            {window.location.origin}/c/{formData.username}
                          </code>
                          <button
                            onClick={copyCardUrl}
                            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="Copy URL"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {saveStatus === 'success' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Changes saved successfully!</span>
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Failed to save changes</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <CardPreview
                formData={formData}
                socialLinks={socialLinks}
                mediaItems={mediaItems}
                reviews={reviews}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};