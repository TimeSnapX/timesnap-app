import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Snap } from '../types';

interface SnapsStore {
  snaps: Snap[];
  addSnap: (snap: Omit<Snap, 'id'>) => void;
  updateSnap: (id: string, updates: Partial<Snap>) => void;
  removeSnap: (id: string) => void;
}

export const useSnapsStore = create<SnapsStore>()(
  persist(
    (set) => ({
      snaps: [],
      addSnap: (newSnap) =>
        set((state) => ({
          snaps: [{ ...newSnap, id: Date.now().toString() }, ...state.snaps],
        })),
      updateSnap: (id, updates) =>
        set((state) => ({
          snaps: state.snaps.map((snap) =>
            snap.id === id ? { ...snap, ...updates } : snap
          ),
        })),
      removeSnap: (id) =>
        set((state) => ({
          snaps: state.snaps.filter((s) => s.id !== id),
        })),
    }),
    {
      name: 'snaps-storage',
      storage: createJSONStorage(() => localStorage), 
    }
  )
);
