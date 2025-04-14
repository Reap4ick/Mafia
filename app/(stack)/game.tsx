import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native'; // Додано для навігації
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Player {
  id: string;
  name: string;
  role: string;
  isAlive: boolean;
}

interface DeadAnnouncement {
  deadPlayers: Player[];
  savedByDoctor?: { id: string; name: string };
}

interface VictoryModal {
  message: string;
}

const roleConfig: Record<string, { title: string; color: string; borderColor: string }> = {
  mafia: { title: 'Мафія', color: '#ff2222', borderColor: '#400000' },
  citizen: { title: 'Мирний житель', color: '#ffffff', borderColor: '#333' },
  detective: { title: 'Детектив', color: '#ffffff', borderColor: '#333' },
  doctor: { title: 'Лікар', color: '#ffffff', borderColor: '#333' },
};

export default function GameScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<'night' | 'day'>('night');
  const [dayCount, setDayCount] = useState(1);
  const [nightStep, setNightStep] = useState<'mafia' | 'doctor' | 'detective' | null>('mafia');
  const [mafiaVotes, setMafiaVotes] = useState<Record<string, string[]>>({}); // { targetId: [voterIds] }
  const [doctorChoice, setDoctorChoice] = useState<string | null>(null);
  const [detectiveChecked, setDetectiveChecked] = useState<string | null>(null);
  const [detectiveModal, setDetectiveModal] = useState<{ playerId: string; role: string } | null>(null);
  const [dayVotes, setDayVotes] = useState<Record<string, string[]>>({}); // { targetId: [voterIds] }
  const [deadAnnouncement, setDeadAnnouncement] = useState<DeadAnnouncement | null>(null);
  const [voteModal, setVoteModal] = useState<{
    voterId: string;
    type: 'mafia' | 'doctor' | 'detective' | 'day';
  } | null>(null);
  const [victoryModal, setVictoryModal] = useState<VictoryModal | null>(null); // Новий стан для модалки перемоги

  const navigation = useNavigation(); // Хук для навігації

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const storedPlayers = await AsyncStorage.getItem('players');
        if (storedPlayers) {
          const parsedPlayers = JSON.parse(storedPlayers).map((p: any) => ({
            ...p,
            id: String(p.id),
            isAlive: p.isAlive !== undefined ? p.isAlive : true,
          }));
          console.log('Завантажено гравців:', parsedPlayers);
          setPlayers(parsedPlayers);
        }
      } catch (error) {
        console.error('Помилка завантаження гравців:', error);
      }
    };
    loadPlayers();
  }, []);

  // Показ модалки загиблих на початку фази
  useEffect(() => {
    if (players.length === 0 || deadAnnouncement) return;

    if (phase === 'night' && nightStep === 'mafia' && dayCount > 1) {
      console.log('Показ модалки на початку ночі');
      setDeadAnnouncement({ deadPlayers: [] });
    } else if (phase === 'day') {
      console.log('Показ модалки на початку дня');
      setDeadAnnouncement({ deadPlayers: [] });
    }
  }, [phase, nightStep, players, dayCount]);

  // Перевірка переможця
  useEffect(() => {
    if (players.length === 0) return;
    const mafiaCount = players.filter((p) => p.isAlive && p.role === 'mafia').length;
    const citizenCount = players.filter(
      (p) => p.isAlive && ['citizen', 'doctor', 'detective'].includes(p.role)
    ).length;
    console.log('Стан гри:', { mafiaCount, citizenCount });
    if (mafiaCount === 0) {
      setVictoryModal({ message: 'Мирні перемогли!' });
    } else if (mafiaCount >= citizenCount) {
      setVictoryModal({ message: 'Мафія перемогла!' });
    }
  }, [players]);

  // Обробка голосування
  const handleVote = (voterId: string, targetId: string, type: 'mafia' | 'doctor' | 'detective' | 'day') => {
    if (voterId === targetId && type !== 'doctor') {
      console.log('Гравець не може голосувати за себе:', { voterId, type });
      return;
    }

    if (type === 'mafia') {
      const targetPlayer = players.find((p) => p.id === targetId);
      if (targetPlayer?.role === 'mafia') {
        console.log('Мафія не може голосувати за мафію:', { voterId, targetId });
        return;
      }
      setMafiaVotes((prev) => {
        const newVotes = { ...prev };
        Object.keys(newVotes).forEach((key) => {
          newVotes[key] = newVotes[key].filter((id) => id !== voterId);
          if (newVotes[key].length === 0) delete newVotes[key];
        });
        newVotes[targetId] = [...(newVotes[targetId] || []), voterId];
        console.log('Мафія проголосувала:', newVotes);
        return newVotes;
      });
    } else if (type === 'doctor') {
      setDoctorChoice(targetId);
      console.log('Лікар вибрав:', { voterId, targetId });
    } else if (type === 'detective') {
      setDetectiveChecked(targetId);
      const target = players.find((p) => p.id === targetId);
      if (target) {
        setDetectiveModal({ playerId: targetId, role: target.role });
        console.log('Детектив перевірив:', { voterId, targetId, role: target.role });
      }
    } else if (type === 'day') {
      setDayVotes((prev) => {
        const newVotes = { ...prev };
        Object.keys(newVotes).forEach((key) => {
          newVotes[key] = newVotes[key].filter((id) => id !== voterId);
          if (newVotes[key].length === 0) delete newVotes[key];
        });
        newVotes[targetId] = [...(newVotes[targetId] || []), voterId];
        console.log('День голосування:', newVotes);
        return newVotes;
      });
    }
    setVoteModal(null);
  };

  // Перевірка, чи є чіткий лідер у голосуванні
  const hasClearVoteLeader = (votes: Record<string, string[]>) => {
    if (Object.keys(votes).length === 0) return false;
    const voteCounts = Object.values(votes).map((voters) => voters.length);
    const maxVotes = Math.max(...voteCounts);
    const maxVoteTargets = voteCounts.filter((count) => count === maxVotes);
    console.log('Лідер голосування:', { voteCounts, maxVotes, maxVoteTargets });
    return maxVoteTargets.length === 1 && maxVotes > 0;
  };

  // Завершення фази
  const completePhase = () => {
    console.log('Завершення фази:', { phase, nightStep, mafiaVotes, doctorChoice, detectiveChecked, dayVotes });
    let deadPlayers: Player[] = [];
    let savedByDoctor: { id: string; name: string } | undefined;

    const hasAliveDoctor = players.some((p) => p.role === 'doctor' && p.isAlive);
    const hasAliveDetective = players.some((p) => p.role === 'detective' && p.isAlive);

    if (phase === 'night') {
      if (nightStep === 'mafia') {
        if (hasAliveDoctor) {
          setNightStep('doctor');
        } else {
          console.log('Пропущено фазу лікаря: немає живих лікарів');
          if (hasAliveDetective) {
            setNightStep('detective');
          } else {
            console.log('Пропущено фазу детектива: немає живих детективів');
            let killedPlayerId: string | null = null;
            let maxVotes = 0;
            Object.entries(mafiaVotes).forEach(([targetId, voters]) => {
              console.log(`Голоси мафії за ${targetId}:`, voters);
              if (voters.length > maxVotes) {
                maxVotes = voters.length;
                killedPlayerId = targetId;
              }
            });

            console.log('Обрана жертва мафії:', { killedPlayerId, doctorChoice });

            if (killedPlayerId) {
              console.log('Гравці перед пошуком:', players);
              const killedPlayer = players.find((p) => String(p.id) === String(killedPlayerId) && p.isAlive);
              console.log('Знайдено гравця:', killedPlayer);
              if (killedPlayer) {
                console.log('Мафія вбила:', killedPlayer);
                deadPlayers.push(killedPlayer);
                setPlayers((prev) => {
                  const newPlayers = prev.map((p) =>
                    String(p.id) === String(killedPlayerId) ? { ...p, isAlive: false } : p
                  );
                  console.log('Оновлено гравців після вбивства мафії:', newPlayers);
                  return [...newPlayers];
                });
              } else {
                console.log('Гравець не знайдений або вже мертвий:', killedPlayerId);
              }
            } else {
              console.log('Мафія нікого не вибрала');
            }

            setDeadAnnouncement(
              deadPlayers.length > 0 ? { deadPlayers } : { deadPlayers: [] }
            );
            setMafiaVotes({});
            setDoctorChoice(null);
            setDetectiveChecked(null);
            setDetectiveModal(null);
            setNightStep(null);
            setPhase('day');
          }
        }
      } else if (nightStep === 'doctor') {
        if (hasAliveDetective) {
          setNightStep('detective');
        } else {
          console.log('Пропущено фазу детектива: немає живих детективів');
          let killedPlayerId: string | null = null;
          let maxVotes = 0;
          Object.entries(mafiaVotes).forEach(([targetId, voters]) => {
            console.log(`Голоси мафії за ${targetId}:`, voters);
            if (voters.length > maxVotes) {
              maxVotes = voters.length;
              killedPlayerId = targetId;
            }
          });

          console.log('Обрана жертва мафії:', { killedPlayerId, doctorChoice });

          if (killedPlayerId) {
            console.log('Гравці перед пошуком:', players);
            const killedPlayer = players.find((p) => String(p.id) === String(killedPlayerId) && p.isAlive);
            console.log('Знайдено гравця:', killedPlayer);
            if (killedPlayer) {
              if (String(killedPlayerId) === String(doctorChoice)) {
                savedByDoctor = { id: killedPlayer.id, name: killedPlayer.name };
                console.log(`Мафія намагалась вбити ${killedPlayer.name}, але лікар врятував`);
              } else {
                console.log('Мафія вбила:', killedPlayer);
                deadPlayers.push(killedPlayer);
                setPlayers((prev) => {
                  const newPlayers = prev.map((p) =>
                    String(p.id) === String(killedPlayerId) ? { ...p, isAlive: false } : p
                  );
                  console.log('Оновлено гравців після вбивства мафії:', newPlayers);
                  return [...newPlayers];
                });
              }
            } else {
              console.log('Гравець не знайдений або вже мертвий:', killedPlayerId);
            }
          } else {
            console.log('Мафія нікого не вибрала');
          }

          setDeadAnnouncement(
            deadPlayers.length > 0 || savedByDoctor
              ? { deadPlayers, savedByDoctor }
              : { deadPlayers: [] }
          );
          setMafiaVotes({});
          setDoctorChoice(null);
          setDetectiveChecked(null);
          setDetectiveModal(null);
          setNightStep(null);
          setPhase('day');
        }
      } else if (nightStep === 'detective') {
        let killedPlayerId: string | null = null;
        let maxVotes = 0;
        Object.entries(mafiaVotes).forEach(([targetId, voters]) => {
          console.log(`Голоси мафії за ${targetId}:`, voters);
          if (voters.length > maxVotes) {
            maxVotes = voters.length;
            killedPlayerId = targetId;
          }
        });

        console.log('Обрана жертва мафії:', { killedPlayerId, doctorChoice });

        if (killedPlayerId) {
          console.log('Гравці перед пошуком:', players);
          const killedPlayer = players.find((p) => String(p.id) === String(killedPlayerId) && p.isAlive);
          console.log('Знайдено гравця:', killedPlayer);
          if (killedPlayer) {
            if (String(killedPlayerId) === String(doctorChoice)) {
              savedByDoctor = { id: killedPlayer.id, name: killedPlayer.name };
              console.log(`Мафія намагалась вбити ${killedPlayer.name}, але лікар врятував`);
            } else {
              console.log('Мафія вбила:', killedPlayer);
              deadPlayers.push(killedPlayer);
              setPlayers((prev) => {
                const newPlayers = prev.map((p) =>
                  String(p.id) === String(killedPlayerId) ? { ...p, isAlive: false } : p
                );
                console.log('Оновлено гравців після вбивства мафії:', newPlayers);
                return [...newPlayers];
              });
            }
          } else {
            console.log('Гравець не знайдений або вже мертвий:', killedPlayerId);
          }
        } else {
          console.log('Мафія нікого не вибрала');
        }

        setDeadAnnouncement(
          deadPlayers.length > 0 || savedByDoctor
            ? { deadPlayers, savedByDoctor }
            : { deadPlayers: [] }
        );
        setMafiaVotes({});
        setDoctorChoice(null);
        setDetectiveChecked(null);
        setDetectiveModal(null);
        setNightStep(null);
        setPhase('day');
      }
    } else {
      let killedPlayerId: string | null = null;
      let maxVotes = 0;
      Object.entries(dayVotes).forEach(([targetId, voters]) => {
        console.log(`Голоси вдень за ${targetId}:`, voters);
        if (voters.length > maxVotes) {
          maxVotes = voters.length;
          killedPlayerId = targetId;
        }
      });

      console.log('Обрана жертва дня:', { killedPlayerId });

      if (killedPlayerId) {
        console.log('Гравці перед пошуком:', players);
        const killedPlayer = players.find((p) => String(p.id) === String(killedPlayerId) && p.isAlive);
        console.log('Знайдено гравця:', killedPlayer);
        if (killedPlayer) {
          console.log('Страчено за голосуванням:', killedPlayer);
          deadPlayers.push(killedPlayer);
          setPlayers((prev) => {
            const newPlayers = prev.map((p) =>
              String(p.id) === String(killedPlayerId) ? { ...p, isAlive: false } : p
            );
            console.log('Оновлено гравців після страти:', newPlayers);
            return [...newPlayers];
          });
        } else {
          console.log('Гравець не знайдений або вже мертвий:', killedPlayerId);
        }
      } else {
        console.log('День: нікого не страчено');
      }

      setDeadAnnouncement(deadPlayers.length > 0 ? { deadPlayers } : { deadPlayers: [] });
      setDayVotes({});
      setPhase('night');
      setNightStep('mafia');
      setDayCount((prev) => prev + 1);
    }
  };

  // Кількість мафії, голосів і живих гравців
  const mafiaCount = players.filter((p) => p.isAlive && p.role === 'mafia').length;
  const mafiaVotedCount = Object.values(mafiaVotes).reduce(
    (sum, voters) => sum + voters.length,
    0
  );
  const aliveCount = players.filter((p) => p.isAlive).length;
  const dayVotedCount = Object.values(dayVotes).reduce(
    (sum, voters) => sum + voters.length,
    0
  );
  const hasAliveDoctor = players.some((p) => p.role === 'doctor' && p.isAlive);
  const hasAliveDetective = players.some((p) => p.role === 'detective' && p.isAlive);

  // Умови для активації кнопки "Продовжити"
  const canProceed =
    (phase === 'night' &&
      nightStep === 'mafia' &&
      mafiaVotedCount >= mafiaCount &&
      hasClearVoteLeader(mafiaVotes)) ||
    (phase === 'night' && nightStep === 'doctor' && (hasAliveDoctor ? doctorChoice !== null : true)) ||
    (phase === 'night' && nightStep === 'detective' && (hasAliveDetective ? detectiveChecked !== null : true)) ||
    (phase === 'day' && dayVotedCount >= aliveCount && hasClearVoteLeader(dayVotes));

  const renderPlayer = ({ item }: { item: Player }) => {
    const isMafiaPhase = phase === 'night' && nightStep === 'mafia';
    const isDoctorPhase = phase === 'night' && nightStep === 'doctor';
    const isDetectivePhase = phase === 'night' && nightStep === 'detective';
    const isDayPhase = phase === 'day';

    let actionButton = null;
    let voteText = '';

    if (item.isAlive) {
      if (isMafiaPhase && item.role === 'mafia') {
        actionButton = (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setVoteModal({ voterId: item.id, type: 'mafia' })}
          >
            <Text style={styles.buttonText}>Голосувати</Text>
          </TouchableOpacity>
        );
      } else if (isMafiaPhase && item.role !== 'mafia') {
        const votesForPlayer = (mafiaVotes[item.id] || []).length;
        voteText = `голосів ${votesForPlayer}/${mafiaCount}`;
      } else if (isDoctorPhase && item.role === 'doctor') {
        voteText = doctorChoice === item.id ? 'вибрано' : '';
        actionButton = (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setVoteModal({ voterId: item.id, type: 'doctor' })}
          >
            <Text style={styles.buttonText}>Врятувати</Text>
          </TouchableOpacity>
        );
      } else if (isDetectivePhase && item.role === 'detective') {
        voteText = detectiveChecked === item.id ? 'вибрано' : '';
        actionButton = (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setVoteModal({ voterId: item.id, type: 'detective' })}
          >
            <Text style={styles.buttonText}>Перевірити</Text>
          </TouchableOpacity>
        );
      } else if (isDayPhase) {
        const votesForPlayer = (dayVotes[item.id] || []).length;
        voteText = `голосів ${votesForPlayer}/${aliveCount}`;
        actionButton = (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setVoteModal({ voterId: item.id, type: 'day' })}
          >
            <Text style={styles.buttonText}>Голосувати</Text>
          </TouchableOpacity>
        );
      }
    }

    return (
      <View
        style={[
          styles.playerBlock,
          isMafiaPhase && item.role === 'mafia' && { borderColor: '#ff2222', borderWidth: 2 },
          !item.isAlive && styles.deadPlayer,
        ]}
      >
        <Text
          style={[
            styles.playerText,
            !item.isAlive && { textDecorationLine: 'line-through', color: '#666' },
          ]}
        >
          {item.name}
          {!item.isAlive && ` - ${roleConfig[item.role].title}`}
        </Text>
        {voteText ? (
          <Text style={styles.voteText}>
            {voteText}
          </Text>
        ) : null}
        {actionButton}
      </View>
    );
  };

  return (
    <View style={[styles.container, phase === 'night' && styles.nightContainer]}>
      <Text style={styles.phaseText}>
        {phase === 'night' ? `Ніч ${dayCount}` : `День ${dayCount}`}
      </Text>
      {phase === 'night' && nightStep && (
        <Text style={styles.roleText}>
          Прокинулась {roleConfig[nightStep]?.title || ''}
        </Text>
      )}
      {phase === 'night' && nightStep === 'mafia' && (
        <Text style={styles.voteText}>
          Голосів: {mafiaVotedCount}/{mafiaCount}
        </Text>
      )}
      {phase === 'day' && (
        <Text style={styles.voteText}>
          Голосів: {dayVotedCount}/{aliveCount}
        </Text>
      )}

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayer}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity
        style={[styles.completeButton, !canProceed && styles.disabledButton]}
        onPress={completePhase}
        disabled={!canProceed}
      >
        <Text style={styles.completeButtonText}>Продовжити</Text>
      </TouchableOpacity>

      {/* Модалка для голосування/вибору */}
      <Modal
        visible={!!voteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setVoteModal(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {voteModal?.type === 'mafia' && 'Кого вбити?'}
              {voteModal?.type === 'doctor' && 'Кого врятувати?'}
              {voteModal?.type === 'detective' && 'Кого перевірити?'}
              {voteModal?.type === 'day' && 'Кого стратити?'}
            </Text>
            {players
              .filter((p) =>
                p.isAlive &&
                (voteModal?.type === 'doctor' || p.id !== voteModal?.voterId) &&
                (voteModal?.type !== 'mafia' || p.role !== 'mafia')
              )
              .map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.modalOption}
                  onPress={() => handleVote(voteModal!.voterId, player.id, voteModal!.type)}
                >
                  <Text style={styles.modalOptionText}>{player.name}</Text>
                </TouchableOpacity>
              ))}
            <Pressable
              style={styles.closeButton}
              onPress={() => setVoteModal(null)}
            >
              <Text style={styles.closeButtonText}>Скасувати</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Модалка для перевірки детектива */}
      <Modal
        visible={!!detectiveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setDetectiveModal(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Результат перевірки</Text>
            <View style={[styles.card, { borderColor: roleConfig[detectiveModal?.role || 'citizen'].borderColor }]}>
              <Text style={[styles.cardText, { color: roleConfig[detectiveModal?.role || 'citizen'].color }]}>
                {roleConfig[detectiveModal?.role || 'citizen'].title}
              </Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={() => setDetectiveModal(null)}
            >
              <Text style={styles.closeButtonText}>Закрити</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Модалка для оголошення мертвих */}
      <Modal
        visible={!!deadAnnouncement}
        transparent
        animationType="fade"
        onRequestClose={() => setDeadAnnouncement(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {deadAnnouncement?.deadPlayers?.length ?? 0 > 0
                ? 'Оголошення мертвих'
                : deadAnnouncement?.savedByDoctor
                ? 'Спроба вбивства'
                : 'Ніхто не помер'}
            </Text>
            {deadAnnouncement?.savedByDoctor && (
              <Text style={styles.announcementText}>
                Мафія намагалась вбити {deadAnnouncement.savedByDoctor.name}, але лікар врятував його
              </Text>
            )}
            {deadAnnouncement?.deadPlayers.map((player) => (
              <View
                key={player.id}
                style={[styles.card, styles.deadCard, { borderColor: roleConfig[player.role].borderColor }]}
              >
                <Text
                  style={[
                    styles.cardText,
                    { color: roleConfig[player.role].color, textDecorationLine: 'line-through' },
                  ]}
                >
                  {player.name} - {roleConfig[player.role].title}
                </Text>
              </View>
            ))}
            <Pressable
              style={styles.closeButton}
              onPress={() => setDeadAnnouncement(null)}
            >
              <Text style={styles.closeButtonText}>Закрити</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Модалка для оголошення перемоги */}
      <Modal
        visible={!!victoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setVictoryModal(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{victoryModal?.message}</Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => {
                setVictoryModal(null);
                router.push('/player'); // Перехід на index.tsx
              }}
            >
              <Text style={styles.closeButtonText}>На головний екран</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: 50,
  },
  nightContainer: {
    backgroundColor: '#080808',
  },
  phaseText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'SpaceMono',
  },
  roleText: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'SpaceMono',
  },
  voteText: {
    fontSize: 14,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'SpaceMono',
  },
  announcementText: {
    fontSize: 18,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'SpaceMono',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  playerBlock: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadPlayer: {
    backgroundColor: '#1a1a1a',
    opacity: 0.5,
  },
  playerText: {
    color: '#fff',
    fontSize: 20,
    flex: 1,
    fontFamily: 'SpaceMono',
  },
  actionButton: {
    backgroundColor: '#D32F2F',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
  },
  completeButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#D32F2F',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 12,
    width: SCREEN_WIDTH * 0.8,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    fontFamily: 'SpaceMono',
  },
  modalOption: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalOptionText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'SpaceMono',
  },
  card: {
    backgroundColor: '#0a0a0a',
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  deadCard: {
    opacity: 0.5,
  },
  cardText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'SpaceMono',
  },
  closeButton: {
    backgroundColor: '#D32F2F',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
  },
});