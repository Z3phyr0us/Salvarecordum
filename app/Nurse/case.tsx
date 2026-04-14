import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ScrollView, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

export default function CaseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const patient = JSON.parse(params.patient as string);

  // Vitals
  const [bp, setBp] = useState('');
  const [temp, setTemp] = useState('');
  const [weight, setWeight] = useState('');
  const [heartRate, setHeartRate] = useState('');

  // Consultation fields
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [lastVisit, setLastVisit] = useState<any>(null);
  const [showLastVisit, setShowLastVisit] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Load last visit for reference
      const vData = await AsyncStorage.getItem(`visits_${patient.id}`);
      if (vData) {
        const visits = JSON.parse(vData);
        if (visits.length > 0) setLastVisit(visits[visits.length - 1]);
      }

      // Load draft if one exists
      const draftData = await AsyncStorage.getItem(`draft_${patient.id}`);
      if (draftData) {
        const d = JSON.parse(draftData);
        setBp(d.bp || '');
        setTemp(d.temp || '');
        setWeight(d.weight || '');
        setHeartRate(d.heartRate || '');
        setSymptoms(d.symptoms || '');
        setDiagnosis(d.diagnosis || '');
        setPrescription(d.prescription || '');
        setNotes(d.notes || '');
        setIsDraft(true);
      }
    };
    loadData();
  }, []);

  const buildVisit = () => ({
    date: new Date().toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric'
    }),
    vitals: { bp, temp, weight, heartRate },
    symptoms,
    diagnosis,
    prescription,
    notes,
  });

  const handleSaveDraft = async () => {
    await AsyncStorage.setItem(`draft_${patient.id}`, JSON.stringify(buildVisit()));
    setIsDraft(true);
    Alert.alert('Draft Saved', 'Your notes have been saved as a draft.');
  };

  const handleSaveAndPrint = async () => {
    if (!symptoms.trim() && !diagnosis.trim()) {
      Alert.alert('Missing Info', 'Please enter at least symptoms or a diagnosis.');
      return;
    }

    Alert.alert(
      'Confirm Save',
      `Save consultation record for ${patient.name} and proceed to print?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save & Print',
          onPress: async () => {
            setSaving(true);
            const visit = buildVisit();

            // Save to visit history (keyed by patient ID)
            const vData = await AsyncStorage.getItem(`visits_${patient.id}`);
            const existing = vData ? JSON.parse(vData) : [];
            await AsyncStorage.setItem(
              `visits_${patient.id}`,
              JSON.stringify([...existing, visit])
            );

            // Mark patient as done
            const pData = await AsyncStorage.getItem('patients');
            const patients = pData ? JSON.parse(pData) : [];
            const updated = patients.map((p: any) =>
              p.id === patient.id ? { ...p, status: 'done' } : p
            );
            await AsyncStorage.setItem('patients', JSON.stringify(updated));

            // Clear draft
            await AsyncStorage.removeItem(`draft_${patient.id}`);

            setSaving(false);
            router.push({
              pathname: '/Nurse/print',
              params: {
                patient: JSON.stringify(patient),
                visit: JSON.stringify(visit),
              }
            });
          }
        }
      ]
    );
  };

  const handleMarkDone = () => {
    Alert.alert(
      'Mark as Done',
      `Mark ${patient.name} as done without saving a record?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Done',
          style: 'destructive',
          onPress: async () => {
            const pData = await AsyncStorage.getItem('patients');
            const patients = pData ? JSON.parse(pData) : [];
            const updated = patients.map((p: any) =>
              p.id === patient.id ? { ...p, status: 'done' } : p
            );
            await AsyncStorage.setItem('patients', JSON.stringify(updated));
            await AsyncStorage.removeItem(`draft_${patient.id}`);
            router.back();
          }
        }
      ]
    );
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
        <View style={styles.profileInfo}>
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.patientQueue}>Queue #{patient.queue}</Text>
          {isDraft && (
            <View style={styles.draftBadge}>
              <Text style={styles.draftBadgeText}>● Draft saved</Text>
            </View>
          )}
        </View>
      </View>

      {/* LAST VISIT SUMMARY */}
      {lastVisit && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.lastVisitHeader}
            onPress={() => setShowLastVisit(v => !v)}
            activeOpacity={0.8}
          >
            <View style={styles.sectionRow}>
              <View style={[styles.sectionDot, { backgroundColor: '#9B59B6' }]} />
              <Text style={styles.sectionLabel}>LAST VISIT — {lastVisit.date}</Text>
            </View>
            <Text style={styles.toggleText}>{showLastVisit ? '▲ Hide' : '▼ Show'}</Text>
          </TouchableOpacity>

          {showLastVisit && (
            <View style={styles.lastVisitCard}>
              {lastVisit.vitals?.bp ? <Text style={styles.lastVisitRow}>🩺 BP: {lastVisit.vitals.bp}</Text> : null}
              {lastVisit.vitals?.temp ? <Text style={styles.lastVisitRow}>🌡 Temp: {lastVisit.vitals.temp}°C</Text> : null}
              {lastVisit.symptoms ? <Text style={styles.lastVisitRow}>Symptoms: {lastVisit.symptoms}</Text> : null}
              {lastVisit.diagnosis ? <Text style={styles.lastVisitRow}>Dx: {lastVisit.diagnosis}</Text> : null}
              {lastVisit.prescription ? <Text style={styles.lastVisitRow}>Rx: {lastVisit.prescription}</Text> : null}
            </View>
          )}
        </>
      )}

      <View style={styles.divider} />

      {/* VITALS */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>VITAL SIGNS</Text>
      </View>

      <View style={styles.vitalsGrid}>
        <View style={styles.vitalField}>
          <Text style={styles.vitalLabel}>Blood Pressure</Text>
          <TextInput
            style={styles.vitalInput}
            placeholder="120/80"
            placeholderTextColor="#2E4F6E"
            value={bp}
            onChangeText={setBp}
          />
          <Text style={styles.vitalUnit}>mmHg</Text>
        </View>
        <View style={styles.vitalField}>
          <Text style={styles.vitalLabel}>Temperature</Text>
          <TextInput
            style={styles.vitalInput}
            placeholder="36.5"
            placeholderTextColor="#2E4F6E"
            value={temp}
            onChangeText={setTemp}
            keyboardType="decimal-pad"
          />
          <Text style={styles.vitalUnit}>°C</Text>
        </View>
        <View style={styles.vitalField}>
          <Text style={styles.vitalLabel}>Weight</Text>
          <TextInput
            style={styles.vitalInput}
            placeholder="60"
            placeholderTextColor="#2E4F6E"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />
          <Text style={styles.vitalUnit}>kg</Text>
        </View>
        <View style={styles.vitalField}>
          <Text style={styles.vitalLabel}>Heart Rate</Text>
          <TextInput
            style={styles.vitalInput}
            placeholder="75"
            placeholderTextColor="#2E4F6E"
            value={heartRate}
            onChangeText={setHeartRate}
            keyboardType="number-pad"
          />
          <Text style={styles.vitalUnit}>bpm</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* CONSULTATION NOTES */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>CONSULTATION NOTES</Text>
      </View>

      <Text style={styles.label}>Symptoms <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Describe patient symptoms..."
        placeholderTextColor="#2E4F6E"
        value={symptoms}
        onChangeText={setSymptoms}
        multiline
        numberOfLines={3}
      />
      <Text style={styles.charCount}>{symptoms.length} chars</Text>

      <Text style={styles.label}>Diagnosis <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Enter diagnosis..."
        placeholderTextColor="#2E4F6E"
        value={diagnosis}
        onChangeText={setDiagnosis}
        multiline
        numberOfLines={3}
      />
      <Text style={styles.charCount}>{diagnosis.length} chars</Text>

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
        placeholder="Follow-up instructions, referrals..."
        placeholderTextColor="#2E4F6E"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      <View style={styles.divider} />

      {/* ACTION BUTTONS */}
      <TouchableOpacity
        style={styles.printButton}
        onPress={handleSaveAndPrint}
        disabled={saving}
        activeOpacity={0.85}
      >
        <Text style={styles.printButtonText}>
          {saving ? 'Saving...' : '🖨️ Save & Proceed to Print'}
        </Text>
      </TouchableOpacity>

      <View style={styles.secondaryRow}>
        <TouchableOpacity
          style={styles.draftButton}
          onPress={handleSaveDraft}
          activeOpacity={0.85}
        >
          <Text style={styles.draftButtonText}>💾 Save Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleMarkDone}
          activeOpacity={0.85}
        >
          <Text style={styles.doneButtonText}>✓ Mark Done</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1931' },
  content: { padding: 24, paddingTop: 52, paddingBottom: 40 },

  backButton: { marginBottom: 20 },
  backText: { color: '#5B8DB8', fontSize: 15, fontWeight: '600' },

  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#2471A3', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: '#FFFFFF' },
  profileInfo: { flex: 1, gap: 4 },
  patientName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  patientQueue: { fontSize: 13, color: '#5B8DB8' },
  draftBadge: {
    alignSelf: 'flex-start', backgroundColor: '#1E3A5F',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2,
  },
  draftBadgeText: { fontSize: 11, color: '#F1C40F', fontWeight: '600' },

  // Last visit
  lastVisitHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  toggleText: { fontSize: 12, color: '#5B8DB8', fontWeight: '600' },
  lastVisitCard: {
    backgroundColor: '#0F2744', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#2E1A47', marginTop: 8, gap: 4,
  },
  lastVisitRow: { fontSize: 13, color: '#C39BD3', lineHeight: 20 },

  divider: { height: 1, backgroundColor: '#1E3A5F', marginVertical: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3498DB' },
  sectionLabel: { fontSize: 11, letterSpacing: 2.5, color: '#5B8DB8', fontWeight: '600' },

  // Vitals grid
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vitalField: {
    width: '47%', backgroundColor: '#0F2744', borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: '#1E3A5F',
  },
  vitalLabel: { fontSize: 10, color: '#5B8DB8', fontWeight: '600', letterSpacing: 1, marginBottom: 6 },
  vitalInput: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', padding: 0 },
  vitalUnit: { fontSize: 11, color: '#2E4F6E', marginTop: 4 },

  // Form fields
  label: { fontSize: 12, fontWeight: '600', color: '#5B8DB8', letterSpacing: 1, marginBottom: 6 },
  required: { color: '#E74C3C' },
  input: {
    backgroundColor: '#0F2744', borderWidth: 1, borderColor: '#1E3A5F',
    borderRadius: 10, padding: 14, fontSize: 15, color: '#FFFFFF',
    marginBottom: 4,
  },
  multiline: { textAlignVertical: 'top', minHeight: 88 },
  charCount: { fontSize: 10, color: '#2E4F6E', textAlign: 'right', marginBottom: 12 },

  // Buttons
  printButton: {
    backgroundColor: '#2471A3', borderRadius: 10,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  printButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  secondaryRow: { flexDirection: 'row', gap: 10 },
  draftButton: {
    flex: 1, backgroundColor: '#1E3A5F', borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
  },
  draftButtonText: { color: '#AED6F1', fontSize: 14, fontWeight: '700' },
  doneButton: {
    flex: 1, borderWidth: 1, borderColor: '#2ECC71',
    borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  doneButtonText: { color: '#2ECC71', fontSize: 14, fontWeight: '700' },
});