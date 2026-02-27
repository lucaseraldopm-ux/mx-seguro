import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { DataProvider } from '../../services/data';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'NewReport'>;
};

export function NewReportScreen({ navigation }: Props) {
    const { t } = useTranslation();
    const [category, setCategory] = useState('Protesto');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!description.trim()) {
            Alert.alert(t('common.error'), 'A descrição é obrigatória');
            return;
        }

        try {
            setLoading(true);
            // Simulate current location for MVP report
            const coordinate = { latitude: 25.5, longitude: -100.3 };

            await DataProvider.submitReport({
                category,
                description,
                coordinate,
            });

            Alert.alert('Sucesso', t('reports.success_msg') || 'Reporte enviado para moderación.');
            navigation.goBack();
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message || 'Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('reports.title_new')}</Text>

            <Text style={styles.label}>Categoria:</Text>
            <View style={styles.pickerRow}>
                {['Bloqueio', 'Confronto', 'Protesto', 'Assalto'].map(cat => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.catBtn, category === cat && styles.catBtnActive]}
                        onPress={() => setCategory(cat)}
                    >
                        <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Descrição Rápida (Anônima):</Text>
            <TextInput
                style={styles.input}
                placeholder={t('reports.placeholder_desc')}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
            />

            <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerText}>
                    * Sua localização exata NÃO será publicada. Um grid aproximado será calculado para proteção.
                    O reporte passará por validação ('{t('reports.status_review')}') antes de aparecer a outros.
                </Text>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t('reports.btn_submit')}</Text>}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#333' },
    label: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 8 },
    pickerRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
    catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, marginRight: 8, marginBottom: 8 },
    catBtnActive: { backgroundColor: '#e6f2ff', borderColor: '#0066cc' },
    catText: { color: '#666' },
    catTextActive: { color: '#0066cc', fontWeight: 'bold' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, textAlignVertical: 'top', marginBottom: 24 },
    disclaimerBox: { backgroundColor: '#fff3cd', padding: 12, borderRadius: 8, marginBottom: 24 },
    disclaimerText: { color: '#856404', fontSize: 12, lineHeight: 18 },
    submitBtn: { backgroundColor: '#0066cc', padding: 16, borderRadius: 8, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
