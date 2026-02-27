import { create } from 'zustand';
import { DataProvider, RiskOverlay, Incident, UserReportCluster, MapDataStatus } from '../services/data';

interface AppState {
    status: MapDataStatus | null;
    riskOverlays: RiskOverlay[];
    incidents: Incident[];
    reports: UserReportCluster[];

    isOffline: boolean;

    zoomLevel: 'far' | 'close';
    showRisk: boolean;
    showIncidents: boolean;
    showReports: boolean;

    selectedCategories: string[];

    fetchData: () => Promise<void>;
    setZoomLevel: (zoom: 'far' | 'close') => void;
    toggleRisk: () => void;
    toggleIncidents: () => void;
    toggleReports: () => void;
    toggleCategory: (category: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    status: null,
    riskOverlays: [],
    incidents: [],
    reports: [],

    isOffline: false,

    zoomLevel: 'far', // default
    showRisk: true,
    showIncidents: true,
    showReports: true,

    selectedCategories: [], // Empty means show all

    fetchData: async () => {
        try {
            const [status, riskOverlays, incidents, reports] = await Promise.all([
                DataProvider.getStatus(),
                DataProvider.getRiskMap(get().zoomLevel),
                DataProvider.getIncidents(),
                DataProvider.getUserReports()
            ]);
            set({ status, riskOverlays, incidents, reports, isOffline: false });
        } catch (e) {
            console.error('Error fetching data cycle', e);
            set({ isOffline: true });
        }
    },

    setZoomLevel: (zoom) => {
        set({ zoomLevel: zoom });
        get().fetchData(); // re-fetch with new zoom query
    },

    toggleRisk: () => set((state) => ({ showRisk: !state.showRisk })),
    toggleIncidents: () => set((state) => ({ showIncidents: !state.showIncidents })),
    toggleReports: () => set((state) => ({ showReports: !state.showReports })),

    toggleCategory: (category) => set((state) => {
        const arr = state.selectedCategories;
        if (arr.includes(category)) {
            return { selectedCategories: arr.filter(c => c !== category) };
        }
        return { selectedCategories: [...arr, category] };
    }),
}));
