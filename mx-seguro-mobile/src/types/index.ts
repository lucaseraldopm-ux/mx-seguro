export interface UserProfile {
    id: string;
    email: string;
    name: string;
    plan: 'FREE' | 'PRO';
    preferences: {
        alertsEnabled: boolean;
        alertRadius: number;
        categories: string[];
    };
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Coordinate {
    latitude: number;
    longitude: number;
}

export interface Zone {
    id: string;
    name: string;
    riskLevel: RiskLevel;
    coordinates: Coordinate[];
    description: string;
    lastUpdate: string;
    sources: string[];
}

export interface RiskEvent {
    id: string;
    title: string;
    category: string;
    coordinate: Coordinate;
    date: string;
    riskLevel: RiskLevel;
    description: string;
}
