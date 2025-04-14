import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PlayersScreen() {
  const router = useRouter();
  const handleNext = () => {
    AsyncStorage.setItem('players', JSON.stringify(players))
    router.push('/roles'); // Перехід на інший екран
  };
  
  const [players, setPlayers] = useState([
    { id: 1, name: 'Гравець 1', role: null, isAlive: true },
    { id: 2, name: 'Гравець 2', role: null, isAlive: true },
    { id: 3, name: 'Гравець 3', role: null, isAlive: true },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: number; name: string } | null>(null);
  const [newName, setNewName] = useState('');

  const addPlayer = () => {
    const newId = players.length > 0 ? players[players.length - 1].id + 1 : 1;
    setPlayers([...players, { id: newId, name: `Гравець ${newId}`, role: null, isAlive: true }]);
  };

  const openEditModal = (player: any) => {
    setSelectedPlayer(player);
    setNewName(player.name);
    setModalVisible(true);
  };

  const saveName = () => {
    setPlayers((prev) =>
      prev.map((p) =>
        selectedPlayer && p.id === selectedPlayer.id ? { ...p, name: newName } : p
      )
    );
    setModalVisible(false);
  };

  const deletePlayer = () => {
    setPlayers(players.filter(player => player.id !== selectedPlayer?.id));
    setModalVisible(false);
  };

  const renderPlayer = ({ item }: any) => (
    <TouchableOpacity style={styles.playerBlock} onPress={() => openEditModal(item)}>
      <Text style={styles.playerText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Гравці</Text>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPlayer}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.addButton} onPress={addPlayer}>
        <View style={styles.plusCircle}>
          <Text style={styles.plusText}>+</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.bottomTab}>
        <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={handleNext}>
            <Text style={styles.buttonText}>Продовжити</Text>
        </Pressable>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              style={styles.input}
              placeholder="Нове ім'я"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveName}>
              <Text style={styles.saveText}>Зберегти</Text>
            </TouchableOpacity>
            
            {/* Кнопка для видалення гравця */}
            <TouchableOpacity style={styles.deleteButton} onPress={deletePlayer}>
              <Text style={styles.deleteText}>Видалити гравця</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', paddingTop: 50 },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    alignSelf: 'center',
    marginBottom: 20,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 160,
  },
  playerBlock: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  playerText: {
    color: 'white',
    fontSize: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    zIndex: 2,
  },
  plusCircle: {
    backgroundColor: 'white',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    fontSize: 36,
    color: '#000',
    marginTop: -4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 12,
    width: '80%',
  },
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'black',
    paddingTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#333',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#D32F2F',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#D32F2F',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D32F2F',
  },
  buttonPressed: {
    backgroundColor: '#1e1e1e',
    opacity: 0.9,
  },
  buttonText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});