'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MAX_CART_ITEMS } from '../pricing/tiers';

/**
 * Panier côté navigateur.
 *
 * Il ne contient QUE des identifiants de leads. Aucun prix n'y est stocké :
 * les montants sont recalculés par le serveur à chaque changement (voir
 * /api/cart/quote). Un panier falsifié dans le localStorage ne peut donc
 * qu'ajouter ou retirer des leads, jamais changer un tarif.
 */

type CartState = {
  leadIds: string[];
  hydrated: boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      leadIds: [],
      hydrated: false,

      add: (id) => {
        const { leadIds } = get();
        if (leadIds.includes(id) || leadIds.length >= MAX_CART_ITEMS) return;
        set({ leadIds: [...leadIds, id] });
      },

      remove: (id) => set({ leadIds: get().leadIds.filter((x) => x !== id) }),

      toggle: (id) => {
        const { leadIds, add, remove } = get();
        if (leadIds.includes(id)) remove(id);
        else add(id);
      },

      clear: () => set({ leadIds: [] }),

      has: (id) => get().leadIds.includes(id),
    }),
    {
      name: 'akizit.cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ leadIds: state.leadIds }),
      // Le rendu serveur ne connaît pas le localStorage : sans ce drapeau, le
      // compteur du panier différerait entre serveur et client et
      // provoquerait une erreur d'hydratation.
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
