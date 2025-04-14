import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Svg, Path, Ellipse } from 'react-native-svg';

// Іконки
const MafiaIcon = () => (
  <Svg viewBox="0 0 512 512" style={styles.icon}>
    <Path 
      fill="#fff"
      d="M356.391 32.349C351.281 4.567 314.688-10.964 287.5 9.067c-14.25 10.5-27 11.25-33.766 11.25-6.75 0-14.25 1.5-33.766-11.25-28.25-18.484-63.766-4.5-68.875 23.281-4.156 22.594-27.016 157.594-27.016 157.594h259.328C383.406 189.942 360.547 54.942 356.391 32.349z"
    />
    <Path
      fill="#fff"
      d="M256 235.677H19.641c0 0 41.266 84.047 236.359 84.047s236.359-84.047 236.359-84.047H256z"
    />
    <Path
      fill="#fff"
      d="M368.531 436.114c-9.797-8.391-19.734-15.625-28.984-21.688v-5.719h-9.031h-27.578h-14.641h-23.922h-91.531v17.484h79.891c1.781 1.969 15.75 17.156 36.578 34.547 11.109 9.281 24.172 19.203 38.422 28.063s29.688 16.688 45.656 21.734l4.656 1.469 26.406-36.891-2.891-3.938C391.719 457.802 380.219 446.13 368.531 436.114zM288.453 442.255c-1.797-1.594-3.516-3.141-5.141-4.641-4.688-4.313-8.703-8.203-11.922-11.422h39.688L288.453 442.255zM296.297 449.052l32.203-22.859h4.453c1.906 1.25 3.828 2.547 5.781 3.906l-21.203 35.625C309.875 460.161 302.734 454.489 296.297 449.052zM334.828 477.38c-3.063-1.906-6.063-3.859-9.016-5.859l21.125-35.484c4.359 3.266 8.766 6.766 13.109 10.516 3.563 3.047 7.094 6.266 10.531 9.625L340.5 480.802C338.594 479.692 336.703 478.552 334.828 477.38zM363.219 491.739l2.219 1.594c-5.203-2.156-10.359-4.594-15.453-7.266l27.672-22.656c1.109 1.188 2.188 2.391 3.266 3.609L363.219 491.739z"
    />
  </Svg>
);

const DoctorIcon = () => (
  <Svg viewBox="0 0 32 32" style={styles.icon}>
    <Path
      fill="#fff"
      d="M26 12.8l-1.8-7.3c-.1-.3-.3-.5-.5-.7-4.8-2.3-10.4-2.3-15.3 0-.3.1-.5.3-.7.4L6 12.8c0 .2 0 .3.2.5.1.2.4.4.6.4 3.1.7 6.1 1 9.2 1s6.2-.3 9.2-1c.3-.1.5-.2.6-.4.2-.2.2-.5.2-.7zM18 10h-1v1c0 .6-.4 1-1 1s-1-.4-1-1v-1h-1c-.6 0-1-.4-1-1s.4-1 1-1h1V7c0-.6.4-1 1-1s1 .4 1 1v1h1c.6 0 1 .4 1 1s-.4 1-1 1z"
    />
    <Path
      fill="#fff"
      d="M26.3 15.7c-.2.1-.4.2-.6.2-3.3.7-6.6 1.1-9.7 1.1s-6.5-.4-9.7-1.1c-.2 0-.4-.1-.6-.2-.8.9-1 2.5-.4 4.2.4 1.3 1.2 2.4 2.2 2.9.2.1.5.2.7.2 1.2 3.6 4.2 6 7.8 6s6.6-2.4 7.8-6c.3 0 .5-.1.8-.2.9-.4 1.8-1.5 2.2-2.9.6-1.7.4-3.3-.3-4.2z"
    />
  </Svg>
);

