'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { MediaUpload } from '@/types';
import {
  Image as ImageIcon,
  UploadCloud,
  Search,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Plus,
  RefreshCw,
  FolderOpen,
  Filter,
  Eye,
  X,
  FileImage,
  Database,
  Sparkles,
  Layers,
  ArrowUpDown,
} from 'lucide-react';

export default function AdminMediaLibraryPage() {
  const [mediaAssets, setMediaAssets] = useState<MediaUpload[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'size_desc' | 'name_asc'>('date_desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inspectAsset, setInspectAsset] = useState<MediaUpload | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<string>('products');
  const [uploadError, setUploadError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all media assets
  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/media?limit=250');
      const data = await res.json();
      if (data.success && Array.isArray(data.media)) {
        setMediaAssets(data.media);
      }
    } catch (err) {
      console.error('Failed to load media assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  // Handle Copy URL with feedback
  const handleCopyUrl = async (url: string, id: string) => {
    try {
      const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Handle Delete Media
  const handleDeleteMedia = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this media asset? Any product referencing this URL will need updating.')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMediaAssets((prev) => prev.filter((item) => item.id !== id));
        if (inspectAsset?.id === id) {
          setInspectAsset(null);
        }
      } else {
        alert(data.error || 'Failed to delete asset');
      }
    } catch (err) {
      console.error('Delete media error:', err);
      alert('Network error while deleting media');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle File Selection
  const handleFileChange = (file: File) => {
    setUploadFile(file);
    setUploadError('');
    if (!uploadTitle.trim()) {
      // Auto fill title from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setUploadTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Form Submit for Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select an image file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle.trim());
      formData.append('category', uploadCategory);

      const res = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.media) {
        setMediaAssets((prev) => [data.media, ...prev]);
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadPreview(null);
        setUploadTitle('');
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Filter & Sort
  const filteredAssets = useMemo(() => {
    let list = [...mediaAssets];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.filename.toLowerCase().includes(q) ||
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'ALL') {
      list = list.filter((item) => (item.category || 'general').toLowerCase() === selectedCategory.toLowerCase());
    }

    list.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'size_desc') {
        return (b.byteSize || 0) - (a.byteSize || 0);
      }
      if (sortBy === 'name_asc') {
        return (a.title || a.filename).localeCompare(b.title || b.filename);
      }
      return 0;
    });

    return list;
  }, [mediaAssets, searchQuery, selectedCategory, sortBy]);

  // Total storage size in KB/MB
  const totalStorageBytes = useMemo(() => {
    return mediaAssets.reduce((sum, item) => sum + (item.byteSize || 0), 0);
  }, [mediaAssets]);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  const categories = ['ALL', 'products', 'bakery', 'outlets', 'marketing'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-semibold tracking-widest uppercase bg-amber-100/70 text-amber-900 border border-amber-200/60 mb-2">
            <Database className="w-3 h-3 text-amber-700" />
            <span>Digital Asset Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Media Library
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            Upload, browse, inspect, and copy permanent URLs for bakery product photos, outlet storefronts, and marketing creatives.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchMedia}
            disabled={isLoading}
            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl transition cursor-pointer disabled:opacity-50"
            title="Refresh Media List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Upload New Photo</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Total Photos
          </span>
          <span className="text-2xl font-serif font-bold text-stone-900 block mt-1">
            {mediaAssets.length}
          </span>
          <span className="text-[10px] text-stone-500">Live cloud assets</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Product Images
          </span>
          <span className="text-2xl font-serif font-bold text-stone-900 block mt-1">
            {mediaAssets.filter((m) => (m.category || 'products').toLowerCase() === 'products').length}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Ready for catalog</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Storage Footprint
          </span>
          <span className="text-2xl font-serif font-bold text-stone-900 block mt-1">
            {formatFileSize(totalStorageBytes)}
          </span>
          <span className="text-[10px] text-stone-500">PostgreSQL cloud storage</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            Fast Asset Serving
          </span>
          <span className="text-2xl font-serif font-bold text-emerald-700 block mt-1">
            CDN Cached
          </span>
          <span className="text-[10px] text-stone-500">1-year immutable cache</span>
        </div>
      </div>

      {/* Search, Filter, and Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search images by title, filename, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-200 rounded-xl text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="size_desc">Largest Size</option>
              <option value="name_asc">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-stone-400" />
            <span>Category:</span>
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer capitalize ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat === 'ALL' ? 'All Assets' : cat}
            </button>
          ))}
          <span className="text-[10px] text-stone-400 ml-auto font-mono">
            Showing {filteredAssets.length} of {mediaAssets.length}
          </span>
        </div>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-stone-200/80 shadow-2xs space-y-3">
          <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-stone-600">Loading media library assets...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-stone-300 shadow-2xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <FileImage className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-stone-900 text-base">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'No media assets found matching filter'
                : 'Your media library is empty'}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'ALL'
                ? 'Try clearing your search terms or picking another category filter.'
                : 'Upload your high-resolution bakery items, outlet storefronts, or banner images.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-2xl inline-flex items-center gap-2 shadow-xs cursor-pointer transition"
          >
            <UploadCloud className="w-4 h-4 text-amber-400" />
            <span>Upload Your First Image</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredAssets.map((asset) => {
            const isCopied = copiedId === asset.id;
            const assetUrl = asset.url || `/api/media/${asset.id}`;

            return (
              <div
                key={asset.id}
                className="group bg-white rounded-2xl border border-stone-200 hover:border-stone-400 shadow-2xs hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                {/* Thumbnail Container */}
                <div
                  className="relative aspect-square bg-stone-100 cursor-pointer overflow-hidden"
                  onClick={() => setInspectAsset(asset)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={assetUrl}
                    alt={asset.title || asset.filename}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Top Category Badge */}
                  <div className="absolute top-2 left-2 pointer-events-none">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-xs text-white border border-white/20">
                      {asset.category || 'Bakery'}
                    </span>
                  </div>

                  {/* Hover Overlay with Quick View */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="p-2 bg-white/90 text-stone-900 rounded-full shadow-md hover:bg-white transition">
                      <Eye className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {/* Card Info & Actions */}
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h4
                      className="font-semibold text-xs text-stone-900 truncate"
                      title={asset.title || asset.filename}
                    >
                      {asset.title || asset.filename}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono mt-0.5">
                      <span>{formatFileSize(asset.byteSize)}</span>
                      <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(assetUrl, asset.id)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                      }`}
                      title="Copy URL to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-stone-500" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(asset.id)}
                      disabled={deletingId === asset.id}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer disabled:opacity-50"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          UPLOAD MODAL DIALOG
         ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Upload Media Asset
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadFile(null);
                  setUploadPreview(null);
                  setUploadError('');
                }}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
                  isDragging
                    ? 'border-amber-600 bg-amber-50/50'
                    : 'border-stone-300 hover:border-stone-400 bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                {uploadPreview ? (
                  <div className="space-y-2">
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden mx-auto border border-stone-200 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={uploadPreview}
                        alt="Upload Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-stone-700 block">
                      {uploadFile?.name} ({formatFileSize(uploadFile?.size || 0)})
                    </span>
                    <span className="text-[10px] text-amber-700 underline font-medium">
                      Click to choose a different photo
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-800 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-stone-900">
                        Click or drag &amp; drop your image here
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Supports JPEG, PNG, WebP up to 10MB
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Title & Category Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Photo Title / Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dutch Truffle Cake"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Category Tag
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none cursor-pointer"
                  >
                    <option value="products">Products &amp; Items</option>
                    <option value="bakery">Bakery &amp; Kitchen</option>
                    <option value="outlets">Outlets &amp; Storefronts</option>
                    <option value="marketing">Marketing &amp; Banners</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading to Cloud...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4 text-amber-400" />
                      <span>Upload &amp; Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          INSPECT ASSET MODAL
         ========================================================================= */}
      {inspectAsset && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-3xl w-full max-w-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif font-bold text-base text-stone-900 truncate max-w-md">
                  {inspectAsset.title || inspectAsset.filename}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectAsset(null)}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              {/* Image Full Preview */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-inner flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inspectAsset.url || `/api/media/${inspectAsset.id}`}
                  alt={inspectAsset.title || inspectAsset.filename}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Metadata Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Permanent Direct URL
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inspectAsset.url || `/api/media/${inspectAsset.id}`}
                      className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono text-stone-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyUrl(
                          inspectAsset.url || `/api/media/${inspectAsset.id}`,
                          inspectAsset.id
                        )
                      }
                      className="px-3 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-stone-800"
                    >
                      {copiedId === inspectAsset.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-500">
                    Use this direct link in Product Master images, Outlet Storefronts, or Website Banners.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-stone-200/80 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Category
                    </span>
                    <span className="font-semibold text-stone-800 capitalize">
                      {inspectAsset.category || 'Products'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      File Size
                    </span>
                    <span className="font-semibold text-stone-800 font-mono">
                      {formatFileSize(inspectAsset.byteSize)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      MIME Type
                    </span>
                    <span className="font-semibold text-stone-800 font-mono text-[11px]">
                      {inspectAsset.mimeType}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Uploaded Date
                    </span>
                    <span className="font-semibold text-stone-800">
                      {new Date(inspectAsset.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between gap-2">
                  <a
                    href={inspectAsset.url || `/api/media/${inspectAsset.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
                    <span>Open Full Image</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDeleteMedia(inspectAsset.id)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Asset</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
