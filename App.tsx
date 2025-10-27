import React, { useState, useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import GifSplashScreen from './src/screens/GifSplashScreen';

function App(): React.JSX.Element {
  const [showSplash, setShowSplash] = useState(true);
  const [useGifSplash, setUseGifSplash] = useState(true); // Toggle between old and new splash

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true}
        hidden={false}
      />
      {showSplash ? (
        useGifSplash ? (
          <GifSplashScreen onAnimationFinish={handleSplashFinish} />
        ) : (
          <SplashScreen onAnimationFinish={handleSplashFinish} />
        )
      ) : (
        <AppNavigator />
      )}
    </SafeAreaProvider>
  );
}

export default App;