const DetectiveIcon = () => (
  <Svg viewBox="0 0 512 512" style={styles.icon}>
    <Path
      fill="#fff"
      d="M406.219 278.624c-.172-.906-.406-2.109-.688-3.625l.001-.001c-2.031-10.906-6.906-36.906-12.094-64.5v-.031c-3.406-18.109-6.953-36.938-9.938-52.625-1.484-7.844-2.828-14.922-3.953-20.734-1.125-5.797-2.016-10.344-2.578-13.203-1.219-6-3.734-11.516-7.156-16.313-5.094-7.219-12.219-12.891-20.344-16.781-8.109-3.891-17.297-6.031-26.813-6.031-5.797 0-11.719.797-17.563 2.5-5.813 1.719-11.563 4.359-17 7.969-6.875 4.594-13.219 6.969-18.688 8.25-2.719.641-5.25 1-7.484 1.219-2.25.188-4.219.219-5.922.219-1.625 0-3.047.063-4.406.063-1.438 0-2.781-.063-4.344-.25-2.328-.281-5.125-.906-8.938-2.344-3.828-1.453-8.656-3.75-14.813-7.406-11.063-6.563-23.094-9.531-34.563-9.531-6.313 0-12.469.891-18.25 2.594-8.688 2.563-16.594 6.938-22.875 13-3.156 3.031-5.875 6.5-8.063 10.313-2.172 3.844-3.797 8.063-4.688 12.531-.594 2.859-1.484 7.406-2.594 13.203-3.375 17.422-8.813 46.172-13.906 73.359-5.188 27.625-10.063 53.625-12.094 64.531l-.001.001c-.281 1.516-.516 2.719-.688 3.625H0l6.188 12.609c.313.609 3.375 6.656 11 15.359 11.453 13.063 33.25 32.063 71.156 47.688 10.813 4.469 22.953 8.625 36.516 12.344v4.641l41.547 48.047s48.031 9.078 51.938 7.781S256 392.03 256 392.03s33.75 33.766 37.656 35.063c3.891 1.297 51.938-7.781 51.938-7.781l41.563-48.047v-4.641c45.234-12.375 74.453-30.109 92.531-45.344 19-15.984 25.672-29.125 26.109-30.047L512 278.624H406.219zM135.75 213.718c3.406-18.125 6.969-36.938 9.938-52.609 1.5-7.844 2.844-14.891 3.953-20.672 1.125-5.781 2-10.313 2.547-13.047v-.016c.719-3.5 2.141-6.672 4.203-9.578 3.078-4.359 7.641-8.078 13.297-10.703 5.625-2.625 12.281-4.125 19.25-4.125 8.469 0 17.359 2.188 25.641 7.094 9.078 5.375 16.234 8.531 22.266 10.313 3.031.891 5.75 1.438 8.219 1.75s4.688.375 6.531.375c1.75 0 3.219-.063 4.406-.047 2 0 4.547-.047 7.484-.328 4.406-.375 9.734-1.266 15.563-3.156 5.859-1.891 12.234-4.781 18.781-9.156 3.922-2.625 8.031-4.5 12.203-5.719 4.188-1.234 8.438-1.813 12.625-1.813 4.578 0 9.063.688 13.25 1.969 6.281 1.922 11.844 5.156 15.984 9.188 2.078 2.031 3.797 4.219 5.109 6.547 1.328 2.328 2.281 4.797 2.813 7.391v.016c.547 2.734 1.438 7.266 2.547 13.047 3.344 17.344 8.766 46.094 13.891 73.281l.001.001c.688 3.594 1.344 7.156 2 10.672h-244.5c.672-3.594 1.344-7.156 2-10.672z"
    />
  </Svg>
);

const CitizenIcon = () => (
  <Svg viewBox="0 0 100 100" style={styles.icon}>
    <Path
      fill="#fff"
      d="M80 71.2V74c0 3.3-2.7 6-6 6H26c-3.3 0-6-2.7-6-6v-2.8c0-7.3 8.5-11.7 16.5-15.2.3-.1.5-.2.8-.4.6-.3 1.3-.3 1.9.1C42.4 57.8 46.1 59 50 59c3.9 0 7.6-1.2 10.8-3.2.6-.4 1.3-.4 1.9-.1.3.1.5.2.8.4C71.5 59.5 80 63.9 80 71.2z"
    />
    <Ellipse
      fill="#fff"
      cx="50"
      cy="36.5"
      rx="14.9"
      ry="16.5"
    />
  </Svg>
);

type RoleConfig = {
  mafia: number;
  doctor: number;
  detective: number;
  citizen: number;
};

type RoleControlProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  totalSelected: number;
  playerCount: number;
  max?: number;
  onIncrement: () => void;
  onDecrement: () => void;
};

