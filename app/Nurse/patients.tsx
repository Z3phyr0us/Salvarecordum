import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, ScrollView
} from 'react-native';
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';

export default function DoctorPatients() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [doctorStatus, setDoctorStatus] = useState<'free' | 'busy'>('free');
  const doctorName = 'Nurse Santos';

  const loadPatients = async () => {
    const data = await AsyncStorage.getItem('patients');
    if (data) setPatients(JSON.parse(data));
    else setPatients([]);
  };

  const toggleStatus = async () => {
    const newStatus = doctorStatus === 'free' ? 'busy' : 'free';
    setDoctorStatus(newStatus);

    // Save doctor status so cashier can read it
    const docData = await AsyncStorage.getItem('doctors');
    const doctors = docData ? JSON.parse(docData) : [];
    const updated = doctors.map((d: any) =>
      d.name === doctorName ? { ...d, status: newStatus } : d
    );
    await AsyncStorage.setItem('doctors', JSON.stringify(updated));
  };

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userEmail');
    router.replace('/login');
  };

  const assignedPatients = patients.filter(
    p => p.status === 'paid' && p.assignedDoctor?.name === doctorName
  );

  const donePatients = patients.filter(
    p => p.status === 'done' && p.assignedDoctor?.name === doctorName
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1931" />

      {/*HEADER*/}
      <Text style={styles.headerSub}>SALVARECORDUM</Text>
      <Text style={styles.headerTitle}>Nurse Dashboard</Text>

      {/*DOCTOR STATUS CARD*/}
      <View style={styles.statusCard}>
        <View style={styles.statusCardLeft}>
          <View style={[
            styles.statusLight,
            { backgroundColor: doctorStatus === 'free' ? '#2ECC71' : '#E74C3C' }
          ]} />
          <View>
            <Text style={styles.doctorName}>{doctorName}</Text>
            <Text style={[
              styles.doctorStatusText,
              { color: doctorStatus === 'free' ? '#2ECC71' : '#E74C3C' }
            ]}>
              {doctorStatus === 'free' ? 'AVAILABLE' : 'BUSY'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: doctorStatus === 'free' ? '#922B21' : '#1E8449' }
          ]}
          onPress={toggleStatus}
          activeOpacity={0.85}
        >
          <Text style={styles.toggleButtonText}>
            {doctorStatus === 'free' ? 'Set Busy' : 'Set Free'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/*ASSIGNED / INCOMING*/}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>
          INCOMING PATIENTS ({assignedPatients.length})
        </Text>
      </View>

      {assignedPatients.length === 0 ? (
        <Text style={styles.emptyText}>No patients assigned yet.</Text>
      ) : (
        <FlatList
          data={assignedPatients}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.patientCard}
              onPress={() => router.push({
                pathname: '/Nurse/case',
                params: { patient: JSON.stringify(item) }
              })}
              activeOpacity={0.85}
            >
              <View style={styles.patientCardLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.patientName}>{item.name}</Text>
                  <Text style={styles.patientQueue}>Queue #{item.queue}</Text>
                </View>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.divider} />

      {/*DONE PATIENTS*/}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>
          COMPLETED ({donePatients.length})
        </Text>
      </View>

      {donePatients.length === 0 ? (
        <Text style={styles.emptyText}>No completed consultations yet.</Text>
      ) : (
        <FlatList
          data={donePatients}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={[styles.patientCard, { opacity: 0.5 }]}>
              <View style={styles.patientCardLeft}>
                <View style={[styles.avatar, { backgroundColor: '#1E3A5F' }]}>
                  <Text style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.patientName}>{item.name}</Text>
                  <Text style={styles.patientQueue}>Queue #{item.queue}</Text>
                </View>
              </View>
              <View style={styles.doneBadge}>
                <Text style={styles.doneBadgeText}>DONE</Text>
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
    marginBottom: 20,
  },

  /* Status card */
  statusCard: {
    backgroundColor: '#0F2744',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  statusCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusLight: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doctorStatusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  toggleButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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

  /* Patient cards */
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F2744',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  patientCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2471A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  patientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  patientQueue: {
    fontSize: 12,
    color: '#5B8DB8',
    marginTop: 2,
  },
  cardArrow: {
    fontSize: 22,
    color: '#2E4F6E',
  },
  doneBadge: {
    backgroundColor: '#1E3A5F',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneBadgeText: {
    fontSize: 11,
    color: '#5B8DB8',
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