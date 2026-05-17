import React, { useMemo, useState } from 'react';

const BACKEND = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const PALETTE = [
  '#3B82F6', // blue-500
  '#6366F1', // indigo-500
  '#8B5CF6', // violet-500
  '#A855F7', // purple-500
  '#EC4899', // pink-500
  '#F43F5E', // rose-500
  '#EF4444', // red-500
  '#F97316', // orange-500
  '#F59E0B', // amber-500
  '#10B981', // emerald-500
  '#22C55E', // green-500
  '#14B8A6', // teal-500
  '#06B6D4', // cyan-500
];

function hashToIndex(input, mod) {
  if (!input) return 0;
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // keep 32-bit
  }
  return Math.abs(hash) % mod;
}

function resolveUrl(url) {
  if (!url) return null;
  if (typeof url !== 'string') return null;
  if (!url.trim()) return null;
  // Reject known placeholder / dummy avatar URLs
  const lower = url.toLowerCase();
  if (
    lower.includes('placehold') ||
    lower.includes('placeholder') ||
    lower.includes('ui-avatars.com') ||
    /\b\d+x\d+\b/.test(lower)
  ) return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${BACKEND}${url}`;
  // Handle common relative paths from backend, e.g. "uploads/xyz.jpg"
  if (url.includes('/')) return `${BACKEND}/${url.replace(/^\.?\//, '')}`;
  return url;
}

function pickInitial(name) {
  const raw = (name || '').trim();
  if (!raw) return 'U';
  return raw[0].toUpperCase();
}

/**
 * Avatar
 * - If imageUrl provided (and loads) -> render image
 * - Else -> render initial fallback with consistent hashed background
 *
 * Props:
 * - name: string (used for initial)
 * - imageUrl: string | { url: string } | null
 * - size: number (px) | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * - seed: string (optional stable value for color hashing: userId/email/etc)
 * - className: string
 */
export default function Avatar({
  name,
  imageUrl,
  size = 'md',
  seed,
  className = '',
  title,
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const px = useMemo(() => {
    if (typeof size === 'number') return size;
    const map = { xs: 20, sm: 28, md: 40, lg: 48, xl: 64 };
    return map[size] || 40;
  }, [size]);

  const resolved = useMemo(() => {
    const url = (() => {
      if (typeof imageUrl === 'string') return imageUrl;
      if (!imageUrl || typeof imageUrl !== 'object') return null;
      // Common backend shapes: { url }, { path }, { src }, { secure_url }
      if (typeof imageUrl.url === 'string') return imageUrl.url;
      if (typeof imageUrl.path === 'string') return imageUrl.path;
      if (typeof imageUrl.src === 'string') return imageUrl.src;
      if (typeof imageUrl.secure_url === 'string') return imageUrl.secure_url;
      return null;
    })();
    return resolveUrl(url);
  }, [imageUrl]);

  const initial = useMemo(() => pickInitial(name), [name]);
  const bg = useMemo(() => {
    const key = (seed || name || initial || 'U').toString();
    return PALETTE[hashToIndex(key, PALETTE.length)];
  }, [seed, name, initial]);

  const commonStyle = {
    width: px,
    height: px,
    borderRadius: '9999px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    userSelect: 'none',
    lineHeight: 1,
  };

  if (resolved && !imgFailed) {
    return (
      <img
        src={resolved}
        alt={name || 'User'}
        title={title || name || 'User'}
        className={className}
        style={{ ...commonStyle, objectFit: 'cover' }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={className}
      title={title || name || 'User'}
      style={{
        ...commonStyle,
        background: bg,
        color: '#fff',
        fontWeight: 800,
        fontSize: Math.max(10, Math.round(px * 0.42)),
      }}
      aria-label={name || 'User'}
    >
      {initial}
    </div>
  );
}

