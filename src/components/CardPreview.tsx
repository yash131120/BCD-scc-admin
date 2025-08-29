import React, { useState } from "react";
import {
  Mail,
  Phone,
  Globe,
  Instagram,
  Linkedin,
  Github,
  Twitter,
  Facebook,
  Youtube,
  Camera,
  MessageCircle,
  MapPin,
  Star,
  ExternalLink,
  Play,
  FileText,
  Eye,
  Image as ImageIcon,
  X,
  Maximize2,
  Download,
} from "lucide-react";
import type { Database } from "../lib/supabase";
import html2canvas from "html2canvas";
import { generateSocialLink } from "../utils/socialUtils";

type SocialLink = Database["public"]["Tables"]["social_links"]["Row"];

interface MediaItem {
  id: string;
  type: "image" | "video" | "document";
  url: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
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

interface CardPreviewProps {
  formData: FormData;
  socialLinks: SocialLink[];
  mediaItems?: MediaItem[];
  reviews?: Review[];
  isFullPage?: boolean;
}

const SOCIAL_ICONS: Record<string, React.ComponentType<any>> = {
  Instagram,
  LinkedIn: Linkedin,
  GitHub: Github,
  Twitter,
  Facebook,
  "You Tube": Youtube,
  YouTube: Youtube,
  Website: Globe,
  WhatsApp: MessageCircle,
  Telegram: MessageCircle,
  "Custom Link": ExternalLink,
};

export const CardPreview: React.FC<CardPreviewProps> = ({
  formData,
  socialLinks,
  mediaItems = [],
  reviews = [],
  isFullPage = false,
}) => {
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Download handler
  const handleDownload = async () => {
    const card = document.getElementById("mini-card-preview");
    if (!card) return;

    // Wait for all images inside the card to load
    const images = card.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve(true);
            else img.onload = img.onerror = () => resolve(true);
          })
      )
    );

    const canvas = await html2canvas(card, {
      backgroundColor: null,
      useCORS: true, // Important for external images
      scale: 2, // Higher scale for better quality
    });
    const link = document.createElement("a");
    link.download = `${formData.username || "card"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const getCardShapeClasses = () => {
    if (isFullPage) return "rounded-3xl";

    switch (formData.shape) {
      case "rounded":
        return "rounded-2xl";
      case "circle":
        return "rounded-full aspect-square";
      case "hexagon":
        return "rounded-3xl";
      default:
        return "rounded-lg";
    }
  };

  const getLayoutClasses = () => {
    const baseClasses = "flex flex-col";
    switch (formData.layout.alignment) {
      case "left":
        return `${baseClasses} items-start text-left`;
      case "right":
        return `${baseClasses} items-end text-right`;
      default:
        return `${baseClasses} items-center text-center`;
    }
  };

  const getStyleClasses = () => {
    if (isFullPage) return "shadow-2xl border border-gray-100";

    switch (formData.layout.style) {
      case "classic":
        return "border-2 border-gray-200";
      case "minimal":
        return "border border-gray-100 shadow-sm";
      case "creative":
        return "shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-300";
      default:
        return "shadow-lg border border-gray-100";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  // Full Preview Modal Component
  const FullPreviewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">Full Card Preview</h2>
          <button
            onClick={() => setShowFullPreview(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Full Preview Content */}
        <div className="p-6">
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 rounded-xl">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              {/* <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {formData.title || "Your Name"}
                </h1>
                <p className="text-xl text-gray-600">
                  {formData.profession && formData.company
                    ? `${formData.profession} at ${formData.company}`
                    : formData.profession || formData.company || "Professional"}
                </p>
              </div> */}

              {/* Main Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Profile Section */}
                <div className="lg:col-span-1">
                  <div
                    className={`p-8 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                    style={{
                      backgroundColor: formData.theme.background,
                      color: formData.theme.text,
                      fontFamily: `'${formData.layout.font}', sans-serif`,
                    }}
                  >
                    {/* Avatar */}
                    {formData.avatar_url ? (
                      <img
                        src={formData.avatar_url}
                        alt="Profile"
                        className="w-36 h-36 rounded-full object-cover mb-6 border-4"
                        style={{ borderColor: formData.theme.primary }}
                      />
                    ) : (
                      <div
                        className="w-32 h-32 rounded-full mb-6 flex items-center justify-center text-white font-bold text-3xl border-4"
                        style={{
                          backgroundColor: formData.theme.primary,
                          borderColor: formData.theme.secondary,
                        }}
                      >
                        {formData.title ? (
                          formData.title.charAt(0).toUpperCase()
                        ) : (
                          <Camera className="w-12 h-12" />
                        )}
                      </div>
                    )}

                    {/* Name and Bio */}
                    <div className="mb-6">
                      <h2
                        className="text-2xl font-bold mb-2"
                        style={{ color: formData.theme.text }}
                      >
                        {formData.title || "Your Name"}
                      </h2>
                      {formData.profession && (
                        <p
                          className="text-lg font-medium mb-1"
                          style={{ color: formData.theme.secondary }}
                        >
                          {formData.profession}
                        </p>
                      )}
                      {formData.company && (
                        <p
                          className="text-base opacity-80 mb-2"
                          style={{ color: formData.theme.text }}
                        >
                          {formData.company}
                        </p>
                      )}
                      {formData.tagline && (
                        <p
                          className="text-sm opacity-70"
                          style={{ color: formData.theme.text }}
                        >
                          {formData.tagline}
                        </p>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 mb-6">
                      {formData.email && (
                        <a
                          href={`mailto:${formData.email}`}
                          className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-black hover:bg-opacity-5"
                        >
                          <Mail
                            className="w-5 h-5"
                            style={{ color: formData.theme.primary }}
                          />
                          <span className="text-sm">{formData.email}</span>
                        </a>
                      )}
                      {formData.phone && (
                        <a
                          href={`tel:${formData.phone}`}
                          className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-black hover:bg-opacity-5"
                        >
                          <Phone
                            className="w-5 h-5"
                            style={{ color: formData.theme.primary }}
                          />
                          <span className="text-sm">{formData.phone}</span>
                        </a>
                      )}
                      {formData.whatsapp && (
                        <a
                          href={`https://wa.me/${formData.whatsapp.replace(
                            /[^0-9]/g,
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-black hover:bg-opacity-5"
                        >
                          <MessageCircle
                            className="w-5 h-5"
                            style={{ color: formData.theme.primary }}
                          />
                          <span className="text-sm">WhatsApp</span>
                        </a>
                      )}
                      {formData.website && (
                        <a
                          href={
                            formData.website.startsWith("http")
                              ? formData.website
                              : `https://${formData.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-black hover:bg-opacity-5"
                        >
                          <Globe
                            className="w-5 h-5"
                            style={{ color: formData.theme.primary }}
                          />
                          <span className="text-sm">{formData.website}</span>
                        </a>
                      )}
                      {formData.address && (
                        <div className="flex items-start gap-3 p-3 rounded-lg">
                          <MapPin
                            className="w-5 h-5 mt-0.5"
                            style={{ color: formData.theme.primary }}
                          />
                          <span className="text-sm">{formData.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Social Links */}
                    {socialLinks.length > 0 && (
                      <div className="flex gap-4 mt-2 flex-wrap items-center justify-start">
                        {socialLinks.map((link) => {
                          const Icon = SOCIAL_ICONS[link.platform] || Globe;
                          return (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{
                                backgroundColor: formData.theme.primary,
                                transition: "transform 0.15s",
                              }}
                              title={link.platform}
                            >
                              <Icon className="w-5 h-5 text-white" />
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Media Gallery */}
                  {mediaItems.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Gallery
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {mediaItems.slice(0, 6).map((item) => (
                          <div key={item.id} className="relative group">
                            {item.type === "image" ? (
                              <img
                                src={item.url}
                                alt={item.title}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            ) : item.type === "video" ? (
                              <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Play className="w-8 h-8 text-gray-600" />
                              </div>
                            ) : (
                              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-8 h-8 text-gray-600" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.title}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {mediaItems.length > 6 && (
                        <div className="text-center mt-4">
                          <span className="text-sm text-gray-600">
                            +{mediaItems.length - 6} more items
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reviews */}
                  {reviews.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Customer Reviews
                      </h3>
                      <div className="space-y-4">
                        {reviews.slice(0, 3).map((review) => (
                          <div
                            key={review.id}
                            className="border-l-4 border-yellow-400 pl-4"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {renderStars(review.rating)}
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {review.reviewer_name}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm italic">
                              "{review.comment}"
                            </p>
                          </div>
                        ))}
                      </div>
                      {reviews.length > 3 && (
                        <div className="text-center mt-4">
                          <span className="text-sm text-gray-600">
                            +{reviews.length - 3} more reviews
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isFullPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {formData.title || "Your Name"}
            </h1>
            <p className="text-xl text-gray-600">
              {formData.profession && formData.company
                ? `${formData.profession} at ${formData.company}`
                : formData.profession || formData.company || "Professional"}
            </p>
          </div>

          {/* Main Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Profile Section */}
            <div className="lg:col-span-1">
              <div
                className={`p-8 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                style={{
                  backgroundColor: formData.theme.background,
                  color: formData.theme.text,
                  fontFamily: `'${formData.layout.font}', sans-serif`,
                }}
              >
                {/* Avatar */}
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover mb-6 border-4"
                    style={{ borderColor: formData.theme.primary }}
                  />
                ) : (
                  <div
                    className="w-32 h-32 rounded-full mb-6 flex items-center justify-center text-white font-bold text-3xl border-4"
                    style={{
                      backgroundColor: formData.theme.primary,
                      borderColor: formData.theme.secondary,
                    }}
                  >
                    {formData.title ? (
                      formData.title.charAt(0).toUpperCase()
                    ) : (
                      <Camera className="w-12 h-12" />
                    )}
                  </div>
                )}

                {/* Name and Bio */}
                <div className="mb-6">
                  <h2
                    className="text-2xl font-bold mb-2"
                    style={{ color: formData.theme.text }}
                  >
                    {formData.title || "Your Name"}
                  </h2>
                  {formData.profession && (
                    <p
                      className="text-lg font-medium mb-1"
                      style={{ color: formData.theme.secondary }}
                    >
                      {formData.profession}
                    </p>
                  )}
                  {formData.company && (
                    <p
                      className="text-base opacity-80 mb-2"
                      style={{ color: formData.theme.text }}
                    >
                      {formData.company}
                    </p>
                  )}
                  {formData.tagline && (
                    <p
                      className="text-sm opacity-70"
                      style={{ color: formData.theme.text }}
                    >
                      {formData.tagline}
                    </p>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-3 mb-6">
                  {formData.email && (
                    <a
                      href={`mailto:${formData.email}`}
                      className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-black hover:bg-opacity-5"
                    >
                      <Mail
                        className="w-5 h-5"
                        style={{ color: formData.theme.primary }}
                      />
                      <span className="text-sm">{formData.email}</span>
                    </a>
                  )}
                  {formData.phone && (
                    <a
                      href={`tel:${formData.phone}`}
                      className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-black hover:bg-opacity-5"
                    >
                      <Phone
                        className="w-5 h-5"
                        style={{ color: formData.theme.primary }}
                      />
                      <span className="text-sm">{formData.phone}</span>
                    </a>
                  )}
                  {formData.whatsapp && (
                    <a
                      href={`https://wa.me/${formData.whatsapp.replace(
                        /[^0-9]/g,
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-black hover:bg-opacity-5"
                    >
                      <MessageCircle
                        className="w-5 h-5"
                        style={{ color: formData.theme.primary }}
                      />
                      <span className="text-sm">WhatsApp</span>
                    </a>
                  )}
                  {formData.website && (
                    <a
                      href={
                        formData.website.startsWith("http")
                          ? formData.website
                          : `https://${formData.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-black hover:bg-opacity-5"
                    >
                      <Globe
                        className="w-5 h-5"
                        style={{ color: formData.theme.primary }}
                      />
                      <span className="text-sm">{formData.website}</span>
                    </a>
                  )}
                  {formData.address && (
                    <div className="flex items-start gap-3 p-3 rounded-lg">
                      <MapPin
                        className="w-5 h-5 mt-0.5"
                        style={{ color: formData.theme.primary }}
                      />
                      <span className="text-sm">{formData.address}</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {socialLinks.length > 0 && (
                  <div className="flex gap-4 mt-2 flex-wrap items-center justify-start">
                    {socialLinks.map((link) => {
                      const Icon = SOCIAL_ICONS[link.platform] || Globe;
                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: formData.theme.primary,
                            transition: "transform 0.15s",
                          }}
                          title={link.platform}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="lg:col-span-2 space-y-8">
              {/* Media Gallery */}
              {mediaItems.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Gallery
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {mediaItems.slice(0, 6).map((item) => (
                      <div key={item.id} className="relative group">
                        {item.type === "image" ? (
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : item.type === "video" ? (
                          <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Play className="w-8 h-8 text-gray-600" />
                          </div>
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {mediaItems.length > 6 && (
                    <div className="text-center mt-4">
                      <span className="text-sm text-gray-600">
                        +{mediaItems.length - 6} more items
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Customer Reviews
                  </h3>
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review) => (
                      <div
                        key={review.id}
                        className="border-l-4 border-yellow-400 pl-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {review.reviewer_name}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm italic">
                          "{review.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                  {reviews.length > 3 && (
                    <div className="text-center mt-4">
                      <span className="text-sm text-gray-600">
                        +{reviews.length - 3} more reviews
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mini preview for admin panel
  return (
    <>
      <div className="bg-gray-100 rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Download Button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
          <div className="flex gap-2 ">
            <div
              className={`px-2 py-1 rounded-full border-2 text-xs font-medium ${
                formData.is_published
                  ? "bg-green-200 text-green-800  border-green-500"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {formData.is_published ? "Published" : "Draft"}
            </div>
            <button
              onClick={handleDownload}
              className="px-3 py-1 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors"
              title="Download Card"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mini Card Preview */}
        <div className="flex justify-center mb-4">
          <div className="w-80 h-auto relative" id="mini-card-preview">
            <div
              className={`w-full p-4 flex items-start gap-4 ${getCardShapeClasses()} ${getStyleClasses()}`}
              style={{
                backgroundColor: formData.theme.background,
                color: formData.theme.text,
                fontFamily: `'${formData.layout.font}', sans-serif`,
              }}
            >
              {/* Avatar */}
              <div className="flex flex-col items-center">
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2"
                    style={{ borderColor: formData.theme.primary }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl border-2"
                    style={{
                      backgroundColor: formData.theme.primary,
                      borderColor: formData.theme.secondary,
                    }}
                  >
                    {formData.title ? (
                      formData.title.charAt(0).toUpperCase()
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                  </div>
                )}
                {/* QR Code below avatar */}
                <div className="mt-3 flex justify-center">
                  <div
                    className="rounded-lg shadow-lg p-1 bg-gradient-to-br from-white/80 to-gray-200/60"
                    style={{
                      display: "inline-block",
                      backdropFilter: "blur(2px)",
                      backgroundColor: formData.theme.primary,
                    }}
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                        formData.username
                          ? `https://yourdomain.com/${formData.username}`
                          : "https://yourdomain.com"
                      )}&format=png&bgcolor=255-255-255-00`}
                      alt="QR Code"
                      className="w-16 h-16 rounded-md"
                      style={{
                        boxShadow: Range,
                        background: "transparent",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Name, Title, Contact, Social */}
              <div className="flex-1 mt-1">
                {/* Name */}
                <h3
                  className="font-bold text-lg leading-tight"
                  style={{ color: formData.theme.text }}
                >
                  {formData.title || "Your Name"}
                </h3>
                {/* Title */}
                {(formData.profession || formData.company) && (
                  <p
                    className="text-xs opacity-80 mb-3"
                    style={{ color: formData.theme.secondary }}
                  >
                    {formData.profession}
                    {formData.profession && formData.company ? " at " : ""}
                    {formData.company}
                  </p>
                )}
                {/* Contact Info */}
                <div className="flex flex-col gap-1 mb-4">
                  {formData.email && (
                    <div className="flex items-center gap-2 text-xs break-all">
                      <Mail
                        className="w-3 h-3 break-all"
                        style={{ color: formData.theme.primary }}
                      />
                      <span>{formData.email}</span>
                    </div>
                  )}
                  {formData.phone && (
                    <div className="flex items-center gap-2 text-xs break-all">
                      <Phone
                        className="w-3 h-3 break-all"
                        style={{ color: formData.theme.primary }}
                      />
                      <span>{formData.phone}</span>
                    </div>
                  )}
                  {formData.address && (
                    <div className="flex items-center gap-2 text-xs break-all">
                      <MapPin
                        className="w-3 h-3 break-all"
                        style={{ color: formData.theme.primary }}
                      />
                      <span>{formData.address}</span>
                    </div>
                  )}
                </div>
                {/* Social Links */}
                {socialLinks.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {socialLinks.map((link) => {
                      const Icon = SOCIAL_ICONS[link.platform] || Globe;
                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: formData.theme.primary }}
                          title={link.platform}
                        >
                          <Icon className="w-3 h-3 text-white" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Info */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Username:</span>
              <span className="font-medium">
                /{formData.username || "username"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Theme:</span>
              <span className="font-medium">{formData.theme.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Social Links:</span>
              <span className="font-medium">{socialLinks.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Media Items:</span>
              <span className="font-medium">{mediaItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Reviews:</span>
              <span className="font-medium">{reviews.length}</span>
            </div>
          </div>
        </div>

        {/* Full Preview Button */}
        <button
          onClick={() => setShowFullPreview(true)}
          className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <Maximize2 className="w-4 h-4" />
          View Full Preview
        </button>

        {formData.username && (
          <a
            href={`/c/${formData.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-2 py-2 mt-3 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border-2 border-green-500"
          >
            <Eye className="w-5 h-5" />
            View Live Card
          </a>
        )}

      </div>

      {/* Full Preview Modal */}
      {showFullPreview && <FullPreviewModal />}
    </>
  );
};
