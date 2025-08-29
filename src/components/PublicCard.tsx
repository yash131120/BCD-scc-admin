import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  Globe, 
  Instagram, 
  Linkedin, 
  Github, 
  Twitter,
  Download,
  QrCode,
  Share2,
  Facebook,
  Youtube,
  MessageCircle,
  MapPin
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { exportToPNG, exportToPDF, generateQRCode } from '../utils/exportUtils';
import { generateSocialLink } from '../utils/socialUtils';
import type { Database } from '../lib/supabase';

type BusinessCard = Database['public']['Tables']['business_cards']['Row'];
type SocialLink = Database['public']['Tables']['social_links']['Row'];

interface CardData {
  card: BusinessCard;
  socialLinks: SocialLink[];
}

const SOCIAL_ICONS: Record<string, React.ComponentType<any>> = {
  Instagram,
  LinkedIn: Linkedin,
  GitHub: Github,
  Twitter,
  Facebook,
  'You Tube': Youtube,
  Website: Globe,
};

export const PublicCard: React.FC = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardId) {
      loadCardData();
    }
  }, [cardId]);

  const loadCardData = async () => {
    if (!cardId) return;

    try {
      setLoading(true);
      
      // Fetch business card
      const { data: cardData, error: cardError } = await supabase
        .from('business_cards')
        .select('*')
        .eq('slug', cardId)
        .eq('is_published', true)
        .single();

      if (cardError) {
        throw new Error('Card not found or not published');
      }

      // Fetch social links
      const { data: socialLinks, error: socialError } = await supabase
        .from('social_links')
        .select('*, is_auto_synced')
        .eq('card_id', cardData.id);

      if (socialError) {
        throw new Error('Failed to load social links');
      }

      setCardData({
        card: cardData,
        socialLinks: socialLinks || []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load card');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPNG = async () => {
    if (cardRef.current) {
      await exportToPNG(cardRef.current, `${cardData?.card.title || 'business-card'}.png`);
    }
  };

  const handleExportPDF = async () => {
    if (cardRef.current) {
      await exportToPDF(cardRef.current, `${cardData?.card.title || 'business-card'}.pdf`);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cardData?.card.title}'s Business Card`,
          text: `Check out ${cardData?.card.title}'s digital business card`,
          url: url,
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url);
      }
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business card...</p>
        </div>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Card Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'This business card does not exist or is not published.'}</p>
        </div>
      </div>
    );
  }

  const { card, socialLinks } = cardData;
  const theme = card.theme as any || {
    primary: '#3B82F6',
    secondary: '#1E40AF',
    background: '#FFFFFF',
    text: '#1F2937'
  };
  const layout = card.layout as any || {
    style: 'modern',
    alignment: 'center',
    font: 'Inter'
  };

  const getCardShapeClasses = () => {
    switch (card.shape) {
      case 'rounded':
        return 'rounded-3xl';
      case 'circle':
        return 'rounded-full aspect-square';
      case 'hexagon':
        return 'rounded-3xl';
      default:
        return 'rounded-xl';
    }
  };

  const getLayoutClasses = () => {
    const baseClasses = 'flex flex-col';
    switch (layout.alignment) {
      case 'left':
        return `${baseClasses} items-start text-left`;
      case 'right':
        return `${baseClasses} items-end text-right`;
      default:
        return `${baseClasses} items-center text-center`;
    }
  };

  const getStyleClasses = () => {
    switch (layout.style) {
      case 'classic':
        return 'border-2 shadow-lg';
      case 'minimal':
        return 'border border-gray-200 shadow-sm';
      case 'creative':
        return 'shadow-2xl';
      default:
        return 'shadow-xl border border-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <p className="text-gray-600">
            Connect with {card.title} through their digital business card
          </p>
        </div>

        {/* Business Card */}
        <div className="flex justify-center mb-8">
          <div
            ref={cardRef}
            className={`w-full max-w-md p-8 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
            style={{
              backgroundColor: theme.background,
              color: theme.text,
              fontFamily: `'${layout.font}', sans-serif`,
              borderColor: theme.primary + '20'
            }}
          >
            {/* Profile Image */}
            {card.avatar_url ? (
              <img
                src={card.avatar_url}
                alt={card.title || 'Profile'}
                className="w-24 h-24 rounded-full object-cover mb-4 border-4"
                style={{ borderColor: theme.primary }}
              />
            ) : (
              <div 
                className="w-24 h-24 rounded-full mb-4 flex items-center justify-center text-white font-bold text-2xl border-4"
                style={{ 
                  backgroundColor: theme.primary,
                  borderColor: theme.secondary
                }}
              >
                {card.title ? card.title.charAt(0).toUpperCase() : 'A'}
              </div>
            )}

            {/* Name and Company */}
            <div className="mb-6">
              <h2 
                className="text-2xl font-bold mb-2"
                style={{ color: theme.text }}
              >
                {card.title || 'Your Name'}
              </h2>
              {card.company && (
                <p 
                  className="text-lg font-medium"
                  style={{ color: theme.secondary }}
                >
                  {card.company}
                </p>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-3 mb-6">
              {card.email && (
                <a
                  href={`mailto:${card.email}`}
                  className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-black hover:bg-opacity-5"
                >
                  <Mail className="w-5 h-5" style={{ color: theme.primary }} />
                  <span className="text-sm">{card.email}</span>
                </a>
              )}
              {card.phone && (
                <a
                  href={`tel:${card.phone}`}
                  className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-black hover:bg-opacity-5"
                >
                  <Phone className="w-5 h-5" style={{ color: theme.primary }} />
                  <span className="text-sm">{card.phone}</span>
                </a>
              )}
              {card.website && (
                <a
                  href={card.website.startsWith('http') ? card.website : `https://${card.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-black hover:bg-opacity-5"
                >
                  <Globe className="w-5 h-5" style={{ color: theme.primary }} />
                  <span className="text-sm">{card.website}</span>
                </a>
              )}
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold mb-3" style={{ color: theme.secondary }}>
                  Connect with me
                </h3>
                {socialLinks.map((link) => {
                  const Icon = SOCIAL_ICONS[link.platform] || Globe;
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-black hover:bg-opacity-5 hover:scale-105"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.primary }}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{link.platform}</div>
                        {link.username && (
                          <div className="text-xs opacity-75">@{link.username}</div>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={handleExportPNG}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Download className="w-5 h-5" />
            Download PNG
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-lg"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <button
            onClick={() => setShowQR(!showQR)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-lg"
          >
            <QrCode className="w-5 h-5" />
            QR Code
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors shadow-lg"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>
        </div>

        {/* QR Code Modal */}
        {showQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">QR Code</h3>
                <div className="flex justify-center mb-4">
                  {generateQRCode(window.location.href)}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code to share this business card
                </p>
                <button
                  onClick={() => setShowQR(false)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};