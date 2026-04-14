import {
  View, Text, TouchableOpacity,
  StyleSheet, StatusBar, ScrollView, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

export default function PrintScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const patient = JSON.parse(params.patient as string);
  const visit = JSON.parse(params.visit as string);

  const handlePrint = () => {
    Alert.alert('Print', 'Document sent to printer', [
      { text: 'OK', onPress: () => router.replace('/Nurse/patients') }
    ]);
  };

  const handleDone = () => {
    router.replace('/Nurse/patients');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1931" />

      {/* BACK */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* HEADER */}
      <Text style={styles.headerSub}>SALVARECORDUM</Text>
      <Text style={styles.headerTitle}>Consultation Record</Text>

      <View style={styles.divider} />

      {/* PATIENT INFO */}
      <View style={styles.printCard}>
        <View style={styles.printHeader}>
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

        <View style={styles.printDivider} />

        {/* VISIT DETAILS */}
        <Text style={styles.sectionLabel}>VISIT DATE</Text>
        <Text style={styles.sectionValue}>{visit.date}</Text>

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>SYMPTOMS</Text>
        <Text style={styles.sectionValue}>{visit.symptoms || '—'}</Text>

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>DIAGNOSIS</Text>
        <Text style={styles.sectionValue}>{visit.diagnosis || '—'}</Text>

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>PRESCRIPTION</Text>
        <Text style={styles.sectionValue}>{visit.prescription || '—'}</Text>

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>NOTES</Text>
        <Text style={styles.sectionValue}>{visit.notes || '—'}</Text>

        <View style={styles.printDivider} />

        <Text style={styles.footer}>Printed on {new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.divider} />

      {/* ACTION BUTTONS */}
      <TouchableOpacity
        style={styles.printButton}
        onPress={handlePrint}
        activeOpacity={0.85}
      >
        <Text style={styles.printButtonText}>🖨️ Print Document</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleDone}
        activeOpacity={0.85}
      >
        <Text style={styles.doneButtonText}>Done</Text>
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
  backButton: {
    marginBottom: 20,
  },
  backText: {
    color: '#5B8DB8',
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#1E3A5F',
    marginVertical: 20,
  },
  printCard: {
    backgroundColor: '#0F2744',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  printHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  patientQueue: {
    fontSize: 13,
    color: '#5B8DB8',
    marginTop: 2,
  },
  printDivider: {
    height: 1,
    backgroundColor: '#1E3A5F',
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 2.5,
    color: '#5B8DB8',
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  sectionValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 22,
  },
  footer: {
    fontSize: 11,
    color: '#5B8DB8',
    textAlign: 'center',
    marginTop: 12,
  },
  printButton: {
    backgroundColor: '#2471A3',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  printButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  doneButton: {
    backgroundColor: '#1E3A5F',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});