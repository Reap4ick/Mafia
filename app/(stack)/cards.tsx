import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const roleConfig: Record<string, { title: string; color: string; borderColor: string }> = {
  mafia: { title: 'Мафія', color: '#ff2222', borderColor: '#400000' },
  citizen: { title: 'Мирний житель', color: '#ffffff', borderColor: '#333' },
  detective: { title: 'Детектив', color: '#ffffff', borderColor: '#333' },
  doctor: { title: 'Лікар', color: '#ffffff', borderColor: '#333' },
};

interface Player {
  id: string;
  name: string;
  role: string;
}

interface FlipCardProps {
  player: Player;
  zIndex: number;
  isActive: boolean;
  onDismiss: (id: string) => void;
}

const FlipCard: React.FC<FlipCardProps> = ({ player, zIndex: propZIndex, isActive, onDismiss }) => {
  const flipRotation = useSharedValue(180);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isFlipped = useSharedValue(false);
  const zIndex = useSharedValue(propZIndex);

  useEffect(() => {
    zIndex.value = propZIndex;
  }, [propZIndex]);

  const flipCard = () => {
    if (!isFlipped.value && isActive) {
      flipRotation.value = withTiming(0, { duration: 600 });
      isFlipped.value = true;
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (!isActive) return;
      scale.value = withSpring(1.1);
    })
    .onUpdate((e) => {
      if (!isActive) return;
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (!isActive) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
        return;
      }

      const throwDistance = 100;
      if (
        isFlipped.value &&
        (Math.abs(e.translationX) > throwDistance || Math.abs(e.translationY) > throwDistance)
      ) {
        const flyX = e.translationX > 0 ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
        const flyY = e.translationY > 0 ? SCREEN_HEIGHT * 1.5 : -SCREEN_HEIGHT * 1.5;

        translateX.value = withTiming(flyX, { duration: 400 });
        translateY.value = withTiming(flyY, { duration: 400 }, (finished) => {
          if (finished) runOnJS(onDismiss)(player.id);
        });
        scale.value = withTiming(0.5, { duration: 400 });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (isActive) runOnJS(flipCard)();
  });

  const composedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateY: `${flipRotation.value}deg` },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  const frontStyle = useAnimatedStyle(() => ({
    opacity: flipRotation.value < 90 ? 1 : 0,
  }));

  const backStyle = useAnimatedStyle(() => ({
    opacity: flipRotation.value >= 90 ? 1 : 0,
  }));

  const roleDisplay = roleConfig[player.role] || { title: 'Невідома роль', color: '#ffffff', borderColor: '#333' };

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.cardContainer, animatedStyle]}>
        <Animated.View style={[styles.card, frontStyle]}>
          <View style={[styles.cardContent, { borderColor: roleDisplay.borderColor }]}>
            <Text style={[styles.title, { color: roleDisplay.color }]}>{roleDisplay.title}</Text>
          </View>
        </Animated.View>
        <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
          <View style={[styles.cardContent, styles.backPattern]}>
            {[...Array(12)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.patternLine,
                  {
                    transform: [{ rotate: i % 2 === 0 ? '45deg' : '-45deg' }],
                    opacity: 0.1 + i * 0.03,
                    height: i % 3 === 0 ? 3 : 2,
                  },
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

export default function CardsScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeCardIds, setActiveCardIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setIsLoading(true);
        const storedPlayers = await AsyncStorage.getItem('players');
        if (storedPlayers) {
          const parsedPlayers = JSON.parse(storedPlayers);
          const validPlayers = parsedPlayers.filter(
            (p: any) => p.id && p.name && roleConfig[p.role]
          );
          setPlayers(validPlayers);
          setActiveCardIds(validPlayers.map((p: Player) => p.id).reverse());
        }
      } catch (error) {
        console.error('Помилка завантаження гравців:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPlayers();
  }, []);

  const handleDismiss = (id: string) => {
    console.log('Dismissed card:', id); // Дебаг
    setActiveCardIds((prev) => prev.filter((item) => item !== id));
  };

  useEffect(() => {
    if (activeCardIds.length === 0 && players.length > 0) {
      console.log('All cards dismissed, navigating to /game'); // Дебаг
      router.push('/game');
    }
  }, [activeCardIds, players, router]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#A30000" />
      </View>
    );
  }

  const activePlayer = players.find((p) => p.id === activeCardIds[0]);

  return (
    <GestureHandlerRootView style={styles.container}>
      {activePlayer && (
        <View style={styles.playerNameContainer}>
          <Text style={styles.playerName}>
            {activePlayer.name} - Переверни свою картку!
          </Text>
        </View>
      )}

      {players.length === 0 ? (
        <Text style={styles.noPlayersText}>Немає гравців</Text>
      ) : (
        players
          .map((player) => {
            const isActive = activeCardIds[0] === player.id;
            const activeIndex = activeCardIds.indexOf(player.id);
            const zIndex = activeIndex !== -1 ? 100 - activeIndex : 0;

            return (
              <FlipCard
                key={player.id}
                player={player}
                zIndex={zIndex}
                isActive={isActive}
                onDismiss={handleDismiss}
              />
            );
          })
          .reverse()
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: 200,
    height: 300,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
  },
  backPattern: {
    borderColor: '#1a1a1a',
    overflow: 'hidden',
  },
  cardBack: {
    backgroundColor: '#222',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  patternLine: {
    width: '150%',
    backgroundColor: '#6a0000',
    marginVertical: 8,
  },
  playerNameContainer: {
    position: 'absolute',
    top: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    zIndex: 500, // Зменшено з 1000
  },
  playerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noPlayersText: {
    color: '#E0E0E0',
    fontSize: 18,
    fontFamily: 'SpaceMono',
  },
});