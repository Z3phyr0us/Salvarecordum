import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ScrollView, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';

export default function CaseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const patient = JSON.parse(params.patient as string);

  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');

  const handleSaveAndPrint = async () => {
    if (!symptoms.trim() && !diagnosis.trim()) {
      Alert.alert('Missing Info', 'Please enter at least symptoms or a diagnosis.');
      return;
    }

    const visit = {
      date: new Date().toLocaleDateString('en-PH', {
        year: 'numeric', month: 'long', day: 'numeric'
      }),
      symptoms,
      diagnosis,
      prescription,
      notes,
    };

    // Save visit to patient's history
    const existingData = await AsyncStorage.getItem(`visits_${patient.name}`);
    const existing = existingData ? JSON.parse(existingData) : [];
    await AsyncStorage.setItem(
      `visits_${patient.name}`,
      JSON.stringify([...existing, visit])
    );

    // Update patient status to done
    const pData = await AsyncStorage.getItem('patients');
    const patients = pData ? JSON.parse(pData) : [];
    const updatedPatients = patients.map((p: any) =>
      p.id === patient.id ? { ...p, status: 'done' } : p
    );
    await AsyncStorage.setItem('patients', JSON.stringify(updatedPatients));

    // Go to print screen
    router.push({
      pathname: '/Doctor/print',
      params: {
        patient: JSON.stringify(patient),
        visit: JSON.stringify(visit),
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1931" />

      {/* BACK */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
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

      {/* FORM */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>CONSULTATION NOTES</Text>
      </View>

      <Text style={styles.label}>Symptoms</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Describe patient symptoms..."
        placeholderTextColor="#2E4F6E"
        value={symptoms}
        onChangeText={setSymptoms}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Diagnosis</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Enter diagnosis..."
        placeholderTextColor="#2E4F6E"
        value={diagnosis}
        onChangeText={setDiagnosis}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Prescription</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Medications, dosage, frequency..."
        placeholderTextColor="#2E4F6E"
        value={prescription}
        onChangeText={setPrescription}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Additional Notes</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Any other notes..."
        placeholderTextColor="#2E4F6E"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      <View style={styles.divider} />

      {/* SAVE & PRINT */}
      <TouchableOpacity
        style={styles.printButton}
        onPress={handleSaveAndPrint}
        activeOpacity={0.85}
      >
        <Text style={styles.printButtonText}>Save & Proceed to Print</Text>
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
    marginBottom: 20,
  },
  backText: {
    color: '#5B8DB8',
    fontSize: 15,
    fontWeight: '600',
  },
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
    marginBottom: 16,
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
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B8DB8',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F2744',
    borderWidth: 1,
    borderColor: '#1E3A5F',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  multiline: {
    textAlignVertical: 'top',
    minHeight: 90,
  },
  printButton: {
    backgroundColor: '#2471A3',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  printButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});