const RoleControl = ({
  icon,
  label,
  value,
  totalSelected,
  playerCount,
  max = Infinity,
  onIncrement,
  onDecrement
}: RoleControlProps) => (
    <View style={styles.roleRow}>
      <View style={styles.roleLabelContainer}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={styles.roleLabel}>{label}</Text>
      </View>
      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={[styles.counterButton, value === 0 && styles.disabledButton]}
          onPress={onDecrement}
          disabled={value === 0}
        >
          <Text style={styles.counterText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.counterValue}>{value}</Text>
        <TouchableOpacity
          style={[styles.counterButton, 
            (totalSelected === playerCount || value >= max) && styles.disabledButton
          ]}
          onPress={onIncrement}
          disabled={totalSelected === playerCount || value >= max}
        >
          <Text style={styles.counterText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

export default function RoleSelection() {
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState(0);
  const [roles, setRoles] = useState<RoleConfig>({
    mafia: 0,
    doctor: 0,
    detective: 0,
    citizen: 0,
  });

  useEffect(() => {
    const loadPlayers = async () => {
      const playersData = await AsyncStorage.getItem('players');
      const players = playersData ? JSON.parse(playersData) : [];
      setPlayerCount(players.length);
    };
    loadPlayers();
  }, []);

  const totalSelected = Object.values(roles).reduce((a, b) => a + b, 0);

  const updateRole = (role: keyof RoleConfig, delta: number) => {
    setRoles(prev => {
      const newValue = prev[role] + delta;
      const currentTotal = Object.values(prev).reduce((a, b) => a + b, 0);
      if (newValue < 0) return prev;
      if (
        (role === 'doctor' && newValue > 1) ||
        (role === 'detective' && newValue > 1)
      ) return prev;
      if (currentTotal + delta > playerCount) return prev;
      return {
        ...prev,
        [role]: newValue,
      };
    });
  };

  const validateAndContinue = async () => {
    if (totalSelected !== playerCount) {
      Alert.alert('Помилка', 'Загальна кількість ролей має дорівнювати кількості гравців');
      return;
    }
    let total = []
    for (let index = 0; index < (Object.values(roles)).length; index++) {
        for (let j = 0; j < (Object.values(roles))[index]; j++) {
            total.push(Object.keys(roles)[index])
        }   
    }

    function shuffleArray<T>(array: T[]): T[] {
        const copy = [...array];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }
    total = shuffleArray(total);
    await AsyncStorage.setItem('roles', JSON.stringify(total));

    const updateData = async () => {
        try {
          const value = await AsyncStorage.getItem('players');
          if (value !== null) {
            let data = JSON.parse(value); // Отримуємо поточні дані
            for (let index = 0; index < data.length; index++) {
                data[index].role=total[index]
            }
            await AsyncStorage.setItem('players', JSON.stringify(data)); // Зберігаємо оновлені дані
            console.log('Data updated!');
          }
        } catch (e) {
          console.error('Error updating value', e);
        }
      };      
    updateData()

    await AsyncStorage.setItem('rolesConfig', JSON.stringify(roles));
    router.push('/LoadingScreen'); // Перехід на інший екран
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Оберіть ролі</Text>
      <Text style={styles.subtitle}>Гравців: {playerCount}</Text>
      
      <View style={styles.roleContainer}>
        <RoleControl
          icon={<MafiaIcon />}
          label="Мафія"
          value={roles.mafia}
          totalSelected={totalSelected}
          playerCount={playerCount}
          onIncrement={() => updateRole('mafia', 1)}
          onDecrement={() => updateRole('mafia', -1)}
        />
        <RoleControl
          icon={<DoctorIcon />}
          label="Лікар"
          value={roles.doctor}
          totalSelected={totalSelected}
          playerCount={playerCount}
          max={1}
          onIncrement={() => updateRole('doctor', 1)}
          onDecrement={() => updateRole('doctor', -1)}
        />
        <RoleControl
          icon={<DetectiveIcon />}
          label="Детектив"
          value={roles.detective}
          totalSelected={totalSelected}
          playerCount={playerCount}
          max={1}
          onIncrement={() => updateRole('detective', 1)}
          onDecrement={() => updateRole('detective', -1)}
        />
        <RoleControl
          icon={<CitizenIcon />}
          label="Мирні жителі"
          value={roles.citizen}
          totalSelected={totalSelected}
          playerCount={playerCount}
          onIncrement={() => updateRole('citizen', 1)}
          onDecrement={() => updateRole('citizen', -1)}
        />
      </View>

      <Text style={styles.total}>
        Обрано ролей: {totalSelected}/{playerCount}
      </Text>

      <TouchableOpacity 
        style={[
          styles.button, 
          totalSelected !== playerCount && styles.disabledButton
        ]} 
        onPress={validateAndContinue}
        disabled={totalSelected !== playerCount}
      >
        <Text style={styles.buttonText}>Продовжити</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 32,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  roleContainer: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  roleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 4,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  roleLabel: {
    fontSize: 20,
    fontWeight: '500',
    color: 'white',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  counterButton: {
    backgroundColor: '#333',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    color: 'white',
    fontSize: 24,
    lineHeight: 28,
  },
  counterValue: {
    color: 'white',
    fontSize: 24,
    minWidth: 30,
    textAlign: 'center',
  },
  total: {
    color: '#888',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#D32F2F',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});