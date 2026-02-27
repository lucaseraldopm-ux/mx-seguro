import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, ActivityIndicator } from 'react-native';
import { ENV } from '../../config/env';

export function DiagnosticScreen() {
    const [pingResult, setPingResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const checkApi = async () => {
        setLoading(true);
        setPingResult(null);
        try {
            const start = Date.now();
            const res = await fetch(`${ENV.API_URL}/status`, { timeout: 5000 } as RequestInit);
            const data = await res.json();
            const latency = Date.now() - start;
            setPingResult(`SUCESSO!\nLatência: ${latency}ms\nStatus do Servidor: HTTP ${res.status}\nPayload: ${JSON.stringify(data, null, 2)}`);
        } catch (e: any) {
            setPingResult(`FALHA DE REDE:\n${e.message}\nVerifique o IP e tente novamente.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Diagnóstico e Debug</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Configuração Atualizada (ENV):</Text>
                <Text style={styles.value}>{ENV.API_URL}</Text>
                <Text style={styles.hint}>* Altere o arquivo .env global na raiz ou src/config/env.ts para alternar entre localhost, tunel (ngrok/localtunnel) e produção.</Text>
            </View>

            <View style={styles.actionArea}>
                <Button title="Testar Ping (/status)" onPress={checkApi} disabled={loading} color="#0066cc" />
            </View>

            <View style={styles.resultBox}>
                {loading ? (
                    <ActivityIndicator size="large" color="#0066cc" />
                ) : (
                    <Text style={styles.resultText}>{pingResult || 'Nenhum teste rodado ainda.'}</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 24, backgroundColor: '#f2f2f2' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, elevation: 1, marginBottom: 24 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#666' },
    value: { fontSize: 16, color: '#0066cc', marginTop: 4, fontFamily: 'monospace' },
    hint: { fontSize: 12, color: '#aaa', marginTop: 8 },
    actionArea: { marginBottom: 24 },
    resultBox: { backgroundColor: '#333', padding: 16, borderRadius: 8, minHeight: 150 },
    resultText: { color: '#0f0', fontFamily: 'monospace', fontSize: 13 }
});
