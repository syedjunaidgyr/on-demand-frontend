import React, { useState, useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';

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
        <SplashScreen onAnimationFinish={handleSplashFinish} />
      ) : (
        <AppNavigator />
      )}
    </SafeAreaProvider>
  );
}

export default App;
