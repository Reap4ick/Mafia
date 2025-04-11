// app/mafia.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';

export default function MafiaScreen() {
  const handleNewGame = () => {
    Alert.alert('Нова гра розпочата!');
    // Тут можна додати навігацію або логіку
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>МАФІЯ</Text>
      <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={handleNewGame}>
        <Text style={styles.buttonText}>Нова гра</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 60,
  },
  button: {
    backgroundColor: '#ff0000',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#0a0a0a',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
