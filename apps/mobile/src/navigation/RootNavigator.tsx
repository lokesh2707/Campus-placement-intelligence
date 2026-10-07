import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { RootRouteName } from './types';
import { FoundationScreen } from '../components/FoundationScreen';

export function RootNavigator() {
  const [currentRoute] = useState<RootRouteName>('FoundationHome');

  return (
    <View style={styles.container}>
      {currentRoute === 'FoundationHome' && <FoundationScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
});
