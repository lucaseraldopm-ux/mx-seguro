import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { AuthService } from '../../services/auth.mock';
import { DataProvider } from '../../services/data';

export function ProfileScreen() {
    const { user } = useAuthStore();
    const { t, i18n } = useTranslation();
    const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const isFocused = useIsFocused();
    const [myReports, setMyReports] = useState<any[]>([]);

    useEffect(() => {
        if (isFocused) {
            DataProvider.getMyReports().then(setMyReports);
        }
    }, [isFocused]);

    const handleUpgrade = () => {
        // TODO: Integrar RevenueCat / Stripe
        alert('Integração com pagamento a ser implementada na fase de produção.');
    };

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <TouchableOpacity onLongPress={() => nav.navigate('Diagnostic')}>
                <Text style={styles.title}>Perfil e Assinatura</Text>
            </TouchableOpacity>

            <View style={styles.card}>
                <Text style={styles.label}>Nome:</Text>
                <Text style={styles.value}>{user?.name}</Text>

                <Text style={styles.label}>E-mail:</Text>
                <Text style={styles.value}>{user?.email}</Text>

                <Text style={styles.label}>Plano Atual:</Text>
                <Text style={[styles.planBadge, user?.plan === 'PRO' ? styles.proBadge : styles.freeBadge]}>
                    {user?.plan}
                </Text>
            </View>

            {/* i18n Switcher */}
            <View style={styles.langContainer}>
                <Text style={styles.label}>{t('settings.change_language')}:</Text>
                <View style={styles.langRow}>
                    <TouchableOpacity style={[styles.langBtn, i18n.language === 'es' && styles.langBtnActive]} onPress={() => changeLanguage('es')}>
                        <Text style={[styles.langText, i18n.language === 'es' && styles.langTextActive]}>ES</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.langBtn, i18n.language === 'pt' && styles.langBtnActive]} onPress={() => changeLanguage('pt')}>
                        <Text style={[styles.langText, i18n.language === 'pt' && styles.langTextActive]}>PT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.langBtn, i18n.language === 'en' && styles.langBtnActive]} onPress={() => changeLanguage('en')}>
                        <Text style={[styles.langText, i18n.language === 'en' && styles.langTextActive]}>EN</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Fazer Upgrade para o MX Seguro PRO</Text>
            <View style={styles.planCard}>
                <Text style={styles.planTitle}>Plano PRO</Text>
                <Text style={styles.planDesc}>- Alertas em tempo real</Text>
                <Text style={styles.planDesc}>- Visualização estendida de fontes</Text>
                <Text style={styles.planDesc}>- Sem restrição de cidades</Text>

                <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                    <Text style={styles.upgradeText}>Assinar agora (Mock)</Text>
                </TouchableOpacity>
            </View>

            {myReports.length > 0 && (
                <View style={styles.myReportsContainer}>
                    <Text style={styles.sectionTitle}>Meus Reportes Salvos</Text>
                    {myReports.map((r, i) => (
                        <View key={i} style={styles.reportItem}>
                            <View style={styles.reportHeader}>
                                <Text style={styles.reportCategory}>{r.category}</Text>
                                <Text style={styles.reportStatus}>{r.status}</Text>
                            </View>
                            <Text style={styles.reportDesc} numberOfLines={2}>{r.description}</Text>
                            <Text style={styles.reportDate}>{new Date(r.date).toLocaleString()}</Text>
                        </View>
                    ))}
                </View>
            )}

            <TouchableOpacity style={styles.logoutButton} onPress={() => AuthService.logout()}>
                <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: '#f5f5f5' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#333' },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 8, elevation: 2, marginBottom: 16 },
    langContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 8, elevation: 2, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    langRow: { flexDirection: 'row' },
    langBtn: { padding: 8, marginHorizontal: 4, borderWidth: 1, borderColor: '#ccc', borderRadius: 4 },
    langBtnActive: { backgroundColor: '#e6f2ff', borderColor: '#0066cc' },
    langText: { color: '#666', fontWeight: 'bold' },
    langTextActive: { color: '#0066cc' },
    label: { fontSize: 14, color: '#666', marginTop: 8 },
    value: { fontSize: 18, color: '#333', fontWeight: '500', marginBottom: 8 },
    planBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontWeight: 'bold', marginTop: 4, overflow: 'hidden' },
    freeBadge: { backgroundColor: '#e0e0e0', color: '#333' },
    proBadge: { backgroundColor: '#ffd700', color: '#000' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
    planCard: { backgroundColor: '#fff', padding: 20, borderRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#ffd700', marginBottom: 32 },
    planTitle: { fontSize: 20, fontWeight: 'bold', color: '#b8860b', marginBottom: 12 },
    planDesc: { fontSize: 14, color: '#555', marginBottom: 8 },
    upgradeButton: { backgroundColor: '#b8860b', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
    upgradeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    myReportsContainer: { marginBottom: 32 },
    reportItem: { backgroundColor: '#fff', padding: 16, borderRadius: 8, elevation: 1, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#0066cc' },
    reportHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    reportCategory: { fontWeight: 'bold', fontSize: 14, color: '#333' },
    reportStatus: { fontSize: 12, fontWeight: 'bold', color: '#ff8c00' },
    reportDesc: { fontSize: 14, color: '#666', marginBottom: 8 },
    reportDate: { fontSize: 10, color: '#999' },

    logoutButton: { backgroundColor: '#cc0000', padding: 16, borderRadius: 8, alignItems: 'center', alignSelf: 'center', width: '100%', marginBottom: 30 },
    logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
