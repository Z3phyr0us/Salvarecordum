import { View, Text, Image, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const [windows, setWindows] = useState<any[]>([null, null, null]);
  const [patients, setPatients] = useState<any[]>([]);

  const loadWindows = async () => {
    const data = await AsyncStorage.getItem('windows');
    if (data) setWindows(JSON.parse(data));
    else setWindows([null, null, null]);
  };

  const loadPatients = async () => {
    const data = await AsyncStorage.getItem('patients');
    if (data) {
      const allPatients = JSON.parse(data);
      setPatients(allPatients);
      // Assign first 3 patients to windows
      const windowsData = [
        allPatients[0] || null,
        allPatients[1] || null,
        allPatients[2] || null,
      ];
      setWindows(windowsData);
      // Persist windows to AsyncStorage so Cashier can see them
      await AsyncStorage.setItem('windows', JSON.stringify(windowsData));
    } else {
      setPatients([]);
      setWindows([null, null, null]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWindows();
      loadPatients();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userEmail');
    router.replace('/login');
  };

  const windowConfig = [
    { label: 'Window 1', color: '#E8F4FD', accent: '#2980B9', dot: '#3498DB' },
    { label: 'Window 2', color: '#EAF7F0', accent: '#27AE60', dot: '#2ECC71' },
    { label: 'Window 3', color: '#FEF9E7', accent: '#D4AC0D', dot: '#F1C40F' },
  ];

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
          <Text style={styles.headerTitle}>Now Serving</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>CASHIER WINDOWS</Text>
      </View>

      {/* WINDOW CARDS */}
      <View style={styles.cardsContainer}>
        {windowConfig.map((win, i) => (
          <View
            key={i}
            style={[styles.card, {
              backgroundColor: win.color,
              borderLeftColor: win.accent
            }]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardDot, { backgroundColor: win.dot }]} />
              <Text style={[styles.cardLabel, { color: win.accent }]}>{win.label}</Text>
            </View>

            <Text style={[
              styles.cardPatient,
              !windows[i] && styles.cardPatientEmpty
            ]}>
              {windows[i]?.name || '— No patient —'}
            </Text>

            {windows[i]?.queue && (
              <Text style={styles.cardQueue}>Queue #{windows[i].queue}</Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>WAITING PATIENTS ({Math.max(0, patients.length - 3)})</Text>
      </View>

      {patients.length <= 3 ? (
        <Text style={styles.emptyText}>No additional patients waiting.</Text>
      ) : (
        <View style={styles.waitingList}>
          {patients.slice(3).map((patient) => (
            <View key={patient.id} style={styles.waitingPatientCard}>
              <View style={styles.waitingPatientInfo}>
                <View style={styles.waitingQueueBadge}>
                  <Text style={styles.waitingQueueNumber}>{patient.queue}</Text>
                </View>
                <Text style={styles.waitingPatientName}>{patient.name}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.queueButton}
        onPress={() => router.push('/Patient/queue')}
        activeOpacity={0.85}
      >
        <Text style={styles.queueButtonText}>Go to Patient List / Queue</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
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
  cardsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  queueButton: {
    backgroundColor: '#2471A3',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  queueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cardPatient: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A252F',
    marginBottom: 2,
  },
  cardPatientEmpty: {
    color: '#AAB7C4',
    fontStyle: 'italic',
    fontWeight: '400',
    fontSize: 17,
  },
  cardQueue: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#5B8DB8',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  waitingList: {
    gap: 8,
    marginBottom: 20,
  },
  waitingPatientCard: {
    backgroundColor: '#0F2744',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  waitingPatientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waitingQueueBadge: {
    backgroundColor: '#2471A3',
    borderRadius: 6,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingQueueNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  waitingPatientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#2E4F6E',
    letterSpacing: 0.5,
  },
});