import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState, useCallback } from 'react';
import 'react-native-reanimated';
import { Audio } from 'expo-av';
import { View, TouchableOpacity, Modal, Text, StyleSheet, Pressable, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/components/useColorScheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(stack)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const soundRef = useRef<Audio.Sound | null>(null);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isMusicModalVisible, setMusicModalVisible] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string>('track1');
  const [volume, setVolume] = useState<number>(0.5);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const tracks = [
    { id: 'track1', title: 'The Godfather', source: require('../assets/audio/1.mp3') },
    { id: 'track2', title: 'Italian Restaurant for One', source: require('../assets/audio/2.mp3') },
    { id: 'track3', title: 'Tu vuò fa l\'americano', source: require('../assets/audio/3.mp3') },
  ];

  const playBackgroundMusic = async (trackId: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }
      const track = tracks.find((t) => t.id === trackId);
      if (track) {
        const { sound } = await Audio.Sound.createAsync(track.source);
        soundRef.current = sound;
        await sound.setIsLoopingAsync(true);
        await sound.setVolumeAsync(volume);
        if (isPlaying) {
          await sound.playAsync();
        }
      }
    } catch (error) {
      console.error('Помилка відтворення музики:', error);
    }
  };

  const stopBackgroundMusic = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const togglePlayPause = async () => {
    if (soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = useCallback((newValue: number) => {
    setVolume(newValue);
    const currentSound = soundRef.current;
    if (currentSound) {
      currentSound.setVolumeAsync(newValue);
    }
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      playBackgroundMusic(currentTrack);
    }
    return () => {
      stopBackgroundMusic();
    };
  }, [loaded]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  if (!loaded) {
    return null;
  }

  const volumeLevels = Array.from({ length: 10 }, (_, i) => Math.round((i / 9) * 1000) / 1000);

  return (
    <View style={styles.container}>
      <RootLayoutNav />
      <TouchableOpacity
        style={styles.settingsIcon}
        onPress={() => {
          console.log('Settings icon pressed, opening modal');
          setSettingsModalVisible(true);
        }}
      >
        <Ionicons name="settings" size={20} color="#E0E0E0" />
      </TouchableOpacity>

      <Modal
        visible={isSettingsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          console.log('Closing settings modal');
          setSettingsModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Налаштування</Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => {
                console.log('Opening music modal');
                setSettingsModalVisible(false);
                setMusicModalVisible(true);
              }}
            >
              <Text style={styles.modalButtonText}>Налаштування музики</Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => {
                console.log('Closing settings modal');
                setSettingsModalVisible(false);
              }}
            >
              <Text style={styles.modalButtonText}>Закрити</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isMusicModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          console.log('Closing music modal');
          setMusicModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Керування звуком</Text>
            <Text style={styles.modalSubtitle}>Обрати мелодію</Text>
            <FlatList
              data={tracks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.trackItem,
                    currentTrack === item.id && styles.selectedTrack,
                  ]}
                  onPress={() => {
                    console.log(`Selected track: ${item.id}`);
                    setCurrentTrack(item.id);
                    playBackgroundMusic(item.id);
                  }}
                >
                  <Text style={styles.modalButtonText}>{item.title}</Text>
                </Pressable>
              )}
            />
            <Text style={styles.modalSubtitle}>Гучність</Text>
            <View style={styles.volumeContainer}>
              {volumeLevels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.volumeBar,
                    level <= volume + 0.05 ? styles.volumeBarActive : styles.volumeBarInactive,
                  ]}
                  onPress={() => {
                    console.log(`Volume changed to: ${level}`);
                    handleVolumeChange(level);
                  }}
                />
              ))}
            </View>
            <Pressable
              style={styles.modalButton}
              onPress={() => {
                console.log('Toggling play/pause');
                togglePlayPause();
              }}
            >
              <Text style={styles.modalButtonText}>
                {isPlaying ? 'Вимкнути звук' : 'Увімкнути звук'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => {
                console.log('Closing music modal');
                setMusicModalVisible(false);
              }}
            >
              <Text style={styles.modalButtonText}>Закрити</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(stack)" options={{ headerShown: false }} />
        {/* <Stack.Screen name="cards" options={{ headerShown: false }} /> */}
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  settingsIcon: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(47, 47, 47, 0.5)',
    borderRadius: 15,
    padding: 6,
    zIndex: 3000, // Вищий zIndex для іконки
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Затемнення екрана
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000, // Високий zIndex для модального вікна
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 20,
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A30000', // Червона рамка для дебагінгу
    zIndex: 2100, // Вищий zIndex для вмісту
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF', // Білий текст
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#2F2F2F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A30000',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#4B1C1C',
  },
  trackItem: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#2F2F2F',
  },
  selectedTrack: {
    backgroundColor: '#4B1C1C',
    borderColor: '#A30000',
    borderWidth: 1,
  },
  trackText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  volumeContainer: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  volumeBar: {
    width: 22,
    height: 40,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  volumeBarActive: {
    backgroundColor: '#A30000',
  },
  volumeBarInactive: {
    backgroundColor: '#555555',
  },
});