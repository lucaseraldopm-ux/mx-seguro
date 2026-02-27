import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { useAppStore } from '../../store/useAppStore';

type Props = {
    route: RouteProp<RootStackParamList, 'Detail'>;
};

export function DetailScreen({ route }: Props) {
    const { id, type } = route.params;
    const { riskOverlays, incidents } = useAppStore();

    const getRiskColor = (level: string | undefined) => {
        switch (level) {
            case 'HIGH': return '#cc0000';
            case 'MEDIUM': return '#cc7a00';
            case 'LOW': return '#009900';
            default: return '#666';
        }
    };

    const renderContent = () => {
        if (type === 'zone') {
            const zone = riskOverlays.find(z => z.id === id);
            if (!zone) return <Text>Zona não encontrada.</Text>;

            return (
                <View>
                    <Text style={styles.title}>{zone.name}</Text>
                    <View style={[styles.badge, { backgroundColor: getRiskColor(zone.riskLevel) }]}>
                        <Text style={styles.badgeText}>Risco: {zone.riskLevel}</Text>
                    </View>
                    <Text style={styles.label}>Descrição:</Text>
                    <Text style={styles.paragraph}>{zone.description || 'Monitoramento padrão.'}</Text>

                    <View style={styles.metaBox}>
                        <Text style={styles.metaLabel}>Última atualização:</Text>
                        <Text style={styles.metaValue}>{zone.lastUpdate ? new Date(zone.lastUpdate).toLocaleString() : 'N/A'}</Text>

                        <Text style={styles.metaLabel}>Confiança da Fonte:</Text>
                        <Text style={styles.metaValue}>{zone.confidence}</Text>

                        <Text style={styles.metaLabel}>Fonte originária:</Text>
                        <Text style={styles.sourceText}>{zone.sourceTag}</Text>
                    </View>
                </View>
            );
        } else {
            const event = incidents.find(e => e.id === id);
            if (!event) return <Text>Evento não encontrado.</Text>;

            // Lógica fictícia baseada em histórico de backend
            const historico = event.riskLevel === 'HIGH'
                ? "Nos últimos 7 dias, incidentes similares cresceram 15% na região. Recomenda-se evitar deslocamentos não-essenciais após as 18h."
                : "A região apresenta estabilidade nos últimos 3 dias. Mantenha as precauções rotineiras.";

            const fonteExterna = event.sourceTag.includes('Oficial')
                ? "https://www.gob.mx/seguridad"
                : "https://x.com/search?q=" + encodeURIComponent(event.category || '');

            return (
                <View>
                    <Text style={styles.title}>{event.title}</Text>
                    <View style={[styles.badge, { backgroundColor: getRiskColor(event.riskLevel) }]}>
                        <Text style={styles.badgeText}>Risco do Evento: {event.riskLevel}</Text>
                    </View>
                    <Text style={styles.label}>Categoria:</Text>
                    <Text style={styles.paragraph}>{event.category}</Text>
                    <Text style={styles.label}>Descrição:</Text>
                    <Text style={styles.paragraph}>{event.description}</Text>

                    <Text style={styles.label}>O que isso significa?</Text>
                    <Text style={styles.historicoParagraph}>{historico}</Text>

                    <View style={styles.metaBox}>
                        <Text style={styles.metaLabel}>Data do Ocorrido:</Text>
                        <Text style={styles.metaValue}>{new Date(event.date).toLocaleString()}</Text>

                        <Text style={styles.metaLabel}>Confiança do Fato:</Text>
                        <Text style={styles.metaValue}>{event.confidence}</Text>

                        <Text style={styles.metaLabel}>Fonte Originária:</Text>
                        <Text style={styles.sourceText}>{event.sourceTag}</Text>

                        {/* Faux Links In-App */}
                        <Text style={styles.metaLabel}>Detalhes Oficiais:</Text>
                        <Text style={styles.linkText} onPress={() => alert('Abriria: ' + fonteExterna)}>Acessar Fonte Externa ↗</Text>
                    </View>
                </View>
            );
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {renderContent()}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, color: '#333' },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 24 },
    badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    label: { fontSize: 16, fontWeight: 'bold', color: '#666', marginTop: 16, marginBottom: 8 },
    paragraph: { fontSize: 16, color: '#333', lineHeight: 24 },
    historicoParagraph: { fontSize: 15, color: '#444', lineHeight: 22, fontStyle: 'italic', backgroundColor: '#fff3e0', padding: 12, borderRadius: 8 },
    metaBox: { marginTop: 24, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
    metaLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 2, marginTop: 8 },
    metaValue: { fontSize: 14, color: '#333', fontWeight: 'bold', marginBottom: 4 },
    sourceText: { fontSize: 14, color: '#0066cc', fontWeight: 'bold', marginBottom: 4 },
    linkText: { fontSize: 14, color: '#0066cc', textDecorationLine: 'underline' },
});
