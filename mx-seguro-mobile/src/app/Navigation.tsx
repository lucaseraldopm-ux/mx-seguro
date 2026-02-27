import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '../store/useAuthStore';
import { AuthService } from '../services/auth.mock';
import { RootStackParamList, AuthStackParamList, MainTabParamList } from '../types/navigation';

// Mock Screens to prevent errors
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { HomeScreen } from '../screens/main/HomeScreen';
import { AlertConfigScreen } from '../screens/main/AlertConfigScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { DetailScreen } from '../screens/shared/DetailScreen';
import { ComoCalculamosScreen } from '../screens/shared/ComoCalculamosScreen';
import { NewReportScreen } from '../screens/shared/NewReportScreen';
import { DiagnosticScreen } from '../screens/shared/DiagnosticScreen';

// Ícones (usando MaterialIcons nativo do Expo, ou lucide. Aqui mock vazio por agora ou usar text)
// Vamos adicionar ícones depois no Bottom Tabs.

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
    );
}

function MainTabNavigator() {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Mapa' }} />
            <Tab.Screen name="Alerts" component={AlertConfigScreen} options={{ title: 'Alertas' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
        </Tab.Navigator>
    );
}

export function Navigation() {
    const { user, isLoading } = useAuthStore();

    useEffect(() => {
        AuthService.initAuth();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <RootStack.Screen name="Auth" component={AuthNavigator} />
                ) : (
                    <>
                        <RootStack.Screen name="Main" component={MainTabNavigator} />
                        <RootStack.Screen name="Detail" component={DetailScreen} options={{ headerShown: true, title: 'Detalhes' }} />
                        <RootStack.Screen name="NewReport" component={NewReportScreen} options={{ headerShown: true, title: 'Novo Reporte' }} />
                        <RootStack.Screen name="Diagnostic" component={DiagnosticScreen} options={{ headerShown: true, title: 'Diagnóstico de Rede' }} />
                        <RootStack.Screen name="ComoCalculamos" component={ComoCalculamosScreen} options={{ headerShown: true, title: 'Como Calculamos' }} />
                    </>
                )}
            </RootStack.Navigator>
        </NavigationContainer>
    );
}
