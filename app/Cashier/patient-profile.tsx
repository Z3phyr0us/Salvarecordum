import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const FALLBACK_DOCTORS = [
  { id: "d1", name: "Nurse Santos", status: "free" },
  { id: "d2", name: "Nurse Reyes", status: "free" },
  { id: "d3", name: "Nurse Mendoza", status: "busy" },
];

export default function PatientProfile() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const patient = JSON.parse(params.patient as string);
  const windowIndex = Number(params.windowIndex);

  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState(
    patient.status || "waiting",
  );

  useEffect(() => {
    const loadData = async () => {
      // Load visits
      const vData = await AsyncStorage.getItem(`visits_${patient.id}`);
      if (vData) setVisits(JSON.parse(vData));

      // Load doctors — fallback to hardcoded if none in storage
      const dData = await AsyncStorage.getItem("doctors");
      if (dData) {
        const saved = JSON.parse(dData);
        setDoctors(saved.length > 0 ? saved : FALLBACK_DOCTORS);
      } else {
        setDoctors(FALLBACK_DOCTORS);
      }
    };
    loadData();
  }, []);

  // Helper: update patient in AsyncStorage and optionally clear window
  const updatePatientStatus = async (
    newStatus: string,
    clearWindow = false,
  ) => {
    const pData = await AsyncStorage.getItem("patients");
    const all: any[] = pData ? JSON.parse(pData) : [];
    const updated = all.map((p: any) =>
      p.id === patient.id
        ? {
            ...p,
            status: newStatus,
            ...(selectedDoctor ? { assignedDoctor: selectedDoctor } : {}),
          }
        : p,
    );
    await AsyncStorage.setItem("patients", JSON.stringify(updated));

    if (clearWindow) {
      const wData = await AsyncStorage.getItem("windows");
      const windows = wData ? JSON.parse(wData) : [null, null, null];
      windows[windowIndex] = null;
      await AsyncStorage.setItem("windows", JSON.stringify(windows));
    }

    setCurrentStatus(newStatus);
  };

  const handleMarkPaid = async () => {
    if (!selectedDoctor) {
      Alert.alert(
        "Select a Doctor",
        "Please select a free doctor before marking as paid.",
      );
      return;
    }
    await updatePatientStatus("paid", true);
    Alert.alert(
      "Marked as Paid",
      `${patient.name} assigned to ${selectedDoctor.name}.`,
      [{ text: "OK", onPress: () => router.back() }],
    );
  };

  const handleMarkDone = () => {
    Alert.alert("Mark as Done", `Mark ${patient.name} as fully served?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Done",
        onPress: async () => {
          const pData = await AsyncStorage.getItem("patients");
          const all: any[] = pData ? JSON.parse(pData) : [];
          const updated = all.map((p: any) =>
            p.id === patient.id ? { ...p, status: "done" } : p,
          );
          await AsyncStorage.setItem("patients", JSON.stringify(updated));
          const wData = await AsyncStorage.getItem("windows");
          const windows = wData ? JSON.parse(wData) : [null, null, null];
          windows[windowIndex] = null;
          await AsyncStorage.setItem("windows", JSON.stringify(windows));
          setCurrentStatus("done");
          Alert.alert("Done", `${patient.name} has been marked as served.`, [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
      },
    ]);
  };

  const handleRemove = () => {
    Alert.alert("Remove Patient", `Remove ${patient.name} from the queue?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const pData = await AsyncStorage.getItem("patients");
          const all: any[] = pData ? JSON.parse(pData) : [];
          const updated = all.map((p: any) =>
            p.id === patient.id ? { ...p, status: "done" } : p,
          );
          await AsyncStorage.setItem("patients", JSON.stringify(updated));
          const wData = await AsyncStorage.getItem("windows");
          const windows = wData ? JSON.parse(wData) : [null, null, null];
          windows[windowIndex] = null;
          await AsyncStorage.setItem("windows", JSON.stringify(windows));
          router.back();
        },
      },
    ]);
  };

  const statusColor: Record<string, string> = {
    waiting: "#5B8DB8",
    "with-doctor": "#9B59B6",
    paid: "#2ECC71",
    done: "#2ECC71",
  };

  const statusLabel: Record<string, string> = {
    waiting: "Waiting",
    "with-doctor": "With Doctor",
    paid: "Paid",
    done: "Done",
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
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: statusColor[currentStatus] + "22",
                borderColor: statusColor[currentStatus],
              },
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                { color: statusColor[currentStatus] },
              ]}
            >
              {statusLabel[currentStatus] ?? currentStatus}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* QUICK ACTIONS ROW */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickBtn, styles.quickBtnDone]}
          onPress={handleMarkDone}
          activeOpacity={0.85}
        >
          <Text style={styles.quickBtnText}>✓ Mark Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickBtn, styles.quickBtnRemove]}
          onPress={handleRemove}
          activeOpacity={0.85}
        >
          <Text style={styles.quickBtnText}>✕ Remove</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* VISIT HISTORY */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>VISIT HISTORY ({visits.length})</Text>
      </View>

      {visits.length === 0 ? (
        <Text style={styles.emptyText}>No past visits on record.</Text>
      ) : (
        visits.map((visit, i) => (
          <TouchableOpacity
            key={i}
            style={styles.visitCard}
            onPress={() =>
              router.push({
                pathname: "/Nurse/print",
                params: {
                  patient: JSON.stringify(patient),
                  visit: JSON.stringify(visit),
                },
              })
            }
            activeOpacity={0.85}
          >
            <View style={styles.visitCardHeader}>
              <Text style={styles.visitDate}>{visit.date}</Text>
              <Text style={styles.visitPrint}>🖨️ Print</Text>
            </View>
            {visit.diagnosis ? (
              <Text style={styles.visitDetail}>Dx: {visit.diagnosis}</Text>
            ) : null}
            {visit.prescription ? (
              <Text style={styles.visitDetail}>Rx: {visit.prescription}</Text>
            ) : null}
          </TouchableOpacity>
        ))
      )}

      <View style={styles.divider} />

      {/* ASSIGN DOCTOR */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>ASSIGN DOCTOR / NURSE</Text>
      </View>

      {doctors.map((doc) => (
        <TouchableOpacity
          key={doc.id}
          style={[
            styles.doctorRow,
            doc.status === "busy" && styles.doctorBusy,
            selectedDoctor?.id === doc.id && styles.doctorSelected,
          ]}
          onPress={() => {
            if (doc.status === "busy") {
              Alert.alert("Unavailable", `${doc.name} is currently busy.`);
              return;
            }
            setSelectedDoctor(selectedDoctor?.id === doc.id ? null : doc);
          }}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.statusLight,
              {
                backgroundColor: doc.status === "free" ? "#2ECC71" : "#E74C3C",
              },
            ]}
          />
          <Text style={styles.doctorName}>{doc.name}</Text>
          <Text
            style={[
              styles.doctorStatus,
              { color: doc.status === "free" ? "#2ECC71" : "#E74C3C" },
            ]}
          >
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
          !selectedDoctor && styles.paidButtonDisabled,
        ]}
        onPress={handleMarkPaid}
        activeOpacity={0.85}
        disabled={!selectedDoctor}
      >
        <Text style={styles.paidButtonText}>
          {selectedDoctor
            ? `Mark as Paid & Send to ${selectedDoctor.name}`
            : "Mark as Paid & Send to Doctor"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A1931" },
  content: { padding: 24, paddingTop: 52, paddingBottom: 40 },

  backButton: { alignSelf: "flex-start", marginBottom: 20 },
  backText: { color: "#5B8DB8", fontSize: 15, fontWeight: "600" },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2471A3",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
  profileInfo: { flex: 1, gap: 4 },
  patientName: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  patientQueue: { fontSize: 13, color: "#5B8DB8" },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  statusPillText: { fontSize: 12, fontWeight: "700" },

  divider: { height: 1, backgroundColor: "#1E3A5F", marginVertical: 20 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3498DB",
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 2.5,
    color: "#5B8DB8",
    fontWeight: "600",
  },

  // Quick actions
  quickActions: { flexDirection: "row", gap: 10 },
  quickBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  quickBtnDone: { backgroundColor: "#2471A3" },
  quickBtnRemove: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E74C3C",
  },
  quickBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  // Visits
  visitCard: {
    backgroundColor: "#0F2744",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1E3A5F",
  },
  visitCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  visitDate: { fontSize: 12, color: "#5B8DB8", fontWeight: "600" },
  visitPrint: { fontSize: 12, color: "#2471A3", fontWeight: "600" },
  visitDetail: { fontSize: 13, color: "#AED6F1", marginBottom: 2 },
  emptyText: {
    fontSize: 13,
    color: "#2E4F6E",
    fontStyle: "italic",
    marginBottom: 8,
  },

  // Doctors
  doctorRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F2744",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: "#1E3A5F",
  },
  doctorBusy: { opacity: 0.45 },
  doctorSelected: { borderColor: "#2471A3", borderWidth: 2 },
  statusLight: { width: 10, height: 10, borderRadius: 5 },
  doctorName: { fontSize: 15, color: "#FFFFFF", flex: 1, fontWeight: "600" },
  doctorStatus: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  selectedCheck: { color: "#2471A3", fontSize: 18, fontWeight: "700" },

  // Pay button
  paidButton: {
    backgroundColor: "#1E8449",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  paidButtonDisabled: { backgroundColor: "#1E3A5F" },
  paidButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
