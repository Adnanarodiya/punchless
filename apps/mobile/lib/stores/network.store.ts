import { create } from "zustand";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

type NetworkState = {
  isOnline: boolean;
  initialized: boolean;
  setOnline: (online: boolean) => void;
  initialize: () => () => void;
};

function isConnected(state: NetInfoState): boolean {
  if (state.isConnected == null) return true;
  if (!state.isConnected) return false;
  return state.isInternetReachable !== false;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true,
  initialized: false,

  setOnline: (online) => set({ isOnline: online }),

  initialize: () => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      set({ isOnline: isConnected(state), initialized: true });
    });

    void NetInfo.fetch().then((state) => {
      set({ isOnline: isConnected(state), initialized: true });
    });

    return unsubscribe;
  },
}));