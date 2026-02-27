import AsyncStorage from '@react-native-async-storage/async-storage';
import { RiskLevel, Coordinate } from '../types';
import { ENV } from '../config/env';

export interface MapDataStatus {
    lastUpdatedAt: string;
    coverage: string;
    sources: {
        official: string;
        user_reports: string;
        news_aggregators: string;
    };
}

export interface RiskOverlay {
    id: string;
    name: string;
    type: 'region' | 'cell';
    riskLevel: RiskLevel;
    coordinate?: Coordinate;
    coordinates?: Coordinate[];
    confidence: string;
    lastUpdate?: string;
    description?: string;
    sourceTag?: string;
}

export interface Incident {
    id: string;
    title: string;
    category: string;
    coordinate: Coordinate;
    date: string;
    riskLevel: RiskLevel;
    description: string;
    confidence: string;
    sourceTag: string;
}

export interface UserReportCluster {
    id: string;
    coordinate: Coordinate;
    count: number;
    categories: string[];
    title: string;
}

const CACHE_KEYS = {
    STATUS: '@MXSeguro:cache_status',
    RISK_FAR: '@MXSeguro:cache_risk_far',
    RISK_CLOSE: '@MXSeguro:cache_risk_close',
    INCIDENTS: '@MXSeguro:cache_incidents',
    REPORTS: '@MXSeguro:cache_reports'
};

async function fetchWithCache<T>(url: string, cacheKey: string): Promise<T> {
    try {
        const resp = await fetch(url, { timeout: 8000 } as RequestInit); // timeout de 8s mock
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const data = await resp.json();
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data)); // update cache
        return data;
    } catch (e) {
        console.warn(`[Network] Falha ao acessar ${url}. Buscando cache ${cacheKey}...`, e);
        const cachedItem = await AsyncStorage.getItem(cacheKey);
        if (cachedItem) {
            return JSON.parse(cachedItem) as T;
        }
        throw e; // Lança o erro para o Zustand tratar o estado de Error Global
    }
}

export const DataProvider = {
    async getStatus(): Promise<MapDataStatus> {
        return fetchWithCache<MapDataStatus>(`${ENV.API_URL}/status`, CACHE_KEYS.STATUS);
    },

    async getRiskMap(zoomLevel: 'far' | 'close'): Promise<RiskOverlay[]> {
        const key = zoomLevel === 'far' ? CACHE_KEYS.RISK_FAR : CACHE_KEYS.RISK_CLOSE;
        return fetchWithCache<RiskOverlay[]>(`${ENV.API_URL}/risk?zoomLevel=${zoomLevel}`, key);
    },

    async getIncidents(): Promise<Incident[]> {
        return fetchWithCache<Incident[]>(`${ENV.API_URL}/incidents`, CACHE_KEYS.INCIDENTS);
    },

    async getUserReports(): Promise<UserReportCluster[]> {
        return fetchWithCache<UserReportCluster[]>(`${ENV.API_URL}/reports`, CACHE_KEYS.REPORTS);
    },

    async submitReport(data: { category: string; description: string; coordinate: Coordinate }) {
        const resp = await fetch(`${ENV.API_URL}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await resp.json();
        if (!resp.ok) {
            throw new Error(result.error || 'Falha ao enviar relato');
        }

        try {
            const raw = await AsyncStorage.getItem('@MXSeguro:my_reports');
            const myReports = raw ? JSON.parse(raw) : [];
            myReports.unshift(result);
            await AsyncStorage.setItem('@MXSeguro:my_reports', JSON.stringify(myReports));
        } catch (e) { console.warn('Cache save error', e); }

        return result;
    },

    async getMyReports(): Promise<any[]> {
        try {
            const raw = await AsyncStorage.getItem('@MXSeguro:my_reports');
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }
};
