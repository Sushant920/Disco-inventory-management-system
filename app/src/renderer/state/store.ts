import { create } from 'zustand';
import { InventorySummary, Product } from '@shared/types';

interface AppState {
  products: Product[];
  inventory: InventorySummary[];
  loading: boolean;
  error?: string;
  refreshAll: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  products: [],
  inventory: [],
  loading: false,
  error: undefined,
  refreshAll: async () => {
    try {
      set({ loading: true, error: undefined });
      const [products, inventory] = await Promise.all([window.api.products.list(), window.api.inventory.list()]);
      set({ products, inventory });
    } catch (err: any) {
      set({ error: err?.message ?? 'Failed to load data' });
    } finally {
      set({ loading: false });
    }
  }
}));

