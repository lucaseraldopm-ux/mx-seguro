import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
    Onboarding: undefined;
    Login: undefined;
    Register: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Alerts: undefined;
    Profile: undefined;
};

export type RootStackParamList = {
    Auth: NavigatorScreenParams<AuthStackParamList>;
    Main: NavigatorScreenParams<MainTabParamList>;
    Detail: { id: string; type: 'zone' | 'event' };
    NewReport: undefined;
    Diagnostic: undefined;
    ComoCalculamos: undefined;
};

// Extensão global do React Navigation para uso fácil com hooks useNavigation
declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList { }
    }
}
