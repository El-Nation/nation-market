import { create } from 'zustand';

interface LocationState {
  location: string;
  isDetecting: boolean;
  setLocation: (loc: string) => void;
  initLocation: () => void;
  detectLocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set) => ({
  location: '29 Imatitikua, Uselu, Benin City',
  isDetecting: false,

  setLocation: (loc: string) => {
    if (typeof window !== 'undefined') localStorage.setItem('nm_location', loc);
    set({ location: loc });
  },

  initLocation: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nm_location');
      if (saved) {
        set({ location: saved });
      }
    }
  },

  detectLocation: async () => {
    set({ isDetecting: true });
    
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        set({ isDetecting: false });
        alert('Geolocation not supported');
        resolve();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            
            let descriptiveLoc = '';
            if (data && data.address) {
               const city = data.address.city || data.address.town || data.address.village || data.address.suburb || 'Unknown Area';
               const state = data.address.state || data.address.region || '';
               descriptiveLoc = `${city}${state ? ', ' + state : ''} (Detected📍)`;
            } else {
               descriptiveLoc = `${lat.toFixed(2)}, ${lon.toFixed(2)} (Detected📍)`;
            }

            if (typeof window !== 'undefined') localStorage.setItem('nm_location', descriptiveLoc);
            set({ location: descriptiveLoc, isDetecting: false });
          } catch (err) {
            const backupLoc = `${lat.toFixed(2)}, ${lon.toFixed(2)} (Detected📍)`;
            if (typeof window !== 'undefined') localStorage.setItem('nm_location', backupLoc);
            set({ location: backupLoc, isDetecting: false });
          }
          resolve();
        },
        (error) => {
          set({ isDetecting: false });
          console.warn('Geolocation failed:', error);
          resolve();
        }
      );
    });
  }
}));
