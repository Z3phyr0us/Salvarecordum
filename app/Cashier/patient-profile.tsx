import {
  View, Text, TouchableOpacity,
  StyleSheet, StatusBar, ScrollView, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

const DOCTORS = [
  { id: 'd1', name: 'Nurse Santos', status: 'free' },
  { id: 'd2', name: 'Nurse Reyes', status: 'free' },
  { id: 'd3', name: 'Nurse Mendoza', status: 'busy' },
];

export default function PatientProfile() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const patient = JSON.parse(params.patient as string);
  const windowIndex = Number(params.windowIndex);

  const doctors = DOCTORS;
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);

  useEffect(() => {
    const loadVisits = async () => {
      const data = await AsyncStorage.getItem(`visits_${patient.name}`);
      if (data) setVisits(JSON.parse(data));
    };
    loadVisits();
  }, [patient.name]);

  const handleMarkPaid = async () => {
    if (!selectedDoctor) {
      Alert.alert('Select a Doctor', 'Please select a free doctor before marking as paid.');
      return;
    }

    // Update patient status to paid
    const pData = await AsyncStorage.getItem('patients');
    const patients = pData ? JSON.parse(pData) : [];
    const updatedPatients = patients.map((p: any) =>
      p.id === patient.id
        ? { ...p, status: 'paid', assignedDoctor: selectedDoctor }
        : p
    );
    await AsyncStorage.setItem('patients', JSON.stringify(updatedPatients));

    // Clear this patient from the window
    const wData = await AsyncStorage.getItem('windows');
    const windows = wData ? JSON.parse(wData) : [null, null, null];
    windows[windowIndex] = null;
    await AsyncStorage.setItem('windows', JSON.stringify(windows));

    Alert.alert(
      'Patient Marked as Paid',
      `${patient.name} has been assigned to ${selectedDoctor.name}.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1931" />

      {/* BACK */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* PATIENT HEADER */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {patient.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.patientQueue}>Queue #{patient.queue}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* PAST VISITS */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>VISIT HISTORY</Text>
      </View>

      {visits.length === 0 ? (
        <Text style={styles.emptyText}>No past visits found.</Text>
      ) : (
        visits.map((visit, i) => (
          <View key={i} style={styles.visitCard}>
            <Text style={styles.visitDate}>{visit.date}</Text>
            <Text style={styles.visitDetail}>Diagnosis: {visit.diagnosis}</Text>
            <Text style={styles.visitDetail}>Prescription: {visit.prescription}</Text>
          </View>
        ))
      )}

      <View style={styles.divider} />

      {/* ASSIGN DOCTOR */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>ASSIGN DOCTOR</Text>
      </View>

      {doctors.map((doc) => (
        <TouchableOpacity
          key={doc.id}
          style={[
            styles.doctorRow,
            doc.status === 'busy' && styles.doctorBusy,
            selectedDoctor?.id === doc.id && styles.doctorSelected,
          ]}
          onPress={() => {
            if (doc.status === 'busy') {
              Alert.alert('Doctor Unavailable', `${doc.name} is currently busy.`);
              return;
            }
            setSelectedDoctor(doc);
          }}
          activeOpacity={0.85}
        >
          <View style={[
            styles.statusLight,
            { backgroundColor: doc.status === 'free' ? '#2ECC71' : '#E74C3C' }
          ]} />
          <Text style={styles.doctorName}>{doc.name}</Text>
          <Text style={[
            styles.doctorStatus,
            { color: doc.status === 'free' ? '#2ECC71' : '#E74C3C' }
          ]}>
            {doc.status.toUpperCase()}
          </Text>
          {selectedDoctor?.id === doc.id && (
            <Text style={styles.selectedCheck}>✓</Text>
          )}
        </TouchableOpacity>
      ))}

      <View style={styles.divider} />

      {/* MARK PAID BUTTON */}
      <TouchableOpacity
        style={[
          styles.paidButton,
          !selectedDoctor && styles.paidButtonDisabled
        ]}
        onPress={handleMarkPaid}
        activeOpacity={0.85}
      >
        <Text style={styles.paidButtonText}>Mark as Paid & Send to Doctor</Text>
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
  backButton: {
    backgroundColor: '#1E3A5F',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  /* Profile header */
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2471A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  patientName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  patientQueue: {
    fontSize: 13,
    color: '#5B8DB8',
    marginTop: 2,
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

  /* Visits */
  visitCard: {
    backgroundColor: '#0F2744',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  visitDate: {
    fontSize: 12,
    color: '#5B8DB8',
    marginBottom: 4,
    fontWeight: '600',
  },
  visitDetail: {
    fontSize: 13,
    color: '#AED6F1',
    marginBottom: 2,
  },
  emptyText: {
    fontSize: 13,
    color: '#2E4F6E',
    fontStyle: 'italic',
    marginBottom: 8,
  },

  /* Doctors */
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2744',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  doctorBusy: {
    opacity: 0.5,
  },
  doctorSelected: {
    borderColor: '#2471A3',
    borderWidth: 2,
  },
  statusLight: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  doctorName: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '600',
  },
  doctorStatus: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  selectedCheck: {
    color: '#2471A3',
    fontSize: 18,
    fontWeight: '700',
  },

  /* Pay button */
  paidButton: {
    backgroundColor: '#1E8449',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  paidButtonDisabled: {
    backgroundColor: '#1E3A5F',
  },
  paidButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});