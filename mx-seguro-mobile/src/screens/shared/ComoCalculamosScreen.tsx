import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';

export function ComoCalculamosScreen() {
    const { status } = useAppStore();
    const { t } = useTranslation();

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{t('map.sources_method')}</Text>

            <View style={styles.statusBox}>
                <Text style={styles.statusTitle}>{t('sources.status_title')}</Text>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('sources.official')}:</Text>
                    <Text style={[styles.val, status?.sources.official === 'OK' ? styles.ok : styles.warn]}>
                        {status?.sources.official || t('sources.status_down')}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('sources.user_reports')}:</Text>
                    <Text style={[styles.val, status?.sources.user_reports === 'OK' ? styles.ok : styles.warn]}>
                        {status?.sources.user_reports || t('common.loading')}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>{t('sources.aggregators')}:</Text>
                    <Text style={[styles.val, status?.sources.news_aggregators === 'OK' ? styles.ok : styles.warn]}>
                        {status?.sources.news_aggregators || 'PARCIAL'}
                    </Text>
                </View>

                {status?.lastUpdatedAt && (
                    <Text style={styles.smallNote}>
                        Última sinincronización: {new Date(status.lastUpdatedAt).toLocaleString()}
                    </Text>
                )}
            </View>

            <Text style={styles.paragraph}>
                Esta versión V2 del MVP utiliza un servidor Node.js (Mock) centralizado. Las fuentes alimentan un panel que modera eventos.
            </Text>

            <Text style={styles.subtitle}>Detalhes de Integração & Latência</Text>

            <View style={styles.table}>
                <View style={styles.tableRow}><Text style={styles.tableHead}>Provedor</Text><Text style={styles.tableHead}>Atualização Média</Text></View>
                <View style={styles.tableRow}><Text style={styles.tableCell}>Órgãos Oficiais (Gov)</Text><Text style={styles.tableCell}>Cada 4 horas</Text></View>
                <View style={styles.tableRow}><Text style={styles.tableCell}>Redes de Notícias API</Text><Text style={styles.tableCell}>A cada 15 min</Text></View>
                <View style={styles.tableRow}><Text style={styles.tableCell}>Relatos Cidadãos</Text><Text style={styles.tableCell}>Ao vivo (Atrito Moderado)</Text></View>
            </View>

            <Text style={styles.paragraph}>
                A agregação gera "Níveis de Confiança" cruzando os relatos. Se o evento é atestado por um portal de notícias X Gov, ele salta de ALTO para VERIFICADO, acionando notificações Push.
            </Text>

            <Text style={[styles.paragraph, styles.warning]}>
                Aviso Legal & Isenção Tática: Este aplicativo exibe padrões históricos e alertas aproximados (Grids de +500 metros a 5km). Para preservar vidas, **NUNCA** exibimos localizações de forças táticas ou dados que possibilitem rastreio ativo de pessoas.
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#333' },
    statusBox: { backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 },
    statusTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { fontSize: 16, color: '#444' },
    val: { fontSize: 16, fontWeight: 'bold' },
    ok: { color: 'green' },
    warn: { color: 'orange' },
    smallNote: { fontSize: 12, color: '#888', marginTop: 12 },
    subtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 8, marginBottom: 12, color: '#444' },
    paragraph: { fontSize: 16, color: '#444', lineHeight: 24, marginBottom: 12 },
    warning: { color: '#cc0000', fontWeight: '500', marginTop: 16, padding: 16, backgroundColor: '#ffe6e6', borderRadius: 8 },
    table: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, overflow: 'hidden', marginBottom: 16 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', padding: 8 },
    tableHead: { flex: 1, fontWeight: 'bold', fontSize: 12, color: '#333' },
    tableCell: { flex: 1, fontSize: 13, color: '#555' }
});
