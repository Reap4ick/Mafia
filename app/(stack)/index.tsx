// app/mafia.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function MafiaScreen() {
  const router = useRouter();
  const handleNewGame = () => {
    
    router.push('/player'); // Перехід на інший екран
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
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 64, // Більший заголовок
    fontWeight: '900',
    color: '#D32F2F', // Темно-червоний, не яскравий
    marginBottom: 80,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  button: {
    backgroundColor: 'transparent', // Прозорий фон
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D32F2F', // Рамка темно-червоного кольору
  },
  buttonPressed: {
    backgroundColor: '#1e1e1e',
    opacity: 0.9,
  },
  buttonText: {
    color: '#D32F2F', // Такий самий як рамка
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
