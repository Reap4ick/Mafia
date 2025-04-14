  import React, { useEffect, useState } from 'react';
  import { View, ActivityIndicator, StyleSheet } from 'react-native';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { router } from 'expo-router';

  interface Player {
    id: string;
    name: string;
    role: keyof typeof roleConfig;
  }

  const roleConfig = {
    mafia: { title: 'Мафія', color: '#ff2222', borderColor: '#400000' },
    citizen: { title: 'Мирний житель', color: '#ffffff', borderColor: '#333' },
    detective: { title: 'Детектив', color: '#ffffff', borderColor: '#333' },
    doctor: { title: 'Лікар', color: '#ffffff', borderColor: '#333' },
  };

  export default function LoadingScreen() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const loadPlayers = async () => {
        try {
          const storedPlayers = await AsyncStorage.getItem('players');
          let players: Player[] = [];
          if (storedPlayers) {
            const parsedPlayers = JSON.parse(storedPlayers);
            players = parsedPlayers.filter(
              (p: Player) => p.id && p.name && roleConfig[p.role]
            );
          }
          // Зберігаємо валідні дані назад у AsyncStorage
          await AsyncStorage.setItem('players', JSON.stringify(players));
          // Перенаправлення на CardsScreen
          router.replace({
            pathname: '/cards',
            params: { players: JSON.stringify(players) },
          });
        } catch (error) {
          console.error('Помилка завантаження гравців:', error);
          // У разі помилки все одно переходимо, але з порожніми даними
          router.replace('/cards');
        } finally {
          setIsLoading(false);
        }
      };
      loadPlayers();
    }, []);

    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#A30000" />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });