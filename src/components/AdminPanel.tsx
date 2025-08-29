import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Globe,
  Camera,
  Palette,
  Layout,
  Eye,
  Save,
  LogOut,
  Plus,
  X,
  ExternalLink,
  Settings,
  BarChart3,
  Share2,
  Download,
  Copy,
  Check,
  Star,
  Image as ImageIcon,
  MessageCircle,
  MapPin,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { ImageUpload } from "./ImageUpload";
import { CardPreview } from "./CardPreview";
import { MediaUpload } from "./MediaUpload";
import { ReviewsManager } from "./ReviewsManager";
import {
  generateSocialLink,
  extractUsernameFromUrl,
  isPlatformAutoSyncable,
  generateAutoSyncedLinks,
  SOCIAL_PLATFORMS,
} from "../utils/socialUtils";
import type { Database } from "../lib/supabase";
import logo from "../assets/dbclogo.png";

type BusinessCard = Database["public"]["Tables"]["business_cards"]["Row"];
type SocialLink = Database["public"]["Tables"]["social_links"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

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

const THEMES = [
  {
    name: "Ocean Blue",
    primary: "#3B82F6",
    secondary: "#1E40AF",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Forest Green",
    primary: "#10B981",
    secondary: "#047857",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Sunset Orange",
    primary: "#F59E0B",
    secondary: "#D97706",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Royal Purple",
    primary: "#8B5CF6",
    secondary: "#7C3AED",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Rose Pink",
    primary: "#EC4899",
    secondary: "#DB2777",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Dark Mode",
    primary: "#60A5FA",
    secondary: "#3B82F6",
    background: "#1F2937",
    text: "#F9FAFB",
  },
];

export const AdminPanel: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [businessCard, setBusinessCard] = useState<BusinessCard | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    username: "",
    globalUsername: "",
    company: "",
    tagline: "",
    profession: "",
    avatar_url: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    address: "",
    map_link: "",
    theme: THEMES[0],
    shape: "rectangle",
    layout: {
      style: "modern",
      alignment: "center",
      font: "Inter",
    },
    is_published: false,
  });

  const [newSocialLink, setNewSocialLink] = useState({
    platform: "",
    username: "",
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

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*, global_username")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Profile error:", profileError);
      } else if (profileData) {
        setProfile(profileData);
      }

      // Load business card
      const { data: cardData, error: cardError } = await supabase
        .from("business_cards")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (cardError && cardError.code !== "PGRST116") {
        console.error("Card error:", cardError);
      } else if (cardData) {
        setBusinessCard(cardData);

        // Update form data with card data
        const theme = (cardData.theme as any) || THEMES[0];
        const layout = (cardData.layout as any) || {
          style: "modern",
          alignment: "center",
          font: "Inter",
        };

        setFormData({
          title: cardData.title || "",
          username: cardData.slug || "",
          globalUsername: profileData?.global_username || "",
          company: cardData.company || "",
          tagline: cardData.bio || "",
          profession: cardData.position || "",
          avatar_url: cardData.avatar_url || "",
          phone: cardData.phone || "",
          whatsapp: (cardData as any).whatsapp || "",
          email: cardData.email || "",
          website: cardData.website || "",
          address: (cardData as any).address || "",
          map_link: (cardData as any).map_link || "",
          theme,
          shape: cardData.shape || "rectangle",
          layout,
          is_published: cardData.is_published || false,
        });

        // Load social links
        const { data: socialData, error: socialError } = await supabase
          .from("social_links")
          .select("*, is_auto_synced")
          .eq("card_id", cardData.id)
          .order("display_order");

        if (socialError) {
          console.error("Social links error:", socialError);
        } else {
          setSocialLinks(socialData || []);
        }
      } else {
        // Set default form data with user email
        setFormData((prev) => ({
          ...prev,
          globalUsername: profileData?.global_username || "",
          email: user.email || "",
          title: profileData?.name || user.email?.split("@")[0] || "",
        }));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update profile with global username
      if (profile) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            name: formData.title,
            global_username: formData.globalUsername || null,
          })
          .eq("id", user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }
      }

      let cardId = businessCard?.id;

      if (!businessCard) {
        // Create new business card
        const { data: newCard, error: createError } = await supabase
          .from("business_cards")
          .insert({
            user_id: user.id,
            title: formData.title,
            company: formData.company,
            position: formData.profession,
            phone: formData.phone,
            email: formData.email,
            website: formData.website,
            avatar_url: formData.avatar_url,
            bio: formData.tagline,
            theme: formData.theme,
            shape: formData.shape,
            layout: formData.layout,
            is_published: formData.is_published,
            slug: formData.username || null,
            whatsapp: formData.whatsapp,
            address: formData.address,
            map_link: formData.map_link,
          })
          .select()
          .single();

        if (createError) throw createError;
        setBusinessCard(newCard);
        cardId = newCard.id;
      } else {
        // Update existing business card
        const { error: updateError } = await supabase
          .from("business_cards")
          .update({
            title: formData.title,
            company: formData.company,
            position: formData.profession,
            phone: formData.phone,
            email: formData.email,
            website: formData.website,
            avatar_url: formData.avatar_url,
            bio: formData.tagline,
            theme: formData.theme,
            shape: formData.shape,
            layout: formData.layout,
            is_published: formData.is_published,
            slug: formData.username || null,
            whatsapp: formData.whatsapp,
            address: formData.address,
            map_link: formData.map_link,
          })
          .eq("id", businessCard.id);

        if (updateError) throw updateError;
      }

      // Profile update moved above

      alert("Business card saved successfully!");
      await loadUserData(); // Reload data
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save business card. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSocialLink = async () => {
    if (!businessCard || !newSocialLink.platform || !newSocialLink.username) {
      alert("Please fill in platform and username");
      return;
    }

    try {
      const url = generateSocialLink(
        newSocialLink.platform,
        newSocialLink.username
      );
      const isAutoSyncable = isPlatformAutoSyncable(newSocialLink.platform);

      const { data, error } = await supabase
        .from("social_links")
        .insert({
          card_id: businessCard.id,
          platform: newSocialLink.platform,
          username: newSocialLink.username,
          url: url,
          display_order: socialLinks.length,
          is_auto_synced:
            isAutoSyncable &&
            newSocialLink.username === formData.globalUsername,
        })
        .select()
        .single();

      if (error) throw error;

      setSocialLinks([...socialLinks, data]);
      setNewSocialLink({ platform: "", username: "" });
    } catch (error) {
      console.error("Error adding social link:", error);
      alert("Failed to add social link. Please try again.");
    }
  };

  const handleGlobalUsernameChange = async (newGlobalUsername: string) => {
    const oldGlobalUsername = formData.globalUsername;
    setFormData({ ...formData, globalUsername: newGlobalUsername });

    // If we have a business card and the global username changed
    if (
      businessCard &&
      oldGlobalUsername !== newGlobalUsername &&
      newGlobalUsername
    ) {
      try {
        // Update auto-synced social links
        const autoSyncedLinks = socialLinks.filter(
          (link) => link.is_auto_synced
        );

        for (const link of autoSyncedLinks) {
          if (isPlatformAutoSyncable(link.platform)) {
            const newUrl = generateSocialLink(link.platform, newGlobalUsername);

            await supabase
              .from("social_links")
              .update({
                username: newGlobalUsername,
                url: newUrl,
              })
              .eq("id", link.id);
          }
        }

        // Reload social links to reflect changes
        const { data: updatedSocialData } = await supabase
          .from("social_links")
          .select("*, is_auto_synced")
          .eq("card_id", businessCard.id)
          .order("display_order");

        if (updatedSocialData) {
          setSocialLinks(updatedSocialData);
        }
      } catch (error) {
        console.error("Error updating auto-synced links:", error);
      }
    }
  };

  const handleAutoSyncSocialLinks = async () => {
    if (!businessCard || !formData.globalUsername) {
      alert("Please set a global username first");
      return;
    }

    try {
      const autoSyncedLinks = generateAutoSyncedLinks(formData.globalUsername);
      const existingPlatforms = socialLinks.map((link) => link.platform);

      // Only add platforms that don't already exist
      const newLinks = autoSyncedLinks.filter(
        (link) => !existingPlatforms.includes(link.platform)
      );

      if (newLinks.length === 0) {
        alert("All auto-syncable platforms are already added");
        return;
      }

      const insertData = newLinks.map((link, index) => ({
        card_id: businessCard.id,
        platform: link.platform,
        username: link.username,
        url: link.url,
        display_order: socialLinks.length + index,
        is_auto_synced: true,
      }));

      const { data, error } = await supabase
        .from("social_links")
        .insert(insertData)
        .select();

      if (error) throw error;

      setSocialLinks([...socialLinks, ...data]);
      alert(`Added ${newLinks.length} auto-synced social links`);
    } catch (error) {
      console.error("Error auto-syncing social links:", error);
      alert("Failed to auto-sync social links. Please try again.");
    }
  };

  const handleSocialLinkEdit = async (linkId: string, newUsername: string) => {
    try {
      const link = socialLinks.find((l) => l.id === linkId);
      if (!link) return;

      const newUrl = generateSocialLink(link.platform, newUsername);
      const wasAutoSynced = link.is_auto_synced;

      // If user manually edits, it's no longer auto-synced
      const isStillAutoSynced =
        wasAutoSynced && newUsername === formData.globalUsername;

      const { error } = await supabase
        .from("social_links")
        .update({
          username: newUsername,
          url: newUrl,
          is_auto_synced: isStillAutoSynced,
        })
        .eq("id", linkId);

      if (error) throw error;

      // Update local state
      setSocialLinks(
        socialLinks.map((l) =>
          l.id === linkId
            ? {
                ...l,
                username: newUsername,
                url: newUrl,
                is_auto_synced: isStillAutoSynced,
              }
            : l
        )
      );
    } catch (error) {
      console.error("Error updating social link:", error);
    }
  };

  const handleRemoveSocialLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from("social_links")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSocialLinks(socialLinks.filter((link) => link.id !== id));
    } catch (error) {
      console.error("Error removing social link:", error);
      alert("Failed to remove social link. Please try again.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const copyCardUrl = () => {
    const url = `${window.location.origin}/c/${
      formData.username || businessCard?.slug || businessCard?.id
    }`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "basic", label: "Basic Info", icon: User },
    { id: "contact", label: "Contact", icon: Mail },
    { id: "social", label: "Social Links", icon: Share2 },
    { id: "media", label: "Media", icon: ImageIcon },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "design", label: "Design", icon: Palette },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 transition-transform duration-300 translate-y-0">
        <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <img
                src={logo}
                alt="Digital Business Card Logo"
                className="h-24 w-auto"
              />
              {formData.username && (
                <a
                  href={`/c/${formData.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-2 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors border-2 border-green-500 "
                >
                  <Eye className="w-4 h-4" />
                  View Live Card
                </a>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={copyCardUrl}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Copy URL"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                          activeTab === tab.id
                            ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Basic Info Tab */}
                {activeTab === "basic" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <ImageUpload
                        currentImageUrl={formData.avatar_url}
                        onImageChange={(url) =>
                          setFormData({ ...formData, avatar_url: url || "" })
                        }
                        userId={user?.id || ""}
                      />
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                title: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Your full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Card URL Username *
                          </label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              /c/
                            </span>
                            <input
                              type="text"
                              value={formData.username}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  username: e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]/g, ""),
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="yourname"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            This will be your card's URL: /c/
                            {formData.username || "yourname"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Global Username (for social links)
                          </label>
                          <input
                            type="text"
                            value={formData.globalUsername}
                            onChange={(e) =>
                              handleGlobalUsernameChange(
                                e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9_]/g, "")
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Add common username"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            This username will auto-sync across all your social
                            media platforms
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company/Organization
                        </label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              company: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your company name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Job Title/Profession
                        </label>
                        <input
                          type="text"
                          value={formData.profession}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              profession: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your job title"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tagline/Bio
                      </label>
                      <textarea
                        value={formData.tagline}
                        onChange={(e) =>
                          setFormData({ ...formData, tagline: e.target.value })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="A brief description about yourself or your business"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_published"
                        checked={formData.is_published}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            is_published: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor="is_published"
                        className="text-sm font-medium text-gray-700"
                      >
                        Publish card (make it publicly accessible)
                      </label>
                    </div>
                  </div>
                )}

                {/* Contact Tab */}
                {activeTab === "contact" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Mail className="w-4 h-4 inline mr-1" />
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Phone className="w-4 h-4 inline mr-1" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Globe className="w-4 h-4 inline mr-1" />
                          Website
                        </label>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              website: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Address
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your business address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Google Maps Link
                      </label>
                      <input
                        type="url"
                        value={formData.map_link}
                        onChange={(e) =>
                          setFormData({ ...formData, map_link: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://maps.google.com/..."
                      />
                    </div>
                  </div>
                )}

                {/* Social Links Tab */}
                {activeTab === "social" && (
                  <div className="space-y-6">
                    {/* Global Username Info */}
                    {formData.globalUsername && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-blue-900">
                              Global Username: @{formData.globalUsername}
                            </h4>
                            <p className="text-sm text-blue-700">
                              Auto-synced links will use this username
                            </p>
                          </div>
                          <button
                            onClick={handleAutoSyncSocialLinks}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Auto-Sync All Platforms
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Add New Social Link */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-4">
                        Add Social Link
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Platform
                          </label>
                          <select
                            value={newSocialLink.platform}
                            onChange={(e) =>
                              setNewSocialLink({
                                ...newSocialLink,
                                platform: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select platform</option>
                            {Object.keys(SOCIAL_PLATFORMS).map((platform) => (
                              <option key={platform} value={platform}>
                                {platform}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username/Handle
                          </label>
                          <div className="flex">
                            <input
                              type="text"
                              value={newSocialLink.username}
                              onChange={(e) =>
                                setNewSocialLink({
                                  ...newSocialLink,
                                  username: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={
                                newSocialLink.platform &&
                                SOCIAL_PLATFORMS[newSocialLink.platform]
                                  ? SOCIAL_PLATFORMS[newSocialLink.platform]
                                      .placeholder
                                  : "username"
                              }
                            />
                            <button
                              onClick={handleAddSocialLink}
                              className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Existing Social Links */}
                    <div className="space-y-3">
                      {socialLinks.map((link) => (
                        <div
                          key={link.id}
                          className={`flex items-center justify-between p-4 bg-white border rounded-lg ${
                            link.is_auto_synced
                              ? "border-blue-200 bg-blue-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Globe className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {link.platform}
                                </span>
                                {link.is_auto_synced && (
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    Auto-synced
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  value={link.username || ""}
                                  onChange={(e) =>
                                    handleSocialLinkEdit(
                                      link.id,
                                      e.target.value
                                    )
                                  }
                                  className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="username"
                                />
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveSocialLink(link.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {socialLinks.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p>No social links added yet.</p>
                        <p className="text-sm mb-4">
                          Add your social media profiles to connect with
                          visitors.
                        </p>
                        {formData.globalUsername && (
                          <button
                            onClick={handleAutoSyncSocialLinks}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Auto-Sync with @{formData.globalUsername}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Media Tab */}
                {activeTab === "media" && businessCard && (
                  <MediaUpload
                    cardId={businessCard.id}
                    mediaItems={mediaItems}
                    onMediaChange={setMediaItems}
                    userId={user?.id || ""}
                  />
                )}

                {/* Reviews Tab */}
                {activeTab === "reviews" && businessCard && (
                  <ReviewsManager
                    cardId={businessCard.id}
                    reviews={reviews}
                    onReviewsChange={setReviews}
                  />
                )}

                {/* Design Tab */}
                {activeTab === "design" && (
                  <div className="space-y-6">
                    {/* Theme Selection */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Choose Theme
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {THEMES.map((theme) => (
                          <button
                            key={theme.name}
                            onClick={() => setFormData({ ...formData, theme })}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.theme.name === theme.name
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-gray-300"
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
                            <div className="text-sm font-medium text-gray-900">
                              {theme.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card Shape */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Card Shape
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: "rectangle", label: "Rectangle" },
                          { value: "rounded", label: "Rounded" },
                          { value: "circle", label: "Circle" },
                        ].map((shape) => (
                          <button
                            key={shape.value}
                            onClick={() =>
                              setFormData({ ...formData, shape: shape.value })
                            }
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.shape === shape.value
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {shape.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Layout Options */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Layout Style
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { value: "modern", label: "Modern" },
                          { value: "classic", label: "Classic" },
                          { value: "minimal", label: "Minimal" },
                          { value: "creative", label: "Creative" },
                        ].map((style) => (
                          <button
                            key={style.value}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                layout: {
                                  ...formData.layout,
                                  style: style.value,
                                },
                              })
                            }
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.layout.style === style.value
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {style.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Text Alignment */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Text Alignment
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: "left", label: "Left" },
                          { value: "center", label: "Center" },
                          { value: "right", label: "Right" },
                        ].map((alignment) => (
                          <button
                            key={alignment.value}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                layout: {
                                  ...formData.layout,
                                  alignment: alignment.value,
                                },
                              })
                            }
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.layout.alignment === alignment.value
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {alignment.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Selection */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Font Family
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { value: "Inter", label: "Inter" },
                          { value: "Roboto", label: "Roboto" },
                          { value: "Open Sans", label: "Open Sans" },
                          { value: "Lato", label: "Lato" },
                          { value: "Montserrat", label: "Montserrat" },
                          { value: "Poppins", label: "Poppins" },
                        ].map((font) => (
                          <button
                            key={font.value}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                layout: {
                                  ...formData.layout,
                                  font: font.value,
                                },
                              })
                            }
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.layout.font === font.value
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            style={{ fontFamily: font.value }}
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {font.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
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
