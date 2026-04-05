import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, ScrollView
} from 'react-native';
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';

export default function CashierDashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [windows, setWindows] = useState<any[]>([null, null, null]);
  const [selectedWindow, setSelectedWindow] = useState<number>(0);

  const loadData = async () => {
    const pData = await AsyncStorage.getItem('patients');
    const wData = await AsyncStorage.getItem('windows');
    if (pData) setPatients(JSON.parse(pData));
    if (wData) setWindows(JSON.parse(wData));
    else setWindows([null, null, null]);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userEmail');
    router.replace('/login');
  };

  const handleNextPatient = async () => {
    // Get next waiting patient not already in a window
    const windowPatientIds = windows
      .filter(w => w !== null)
      .map(w => w.id);

    const next = patients.find(
      p => p.status === 'waiting' && !windowPatientIds.includes(p.id)
    );

    if (!next) {
      alert('No patients waiting in queue.');
      return;
    }

    const updatedWindows = [...windows];
    updatedWindows[selectedWindow] = next;
    await AsyncStorage.setItem('windows', JSON.stringify(updatedWindows));
    setWindows(updatedWindows);
  };

  const windowConfig = [
    { label: 'Window 1', accent: '#2980B9', dot: '#3498DB', bg: '#E8F4FD' },
    { label: 'Window 2', accent: '#27AE60', dot: '#2ECC71', bg: '#EAF7F0' },
    { label: 'Window 3', accent: '#D4AC0D', dot: '#F1C40F', bg: '#FEF9E7' },
  ];

  const waitingPatients = patients.filter(p => p.status === 'waiting');
  const paidPatients = patients.filter(p => p.status === 'paid');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1931" />

      {/* HEADER */}
      <Text style={styles.headerSub}>SALVARECORDUM</Text>
      <Text style={styles.headerTitle}>Cashier Dashboard</Text>

      <View style={styles.divider} />

      {/* WINDOW SELECTOR */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>YOUR WINDOW</Text>
      </View>

      <View style={styles.windowSelector}>
        {windowConfig.map((win, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.windowTab,
              selectedWindow === i && {
                backgroundColor: win.accent,
                borderColor: win.accent,
              }
            ]}
            onPress={() => setSelectedWindow(i)}
            activeOpacity={0.85}
          >
            <Text style={[
              styles.windowTabText,
              selectedWindow === i && { color: '#FFFFFF' }
            ]}>
              {win.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CURRENT WINDOW DISPLAY */}
      <View style={[
        styles.currentWindowCard,
        { borderLeftColor: windowConfig[selectedWindow].accent }
      ]}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardDot, { backgroundColor: windowConfig[selectedWindow].dot }]} />
          <Text style={[styles.cardLabel, { color: windowConfig[selectedWindow].accent }]}>
            {windowConfig[selectedWindow].label} — Now Serving
          </Text>
        </View>
        <Text style={[
          styles.cardPatient,
          !windows[selectedWindow] && styles.cardPatientEmpty
        ]}>
          {windows[selectedWindow]?.name || '— No patient —'}
        </Text>
        {windows[selectedWindow]?.queue && (
          <Text style={styles.cardQueue}>Queue #{windows[selectedWindow].queue}</Text>
        )}

        {/* ACTIONS */}
        <View style={styles.actionRow}>
          {windows[selectedWindow] && (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push({
                pathname: '/Cashier/patient-profile',
                params: { patient: JSON.stringify(windows[selectedWindow]), windowIndex: selectedWindow }
              })}
              activeOpacity={0.85}
            >
              <Text style={styles.profileButtonText}>Open Profile</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextPatient}
            activeOpacity={0.85}
          >
            <Text style={styles.nextButtonText}>Next Patient →</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {/* WAITING QUEUE */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>WAITING ({waitingPatients.length})</Text>
      </View>

      {waitingPatients.length === 0 ? (
        <Text style={styles.emptyText}>No patients waiting.</Text>
      ) : (
        <FlatList
          data={waitingPatients}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.queueItem}
              onPress={() => router.push({
                pathname: '/Cashier/patient-profile',
                params: { patient: JSON.stringify(item), windowIndex: selectedWindow }
              })}
              activeOpacity={0.85}
            >
              <Text style={styles.queueNumber}>#{item.queue}</Text>
              <Text style={styles.queueName}>{item.name}</Text>
              <Text style={styles.queueArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.divider} />

      {/* PAID / DONE */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>PAID ({paidPatients.length})</Text>
      </View>

      {paidPatients.length === 0 ? (
        <Text style={styles.emptyText}>No paid patients yet.</Text>
      ) : (
        <FlatList
          data={paidPatients}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={[styles.queueItem, { opacity: 0.6 }]}>
              <Text style={styles.queueNumber}>#{item.queue}</Text>
              <Text style={styles.queueName}>{item.name}</Text>
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>PAID</Text>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

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
  headerSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5B8DB8',
    letterSpacing: 3,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E3A5F',
    marginVertical: 20,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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

  /* Window selector */
  windowSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  windowTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E3A5F',
    alignItems: 'center',
  },
  windowTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5B8DB8',
  },

  /* Current window card */
  currentWindowCard: {
    backgroundColor: '#0F2744',
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
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardPatientEmpty: {
    color: '#2E4F6E',
    fontStyle: 'italic',
    fontWeight: '400',
    fontSize: 17,
  },
  cardQueue: {
    fontSize: 12,
    color: '#5B8DB8',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  profileButton: {
    flex: 1,
    backgroundColor: '#1E3A5F',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  profileButtonText: {
    color: '#AED6F1',
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#2471A3',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  /* Queue list */
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2744',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  queueNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2471A3',
    width: 36,
  },
  queueName: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  queueArrow: {
    fontSize: 20,
    color: '#2E4F6E',
  },
  paidBadge: {
    backgroundColor: '#1E8449',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paidBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    color: '#2E4F6E',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});