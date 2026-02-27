import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;
};

export function OnboardingScreen({ navigation }: Props) {
    const [accepted, setAccepted] = useState(false);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Bem-vindo ao MX Seguro</Text>

            <Text style={styles.description}>
                O MX Seguro foi criado para informar sobre zonas de risco e possíveis conflitos no México, focando na sua segurança.
            </Text>

            <View style={styles.warningContainer}>
                <Text style={styles.warningTitle}>ATENÇÃO - TERMO DE RESPONSABILIDADE</Text>
                <Text style={styles.warningText}>
                    Este aplicativo é EXCLUSIVAMENTE INFORMATIVO. Ele NÃO substitui as autoridades oficiais. As situações de risco mudam constantemente. Use estas informações com máxima cautela.
                </Text>
                <Text style={styles.warningText}>
                    Em caso de emergência, entre em contato imediatamente com as autoridades locais.
                </Text>
            </View>

            <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAccepted(!accepted)}
            >
                <View style={[styles.checkbox, accepted && styles.checkboxChecked]} />
                <Text style={styles.checkboxLabel}>
                    Eu li e compreendo que o aplicativo não substitui as autoridades oficiais.
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, !accepted && styles.buttonDisabled]}
                disabled={!accepted}
                onPress={() => navigation.navigate('Login')}
            >
                <Text style={styles.buttonText}>Continuar para Login</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#1a1a1a' },
    description: { fontSize: 16, color: '#4a4a4a', marginBottom: 32, lineHeight: 24 },
    warningContainer: { backgroundColor: '#ffe6e6', padding: 16, borderRadius: 8, marginBottom: 24, borderWidth: 1, borderColor: '#ffcccc' },
    warningTitle: { color: '#cc0000', fontWeight: 'bold', marginBottom: 8 },
    warningText: { color: '#4a0000', marginBottom: 8, lineHeight: 20 },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
    checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: '#ccc', borderRadius: 4, marginRight: 12 },
    checkboxChecked: { backgroundColor: '#0066cc', borderColor: '#0066cc' },
    checkboxLabel: { flex: 1, fontSize: 14, color: '#333' },
    button: { backgroundColor: '#0066cc', padding: 16, borderRadius: 8, alignItems: 'center' },
    buttonDisabled: { backgroundColor: '#cccccc' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
