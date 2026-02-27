import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import MapView, { Polygon, Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Supercluster from 'supercluster';
import { MainTabParamList, RootStackParamList } from '../../types/navigation';
import { useAppStore } from '../../store/useAppStore';
import { Incident } from '../../services/data';

type Props = {
    navigation: CompositeNavigationProp<
        BottomTabNavigationProp<MainTabParamList, 'Home'>,
        NativeStackNavigationProp<RootStackParamList>
    >;
};

export function HomeScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const isFocused = useIsFocused();
    const {
        status, riskOverlays, incidents, reports, zoomLevel, isOffline,
        showRisk, showIncidents, showReports, fetchData, setZoomLevel,
        toggleRisk, toggleIncidents, toggleReports,
        selectedCategories, toggleCategory
    } = useAppStore();

    const mapRef = useRef<MapView>(null);
    const [minutesAgo, setMinutesAgo] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    // Clustering state
    const [region, setRegion] = useState<Region>({
        latitude: 23.6345, longitude: -102.5528, latitudeDelta: 15.0, longitudeDelta: 15.0
    });

    // Memoize the clusters
    const supercluster = useMemo(() => {
        const sc = new Supercluster({ radius: 40, maxZoom: 16 });

        // Filter incidents by category before clustering
        const filteredIncidents = incidents.filter(i =>
            selectedCategories.length === 0 || selectedCategories.includes(i.category)
        );

        const points = filteredIncidents.map(inc => ({
            type: 'Feature' as const,
            properties: { ...inc, cluster: false },
            geometry: { type: 'Point' as const, coordinates: [inc.coordinate.longitude, inc.coordinate.latitude] }
        }));

        sc.load(points);
        return sc;
    }, [incidents, selectedCategories]);

    const clusters = useMemo(() => {
        const bbox: [number, number, number, number] = [
            region.longitude - region.longitudeDelta / 2, // minLng
            region.latitude - region.latitudeDelta / 2,   // minLat
            region.longitude + region.longitudeDelta / 2, // maxLng
            region.latitude + region.latitudeDelta / 2    // maxLat
        ];
        // Calculate zoom from longitudeDelta realistically map roughly 0-20
        const zoom = Math.round(Math.log2(360 / region.longitudeDelta));
        return supercluster.getClusters(bbox, Math.min(Math.max(zoom, 0), 16));
    }, [supercluster, region]);

    // Available Categories for Filters
    const availableCategories = useMemo(() => {
        const cats = new Set(incidents.map(i => i.category));
        return Array.from(cats);
    }, [incidents]);

    useEffect(() => {
        if (isFocused) fetchData();
    }, [isFocused]);

    useEffect(() => {
        if (!status?.lastUpdatedAt) return;
        const calcMins = () => {
            const diff = Date.now() - new Date(status.lastUpdatedAt).getTime();
            setMinutesAgo(Math.max(0, Math.floor(diff / 60000)));
        };
        calcMins();
        const int = setInterval(calcMins, 60000);
        return () => clearInterval(int);
    }, [status]);

    const handleRegionChangeComplete = (reg: Region) => {
        setRegion(reg);
        const newZoom = reg.longitudeDelta < 2.0 ? 'close' : 'far';
        if (newZoom !== zoomLevel) setZoomLevel(newZoom);
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'HIGH': return 'rgba(255, 0, 0, 0.4)';
            case 'MEDIUM': return 'rgba(255, 165, 0, 0.4)';
            case 'LOW': return 'rgba(0, 255, 0, 0.4)';
            default: return 'rgba(128, 128, 128, 0.4)';
        }
    };

    const getRiskStrokeColor = (level: string) => {
        switch (level) {
            case 'HIGH': return 'rgba(255, 0, 0, 1)';
            case 'MEDIUM': return 'rgba(255, 165, 0, 1)';
            case 'LOW': return 'rgba(0, 255, 0, 1)';
            default: return 'rgba(128, 128, 128, 1)';
        }
    };

    return (
        <View style={styles.container}>
            {/* Status Bar */}
            <View style={styles.statusBar}>
                <View style={styles.statusLeft}>
                    <Text style={styles.statusTime}>
                        {t('map.updated_ago', { minutes: minutesAgo })} • {status?.coverage || 'Norte/Centro'}
                    </Text>
                    <View style={styles.sourceIndicators}>
                        <Text style={styles.sourceLabel}>Ofc: {status?.sources.official === 'OK' ? '🟢' : '🟡'}</Text>
                        <Text style={styles.sourceLabel}>Rep: {status?.sources.user_reports === 'OK' ? '🟢' : '🟡'}</Text>
                        <Text style={styles.sourceLabel}>Ag: {status?.sources.news_aggregators === 'OK' ? '🟢' : '🟡'}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('ComoCalculamos')} style={styles.statusRight}>
                    <Text style={styles.statusConfidence}>Confianza: ALTA ℹ️</Text>
                    <Text style={styles.statusBtn}>{t('map.sources_method')}</Text>
                </TouchableOpacity>
            </View>

            {isOffline && (
                <View style={styles.offlineBanner}>
                    <Text style={styles.offlineText}>Conexión fallida - Cache local activo</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
                        <Text style={styles.retryBtnText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            )}

            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                onRegionChangeComplete={handleRegionChangeComplete}
                initialRegion={region}
            >
                {/* Risco Geral - Híbrido Célula ou Região */}
                {showRisk && riskOverlays.map((overlay) => {
                    if (overlay.type === 'cell' && overlay.coordinates) {
                        return (
                            <Polygon
                                key={overlay.id}
                                coordinates={overlay.coordinates}
                                fillColor={getRiskColor(overlay.riskLevel)}
                                strokeColor={getRiskStrokeColor(overlay.riskLevel)}
                                strokeWidth={2}
                                tappable
                                onPress={() => alert(`Grid Confiança: ${overlay.confidence}\nFonte: ${overlay.sourceTag}`)}
                            />
                        )
                    } else if (overlay.type === 'region' && overlay.coordinate) {
                        return (
                            <Marker
                                key={overlay.id}
                                coordinate={overlay.coordinate}
                                title={overlay.name}
                                description={`Nível Médio: ${t('map.risk_' + overlay.riskLevel.toLowerCase())}`}
                                pinColor="indigo"
                            />
                        )
                    }
                    return null;
                })}

                {/* Incidentes Clusterizados */}
                {showIncidents && clusters.map((clusterItem) => {
                    const [longitude, latitude] = clusterItem.geometry.coordinates;
                    const isCluster = clusterItem.properties.cluster;

                    if (isCluster) {
                        return (
                            <Marker
                                key={`cluster-${clusterItem.id}`}
                                coordinate={{ latitude, longitude }}
                                onPress={() => {
                                    // Zoom into cluster logic could go here
                                    const zoom = supercluster.getClusterExpansionZoom(clusterItem.id as number);
                                    mapRef.current?.animateToRegion({
                                        latitude, longitude,
                                        latitudeDelta: region.latitudeDelta / 2,
                                        longitudeDelta: region.longitudeDelta / 2
                                    });
                                }}
                            >
                                <View style={styles.clusterMarker}>
                                    <Text style={styles.clusterText}>{clusterItem.properties.point_count}</Text>
                                </View>
                            </Marker>
                        );
                    }

                    // Single point
                    const evt = clusterItem.properties as Incident;
                    return (
                        <Marker
                            key={evt.id}
                            coordinate={{ latitude, longitude }}
                            title={evt.title}
                            description={evt.category}
                            pinColor={evt.riskLevel === 'HIGH' ? 'red' : 'orange'}
                            onCalloutPress={() => {
                                // @ts-ignore
                                navigation.navigate('Detail', { id: evt.id, type: 'event' });
                            }}
                        />
                    );
                })}

                {/* Reportes de Usuários */}
                {showReports && reports.map((cluster) => (
                    <Marker
                        key={cluster.id}
                        coordinate={cluster.coordinate}
                        title={t('map.report_here', { count: cluster.count })}
                        description={cluster.categories.join(', ')}
                        pinColor="blue"
                    />
                ))}
            </MapView>

            {/* Fading Filters UI */}
            {showFilters && (
                <View style={styles.filtersDrawer}>
                    <Text style={styles.filtersTitle}>Filtros de Categoria</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {availableCategories.map(cat => {
                            const active = selectedCategories.includes(cat);
                            return (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.filterPill, active && styles.filterPillActive]}
                                    onPress={() => toggleCategory(cat)}
                                >
                                    <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{cat}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Overlays / Toggles no mapa */}
            <View style={styles.controlsContainer}>
                <View style={styles.ctaRow}>
                    <TouchableOpacity style={styles.ctaButtonSec} onPress={() => setShowFilters(!showFilters)}>
                        <Text style={styles.ctaButtonTextSec}>{showFilters ? 'Fehcar Filtros' : 'Filtros (Categorías)'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Layer Toggles */}
                <View style={styles.toggleColumn}>
                    <TouchableOpacity style={[styles.toggleButton, showRisk && styles.toggleButtonActive]} onPress={toggleRisk}>
                        <Text style={[styles.toggleText, showRisk && styles.toggleTextActive]}>{t('map.layer_risk')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleButton, showIncidents && styles.toggleButtonActive]} onPress={toggleIncidents}>
                        <Text style={[styles.toggleText, showIncidents && styles.toggleTextActive]}>{t('map.layer_incidents')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleButton, showReports && styles.toggleButtonActive]} onPress={toggleReports}>
                        <Text style={[styles.toggleText, showReports && styles.toggleTextActive]}>{t('map.layer_reports')}</Text>
                    </TouchableOpacity>
                </View>

                {/* FAB: New Report */}
                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NewReport')}>
                    <Text style={styles.fabIcon}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
    statusBar: {
        position: 'absolute', top: 0, width: '100%', backgroundColor: 'rgba(30,30,30,0.9)',
        paddingTop: 45, paddingBottom: 10, paddingHorizontal: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10
    },
    statusLeft: { flexDirection: 'column', flex: 1 },
    statusTime: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    sourceIndicators: { flexDirection: 'row', marginTop: 4 },
    sourceLabel: { color: '#aaa', fontSize: 10, marginRight: 8 },
    statusRight: { alignItems: 'flex-end' },
    statusConfidence: { color: '#ffd700', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
    statusBtn: { color: '#4da6ff', fontSize: 11, fontWeight: 'bold', textDecorationLine: 'underline' },

    controlsContainer: { position: 'absolute', bottom: 20, left: 20, right: 20, justifyContent: 'flex-end' },
    ctaRow: { flexDirection: 'row', marginBottom: 8, justifyContent: 'flex-start' },
    ctaButtonSec: { backgroundColor: 'rgba(255,255,255,0.95)', padding: 10, borderRadius: 20, elevation: 4 },
    ctaButtonTextSec: { color: '#333', fontWeight: 'bold', fontSize: 12 },

    toggleColumn: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8, overflow: 'hidden', elevation: 3, maxWidth: 180 },
    toggleButton: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    toggleButtonActive: { backgroundColor: '#e6f2ff' },
    toggleText: { fontSize: 14, color: '#666' },
    toggleTextActive: { color: '#0066cc', fontWeight: 'bold' },

    fab: {
        position: 'absolute', bottom: 120, right: 0, backgroundColor: '#cc0000',
        width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6
    },
    fabIcon: { fontSize: 32, color: '#fff', lineHeight: 34 },

    offlineBanner: {
        position: 'absolute', top: 95, left: 0, right: 0, backgroundColor: 'rgba(255, 140, 0, 0.95)',
        paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 9
    },
    offlineText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    retryBtn: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
    retryBtnText: { color: '#ff8c00', fontSize: 12, fontWeight: 'bold' },

    clusterMarker: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,0,0,0.8)',
        justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff'
    },
    clusterText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    filtersDrawer: {
        position: 'absolute', top: 95, left: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 8, padding: 12, elevation: 5, zIndex: 8
    },
    filtersTitle: { fontWeight: 'bold', marginBottom: 8, color: '#333' },
    filterPill: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
        backgroundColor: '#eee', marginRight: 8, borderWidth: 1, borderColor: '#ccc'
    },
    filterPillActive: { backgroundColor: '#0066cc', borderColor: '#004c99' },
    filterPillText: { fontSize: 12, color: '#555' },
    filterPillTextActive: { color: '#fff', fontWeight: 'bold' }
});
