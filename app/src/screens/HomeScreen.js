import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Theme from '../theme/Theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to COG Mobile</Text>
      <Text style={styles.subtitle}>Initializing Week 1 Foundation...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.Colors.background,
  },
  title: {
    fontSize: Theme.Typography.sizes.h1,
    color: Theme.Colors.primary,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: Theme.Typography.sizes.body,
    color: Theme.Colors.textSecondary,
    marginTop: Theme.Spacing.sm,
  },
});
