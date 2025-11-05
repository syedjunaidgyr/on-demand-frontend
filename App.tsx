import React, { useState, useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import messaging from '@react-native-firebase/messaging';
import AppNavigator from './src/navigation/AppNavigator';
import GifSplashScreen from './src/screens/GifSplashScreen';
import NotificationBanner from './src/components/NotificationBanner';

function App(): React.JSX.Element {
  const [showSplash, setShowSplash] = useState(true);
  const [notification, setNotification] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  useEffect(() => {
    // Request notification permissions (iOS + Android 13+)
    const requestUserPermission = async () => {
      try {
        if (Platform.OS === 'ios' || (Platform.OS === 'android' && Platform.Version >= 33)) {
          const authStatus = await messaging().requestPermission();
          const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          if (enabled) {
            console.log('✅ FCM permission granted:', authStatus);
          } else {
            console.log('❌ FCM permission denied');
          }
        }
      } catch (error) {
        console.log('⚠️ FCM permission request failed:', error);
      }
    };

    const ensureRegistration = async () => {
      try {
        if (!messaging().isDeviceRegisteredForRemoteMessages) {
          await messaging().registerDeviceForRemoteMessages();
        }
        await messaging().setAutoInitEnabled(true);
      } catch (error) {
        console.log('⚠️ FCM registration failed:', error);
      }
    };

    const getTokenWithRetry = async (retries: number = 3, delayMs: number = 1500): Promise<void> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const token = await messaging().getToken();
          if (token) {
            console.log('📱 FCM Token:', token);
            return;
          }
          throw new Error('Empty token');
        } catch (error) {
          console.log(`⚠️ FCM getToken failed (attempt ${attempt}/${retries}):`, error);
          if (attempt < retries) {
            await new Promise<void>(resolve => setTimeout(() => resolve(), delayMs));
          }
        }
      }
      console.log('❌ Unable to retrieve FCM token after retries.');
    };

    (async () => {
      await requestUserPermission();
      await ensureRegistration();
      await getTokenWithRetry();
    })();

    // Listen for token refresh
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
      console.log('🔁 FCM Token refreshed:', token);
    });

    // Foreground message listener
    const unsubscribeMessage = messaging().onMessage(async remoteMessage => {
      console.log('📩 Foreground message:', remoteMessage);
      const title = remoteMessage.notification?.title ?? 'New Notification';
      const message = remoteMessage.notification?.body ?? 
        (remoteMessage.data ? JSON.stringify(remoteMessage.data) : 'You have a new message');
      
      setNotification({
        visible: true,
        title,
        message,
      });
    });

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeMessage();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
        hidden={false}
      />
        {showSplash ? (
          <GifSplashScreen onAnimationFinish={handleSplashFinish} />
        ) : (
          <AppNavigator />
        )}
        <NotificationBanner
          visible={notification.visible}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
          duration={5000}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
