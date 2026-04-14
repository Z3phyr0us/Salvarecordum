import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WaitingScreen() {
  const params = useLocalSearchParams();
  const initial = JSON.parse(params.patient as string);

  const [status, setStatus] = useState(initial.status || 'waiting');
  const [queue, setQueue] = useState(initial.queue);

  // Poll AsyncStorage every 3 seconds so status updates live
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await AsyncStorage.getItem('patients');
      if (!data) return;
      const all = JSON.parse(data);
      const me = all.find((p: any) => p.id === initial.id);
      if (me) {
        setStatus(me.status);
        // Reflect re-numbered queue position if it changed
        const active = all.filter((p: any) => p.status !== 'done');
        const myIndex = active.findIndex((p: any) => p.id === initial.id);
        if (myIndex !== -1) setQueue(myIndex + 1);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const isDone = status === 'done';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1931" />

      <Text style={styles.headerSub}>SALVARECORDUM</Text>
      <Text style={styles.headerTitle}>Your Ticket</Text>

      <View style={styles.card}>
        <Text style={styles.queueLabel}>QUEUE NUMBER</Text>
        <Text style={styles.queueNumber}>#{queue}</Text>
        <Text style={styles.patientName}>{initial.name}</Text>
      </View>

      <View style={[styles.statusBadge, isDone ? styles.statusDone : styles.statusWaiting]}>
        <Text style={styles.statusText}>
          {isDone ? '✓ You have been served' : '⏳ Please wait to be called'}
        </Text>
      </View>

      {isDone && (
        <Text style={styles.doneNote}>
          Thank you! You may now proceed.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1931',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#0F2744',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A5F',
    marginBottom: 28,
  },
  queueLabel: {
    fontSize: 11,
    letterSpacing: 2.5,
    color: '#5B8DB8',
    fontWeight: '700',
    marginBottom: 12,
  },
  queueNumber: {
    fontSize: 72,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 80,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  statusWaiting: {
    backgroundColor: '#1E3A5F',
  },
  statusDone: {
    backgroundColor: '#1A6B3C',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  doneNote: {
    marginTop: 16,
    fontSize: 14,
    color: '#2ECC71',
    fontStyle: 'italic',
  },
});