import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const roles = [
  {
    id: 'mafia-1',
    key: 'mafia',
    title: 'Мафія',
    color: '#ff2222',
    description: 'Мафія прокидається кожної ночі для усунення мирних жителів.',
    borderColor: '#400000',
  },
  {
    id: 'citizen-1',
    key: 'citizen',
    title: 'Мирний житель',
    color: '#ffffff',
    description: 'Ваше завдання - викрити мафію під час денних обговорень.',
    borderColor: '#333',
  },
  {
    id: 'citizen-2',
    key: 'citizen',
    title: 'Мирний житель',
    color: '#ffffff',
    description: 'Ваше завдання - викрити мафію під час денних обговорень.',
    borderColor: '#333',
  },
];

const FlipCard = ({ role, index, bringToBack }: any) => {
  const flipRotation = useSharedValue(180);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isFlipped = useSharedValue(false);
  const zIndex = useSharedValue(100 - index);

  const flipCard = () => {
    if (!isFlipped.value) {
      flipRotation.value = withTiming(0, { duration: 600 });
      isFlipped.value = true;
    }
  };

  const resetFlip = () => {
    flipRotation.value = withTiming(180, { duration: 400 }, () => {
      isFlipped.value = false;
    });
  };

  const scheduleReturn = () => {
    setTimeout(() => {
      // 1. Змінюємо zIndex — вона буде внизу під час повернення
      zIndex.value = 0;

      // 2. Повертаємо її назад (тобто показуємо спину)
      resetFlip();

      // 3. Повернення в центр
      setTimeout(() => {
        translateX.value = withTiming(0, { duration: 400 });
        translateY.value = withTiming(0, { duration: 400 });
        scale.value = withTiming(1, { duration: 300 });

        // 4. Нарешті змінюємо позицію в масиві
        runOnJS(bringToBack)();
      }, 400);
    }, 5000);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const throwDistance = 100;

      if (
        isFlipped.value &&
        (Math.abs(e.translationX) > throwDistance || Math.abs(e.translationY) > throwDistance)
      ) {
        const flyX = e.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH;
        const flyY = e.translationY > 0 ? SCREEN_HEIGHT : -SCREEN_HEIGHT;

        translateX.value = withTiming(flyX, { duration: 400 });
        translateY.value = withTiming(flyY, { duration: 400 });
        scale.value = withTiming(0.7);

        runOnJS(scheduleReturn)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(flipCard)();
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

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.cardContainer, animatedStyle]}>
        <Animated.View style={[styles.card, frontStyle]}>
          <CardFront role={role} />
        </Animated.View>
        <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
          <CardBack />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const CardFront = ({ role }: any) => (
  <View style={[styles.cardContent, { borderColor: role.borderColor }]}>
    <Text style={[styles.title, { color: role.color }]}> {role.title} </Text>
  </View>
);

const CardBack = () => (
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
);

export default function App() {
  const [cards, setCards] = useState(roles);

  const bringToBack = () => {
    const [first, ...rest] = cards;
    setCards([...rest, first]);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {cards
        .map((role, index) => (
          <FlipCard key={role.id} role={role} index={index} bringToBack={bringToBack} />
        ))
        .reverse()}
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
    perspective: '1000',
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
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  patternLine: {
    width: '150%',
    backgroundColor: '#6a0000',
    marginVertical: 8,
  },
});
