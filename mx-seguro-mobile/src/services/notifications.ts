export const NotificationsService = {
    // TODO: Add Expo Notifications plugin or Firebase FCM

    async requestPermissions() {
        // Stub: Check permission and ask if necessary
        console.log('[Push] Requesting push permissions...');
        return true;
    },

    async registerForPushNotificationsAsync() {
        // Stub: generate exp:// or FCM token
        console.log('[Push] Registering device...');
        return 'ExponentPushToken[mock-token-1234]';
    },

    scheduleLocalNotification(title: string, body: string, data?: any) {
        // Stub: Emulate banner via toast or actual local push
        console.log(`[Push Local] Banner ativado: ${title} - ${body}`);
    },

    startBackgroundLocationPolling() {
        // Stub: Use expo-location background task to poll incidents based on bounded box 
        console.log(`[Push Background] Servidor fará sweep checking na zona salva.`);
    }
};
