import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FontTest: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.defaultFont}>Default System Font</Text>
      <Text style={styles.customFont}>Custom DM Sans Font</Text>
      <Text style={styles.boldFont}>DM Sans Bold Font</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  defaultFont: {
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
  },
  customFont: {
    fontSize: 18,
    fontFamily: 'DMSans-Regular',
    marginBottom: 10,
    color: '#333',
  },
  boldFont: {
    fontSize: 18,
    fontFamily: 'DMSans-Bold',
    color: '#333',
  },
});

export default FontTest;
