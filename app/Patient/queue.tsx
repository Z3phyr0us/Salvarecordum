import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ScrollView, TextInput, Alert, Image } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

export default function PatientListScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [name, setName] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [])
  );

  const loadPatients = async () => {
    const data = await AsyncStorage.getItem('patients');
    if (data) {
      const all = JSON.parse(data);
      // Only show active patients, re-numbered
      const active = all
        .filter((p: any) => p.status !== 'done')
        .map((p: any, i: number) => ({ ...p, queue: i + 1 }));
      setPatients(active);
    }
  };

  const addPatient = async () => {
    if (!name.trim()) {
      Alert.alert('Enter Name', 'Please enter a patient name.');
      return;
    }

    // Load full list (including done) so we don't overwrite history
    const data = await AsyncStorage.getItem('patients');
    const all = data ? JSON.parse(data) : [];

    const newPatient = {
      id: Date.now().toString(),
      name: name.trim(),
      queue: patients.length + 1,
      status: 'waiting',
      diagnosis: '',
      prescription: '',
      notes: ''
    };

    await AsyncStorage.setItem('patients', JSON.stringify([...all, newPatient]));
    setPatients(prev => [...prev, newPatient]);
    setName('');
    Alert.alert('Success', `${name.trim()} added to queue #${newPatient.queue}`);
  };

  const deletePatient = async (id: string, patientName: string) => {
    Alert.alert(
      'Remove Patient',
      `Remove ${patientName} from queue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // Load full list and mark as done instead of hard-deleting
            const data = await AsyncStorage.getItem('patients');
            const all = data ? JSON.parse(data) : [];
            const updated = all.map((p: any) =>
              p.id === id ? { ...p, status: 'done' } : p
            );
            await AsyncStorage.setItem('patients', JSON.stringify(updated));
            // Re-filter and re-number displayed list
            const active = updated
              .filter((p: any) => p.status !== 'done')
              .map((p: any, i: number) => ({ ...p, queue: i + 1 }));
            setPatients(active);
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1931" />

      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/salvareco.png')}
          style={styles.logoWatermark}
          resizeMode="contain"
        />
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerSub}>SALVARECORDUM</Text>
          <Text style={styles.headerTitle}>Patient Queue</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ADD PATIENT SECTION */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>ADD NEW PATIENT</Text>
      </View>

      <View style={styles.inputCard}>
        <TextInput
          placeholder="Enter patient name"
          placeholderTextColor="#4A6FA5"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={addPatient}
          activeOpacity={0.85}
        >
          <Text style={styles.addButtonText}>Add to Queue</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* PATIENT LIST */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>WAITING PATIENTS ({patients.length})</Text>
      </View>

      {patients.length === 0 ? (
        <Text style={styles.emptyText}>No patients in queue yet.</Text>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <View style={styles.patientCard}>
              <View style={styles.patientCardContent}>
                <View style={styles.patientInfo}>
                  <View style={styles.queueBadge}>
                    <Text style={styles.queueNumber}>{item.queue}</Text>
                  </View>
                  <View>
                    <Text style={styles.patientName}>{item.name}</Text>
                    <Text style={styles.patientStatus}>Waiting</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deletePatient(item.id, item.name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.85}
      >
        <Text style={styles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Pilar College · Pilar Clinic Center</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1931',
  },
  content: {
    padding: 24,
    paddingTop: 52,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    minHeight: 64,
  },
  logoWatermark: {
    position: 'absolute',
    left: 0,
    width: 72,
    height: 72,
    opacity: 100,
  },
  headerTextGroup: {
    marginLeft: 84,
  },
  headerSub: {
    fontSize: 10,
    letterSpacing: 3,
    color: '#5B8DB8',
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E3A5F',
    marginVertical: 20,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3498DB',
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 2.5,
    color: '#5B8DB8',
    fontWeight: '600',
  },
  inputCard: {
    backgroundColor: '#0F2744',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E3A5F',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#0A1931',
    borderWidth: 1,
    borderColor: '#1E3A5F',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#2471A3',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#5B8DB8',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  patientCard: {
    backgroundColor: '#0F2744',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  patientCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  queueBadge: {
    backgroundColor: '#2471A3',
    borderRadius: 8,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  patientStatus: {
    fontSize: 12,
    color: '#2ECC71',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: '#1E3A5F',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#2E4F6E',
    letterSpacing: 0.5,
  },
});