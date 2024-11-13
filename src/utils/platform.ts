// Platform detection utility
export const isPlatform = {
  web: typeof window !== 'undefined' && !('capacitor' in window),
  android: typeof window !== 'undefined' && 'Android' in window,
  ios: typeof window !== 'undefined' && 'iOS' in window,
  mobile: typeof window !== 'undefined' && ('Android' in window || 'iOS' in window),
  desktop: typeof window !== 'undefined' && !('Android' in window || 'iOS' in window)
};