import React, { useState, useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import GifSplashScreen from './src/screens/GifSplashScreen';

function App(): React.JSX.Element {
  const [showSplash, setShowSplash] = useState(true);

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
            <GifSplashScreen onAnimationFinish={handleSplashFinish} />
          ) : (
            <AppNavigator />
          )}
    </SafeAreaProvider>
  );
}

export default App;
