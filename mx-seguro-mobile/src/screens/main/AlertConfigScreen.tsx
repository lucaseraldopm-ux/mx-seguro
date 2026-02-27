import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { AuthService } from '../../services/auth.mock';

export function AlertConfigScreen() {
    const { user } = useAuthStore();
    const [enabled, setEnabled] = useState(user?.preferences?.alertsEnabled ?? false);
    const [radius, setRadius] = useState(user?.preferences?.alertRadius ?? 10);
    const [categories, setCategories] = useState<string[]>(user?.preferences?.categories ?? []);

    const toggleCategory = (cat: string) => {
        setCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const savePreferences = async () => {
        try {
            await AuthService.updatePreferences({
                alertsEnabled: enabled,
                alertRadius: radius,
                categories: categories,
            });
            Alert.alert('Sucesso', 'Suas preferências de alerta foram salvas localmente (mock).');
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível salvar.');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Configuração de Alertas</Text>

            <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Ativar Alertas Push (Mock)</Text>
                <Switch value={enabled} onValueChange={setEnabled} />
            </View>

            <Text style={styles.sectionTitle}>Raio de Cobertura: {radius} km</Text>
            <View style={styles.radiusContainer}>
                {[5, 10, 20].map((r) => (
                    <TouchableOpacity
                        key={r}
                        style={[styles.radiusButton, radius === r && styles.radiusButtonActive]}
                        onPress={() => setRadius(r)}
                    >
                        <Text style={[styles.radiusText, radius === r && styles.radiusTextActive]}>{r} km</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.sectionTitle}>Categorias de Interesse</Text>
            {['Conflito', 'Bloqueio', 'Protesto'].map(cat => (
                <TouchableOpacity key={cat} style={styles.checkboxRow} onPress={() => toggleCategory(cat)}>
                    <View style={[styles.checkbox, categories.includes(cat) && styles.checkboxActive]} />
                    <Text style={styles.checkboxLabel}>{cat}</Text>
                </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.saveButton} onPress={savePreferences}>
                <Text style={styles.saveButtonText}>Salvar Preferências</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24, backgroundColor: '#f5f5f5' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#333' },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 24 },
    settingLabel: { fontSize: 16, color: '#333' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 12, color: '#333' },
    radiusContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    radiusButton: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 8, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: '#ccc' },
    radiusButtonActive: { backgroundColor: '#e6f2ff', borderColor: '#0066cc' },
    radiusText: { fontSize: 16, color: '#666' },
    radiusTextActive: { color: '#0066cc', fontWeight: 'bold' },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 8 },
    checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: '#ccc', borderRadius: 4, marginRight: 12 },
    checkboxActive: { backgroundColor: '#0066cc', borderColor: '#0066cc' },
    checkboxLabel: { fontSize: 16, color: '#333' },
    saveButton: { backgroundColor: '#0066cc', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 32 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
