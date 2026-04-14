import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CashierDashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [windows, setWindows] = useState<any[]>([null, null, null]);
  const [selectedWindow, setSelectedWindow] = useState<number>(0);

  const loadData = async () => {
    const pData = await AsyncStorage.getItem("patients");
    const wData = await AsyncStorage.getItem("windows");

    let allPatients: any[] = pData ? JSON.parse(pData) : [];

    // Only show active patients in the queue, re-numbered
    const active = allPatients
      .filter((p: any) => p.status !== "done")
      .map((p: any, i: number) => ({ ...p, queue: i + 1 }));

    setPatients(active);

    if (wData) {
      // Sync windows — remove any patient that is now done
      const parsed = JSON.parse(wData);
      const synced = parsed.map((w: any) =>
        w && active.find((p: any) => p.id === w.id) ? w : null,
      );
      setWindows(synced);
    } else {
      setWindows([null, null, null]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const savePatients = async (updated: any[]) => {
    // Merge updated active patients back into full list (preserving done records)
    const pData = await AsyncStorage.getItem("patients");
    const all: any[] = pData ? JSON.parse(pData) : [];
    const merged = all.map((p) => {
      const match = updated.find((u: any) => u.id === p.id);
      return match ? match : p;
    });
    await AsyncStorage.setItem("patients", JSON.stringify(merged));
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userEmail");
    router.replace("/login");
  };

  // Automatically pull the next unassigned waiting patient into the selected window
  const handleNextPatient = async () => {
    const assignedIds = windows.filter(Boolean).map((w: any) => w.id);
    const next = patients.find(
      (p: any) => p.status === "waiting" && !assignedIds.includes(p.id),
    );

    if (!next) {
      Alert.alert("Queue Empty", "No patients waiting in queue.");
      return;
    }

    const updatedWindows = [...windows];
    updatedWindows[selectedWindow] = next;
    await AsyncStorage.setItem("windows", JSON.stringify(updatedWindows));
    setWindows(updatedWindows);
  };

  const handleMarkPaid = async (patient: any) => {
    Alert.alert("Mark as Paid", `Mark ${patient.name} as paid?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark Paid",
        onPress: async () => {
          const updated = patients.map((p: any) =>
            p.id === patient.id ? { ...p, status: "paid" } : p,
          );
          await savePatients(updated);
          // Remove from window if present
          const updatedWindows = windows.map((w: any) =>
            w?.id === patient.id ? null : w,
          );
          await AsyncStorage.setItem("windows", JSON.stringify(updatedWindows));
          setWindows(updatedWindows);
          setPatients(updated);
        },
      },
    ]);
  };

  const handleMarkDone = async (patient: any) => {
    Alert.alert("Mark as Done", `Mark ${patient.name} as done/served?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Done",
        onPress: async () => {
          const pData = await AsyncStorage.getItem("patients");
          const all: any[] = pData ? JSON.parse(pData) : [];
          const merged = all.map((p) =>
            p.id === patient.id ? { ...p, status: "done" } : p,
          );
          await AsyncStorage.setItem("patients", JSON.stringify(merged));
          // Remove from window
          const updatedWindows = windows.map((w: any) =>
            w?.id === patient.id ? null : w,
          );
          await AsyncStorage.setItem("windows", JSON.stringify(updatedWindows));
          setWindows(updatedWindows);
          setPatients(patients.filter((p: any) => p.id !== patient.id));
        },
      },
    ]);
  };

  const handleSendToDoctor = async (patient: any) => {
    Alert.alert("Send to Doctor", `Send ${patient.name} to the doctor?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send",
        onPress: async () => {
          const updated = patients.map((p: any) =>
            p.id === patient.id ? { ...p, status: "with-doctor" } : p,
          );
          await savePatients(updated);
          setPatients(updated);
        },
      },
    ]);
  };

  const handleRemove = async (patient: any) => {
    Alert.alert("Remove Patient", `Remove ${patient.name} from the queue?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const pData = await AsyncStorage.getItem("patients");
          const all: any[] = pData ? JSON.parse(pData) : [];
          const merged = all.map((p) =>
            p.id === patient.id ? { ...p, status: "done" } : p,
          );
          await AsyncStorage.setItem("patients", JSON.stringify(merged));
          const updatedWindows = windows.map((w: any) =>
            w?.id === patient.id ? null : w,
          );
          await AsyncStorage.setItem("windows", JSON.stringify(updatedWindows));
          setWindows(updatedWindows);
          setPatients(patients.filter((p: any) => p.id !== patient.id));
        },
      },
    ]);
  };

  const windowConfig = [
    { label: "Window 1", accent: "#2980B9", dot: "#3498DB" },
    { label: "Window 2", accent: "#27AE60", dot: "#2ECC71" },
    { label: "Window 3", accent: "#D4AC0D", dot: "#F1C40F" },
  ];

  const waitingPatients = patients.filter((p) => p.status === "waiting");
  const withDoctorPatients = patients.filter((p) => p.status === "with-doctor");
  const paidPatients = patients.filter((p) => p.status === "paid");
  const currentPatient = windows[selectedWindow];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1931" />

      {/* HEADER */}
      <Text style={styles.headerSub}>SALVARECORDUM</Text>
      <Text style={styles.headerTitle}>Cashier Dashboard</Text>

      <View style={styles.divider} />

      {/* STATS ROW */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{waitingPatients.length}</Text>
          <Text style={styles.statLabel}>Waiting</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: "#9B59B6" }]}>
            {withDoctorPatients.length}
          </Text>
          <Text style={styles.statLabel}>With Doctor</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: "#2ECC71" }]}>
            {paidPatients.length}
          </Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: "#5B8DB8" }]}>
            {patients.length}
          </Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

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
              },
            ]}
            onPress={() => setSelectedWindow(i)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.windowDot,
                {
                  backgroundColor: windows[i] ? win.dot : "#2E4F6E",
                },
              ]}
            />
            <Text
              style={[
                styles.windowTabText,
                selectedWindow === i && { color: "#FFFFFF" },
              ]}
            >
              {win.label}
            </Text>
            {windows[i] && (
              <View style={styles.windowOccupiedBadge}>
                <Text style={styles.windowOccupiedText}>●</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* CURRENT WINDOW CARD */}
      <View
        style={[
          styles.currentWindowCard,
          { borderLeftColor: windowConfig[selectedWindow].accent },
        ]}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.cardDot,
              { backgroundColor: windowConfig[selectedWindow].dot },
            ]}
          />
          <Text
            style={[
              styles.cardLabel,
              { color: windowConfig[selectedWindow].accent },
            ]}
          >
            {windowConfig[selectedWindow].label} — Now Serving
          </Text>
        </View>

        {currentPatient ? (
          <>
            <Text style={styles.cardPatient}>{currentPatient.name}</Text>
            <Text style={styles.cardQueue}>Queue #{currentPatient.queue}</Text>

            {/* STATUS BADGE */}
            <View
              style={[
                styles.statusBadge,
                currentPatient.status === "with-doctor"
                  ? styles.statusDoctor
                  : currentPatient.status === "paid"
                    ? styles.statusPaid
                    : styles.statusWaiting,
              ]}
            >
              <Text style={styles.statusText}>
                {currentPatient.status === "with-doctor"
                  ? "With Doctor"
                  : currentPatient.status === "paid"
                    ? "Paid"
                    : "Waiting"}
              </Text>
            </View>

            {/* ACTION BUTTONS */}
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  router.push({
                    pathname: "/Cashier/patient-profile",
                    params: {
                      patient: JSON.stringify(currentPatient),
                      windowIndex: selectedWindow,
                    },
                  })
                }
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDoctor]}
                onPress={() => handleSendToDoctor(currentPatient)}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>Doctor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPaid]}
                onPress={() => handleMarkPaid(currentPatient)}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>Paid</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDone]}
                onPress={() => handleMarkDone(currentPatient)}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(currentPatient)}
              activeOpacity={0.85}
            >
              <Text style={styles.removeBtnText}>Remove from Queue</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.cardPatientEmpty}>— No patient assigned —</Text>
        )}

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextPatient}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>Next Patient →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* WAITING QUEUE */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionDot} />
        <Text style={styles.sectionLabel}>
          WAITING ({waitingPatients.length})
        </Text>
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
              onPress={() =>
                router.push({
                  pathname: "/Cashier/patient-profile",
                  params: {
                    patient: JSON.stringify(item),
                    windowIndex: selectedWindow,
                  },
                })
              }
              activeOpacity={0.85}
            >
              <View style={styles.queueBadge}>
                <Text style={styles.queueNumber}>{item.queue}</Text>
              </View>
              <Text style={styles.queueName}>{item.name}</Text>
              <Text style={styles.queueArrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* WITH DOCTOR */}
      {withDoctorPatients.length > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.sectionRow}>
            <View style={[styles.sectionDot, { backgroundColor: "#9B59B6" }]} />
            <Text style={styles.sectionLabel}>
              WITH DOCTOR ({withDoctorPatients.length})
            </Text>
          </View>
          <FlatList
            data={withDoctorPatients}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.queueItem,
                  { borderLeftWidth: 3, borderLeftColor: "#9B59B6" },
                ]}
              >
                <View
                  style={[styles.queueBadge, { backgroundColor: "#6C3483" }]}
                >
                  <Text style={styles.queueNumber}>{item.queue}</Text>
                </View>
                <Text style={styles.queueName}>{item.name}</Text>
                <View style={styles.doctorBadge}>
                  <Text style={styles.doctorBadgeText}>🩺</Text>
                </View>
              </View>
            )}
          />
        </>
      )}

      {/* PAID */}
      {paidPatients.length > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.sectionRow}>
            <View style={[styles.sectionDot, { backgroundColor: "#2ECC71" }]} />
            <Text style={styles.sectionLabel}>
              PAID ({paidPatients.length})
            </Text>
          </View>
          <FlatList
            data={paidPatients}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={[styles.queueItem, { opacity: 0.6 }]}>
                <View
                  style={[styles.queueBadge, { backgroundColor: "#1E8449" }]}
                >
                  <Text style={styles.queueNumber}>{item.queue}</Text>
                </View>
                <Text style={styles.queueName}>{item.name}</Text>
                <View style={styles.paidBadge}>
                  <Text style={styles.paidBadgeText}>PAID</Text>
                </View>
              </View>
            )}
          />
        </>
      )}

      <View style={styles.divider} />

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
  container: { flex: 1, backgroundColor: "#0A1931" },
  content: { padding: 24, paddingTop: 52, paddingBottom: 40 },
  headerSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "#5B8DB8",
    letterSpacing: 3,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
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

  // Stats
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: "#0F2744",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E3A5F",
  },
  statNumber: { fontSize: 26, fontWeight: "700", color: "#E67E22" },
  statLabel: {
    fontSize: 10,
    color: "#5B8DB8",
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 1,
  },
  // Window selector
  windowSelector: { flexDirection: "row", gap: 8, marginBottom: 16 },
  windowTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 6,
  },
  windowDot: { width: 7, height: 7, borderRadius: 4 },
  windowTabText: { fontSize: 12, fontWeight: "600", color: "#5B8DB8" },
  windowOccupiedBadge: { position: "absolute", top: 4, right: 6 },
  windowOccupiedText: { fontSize: 8, color: "#2ECC71" },

  // Current window card
  currentWindowCard: {
    backgroundColor: "#0F2744",
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardDot: { width: 8, height: 8, borderRadius: 4 },
  cardLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 1.5 },
  cardPatient: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  cardPatientEmpty: {
    color: "#2E4F6E",
    fontStyle: "italic",
    fontWeight: "400",
    fontSize: 17,
    marginBottom: 12,
  },
  cardQueue: { fontSize: 12, color: "#5B8DB8", marginBottom: 10 },

  // Status badge
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 14,
  },
  statusWaiting: { backgroundColor: "#1E3A5F" },
  statusDoctor: { backgroundColor: "#6C3483" },
  statusPaid: { backgroundColor: "#1E8449" },
  statusText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },

  // Action buttons
  actionGrid: { flexDirection: "row", gap: 8, marginBottom: 10 },
  actionBtn: {
    flex: 1,
    backgroundColor: "#1E3A5F",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionBtnDoctor: { backgroundColor: "#6C3483" },
  actionBtnPaid: { backgroundColor: "#1E8449" },
  actionBtnDone: { backgroundColor: "#2471A3" },
  actionBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },

  removeBtn: {
    borderWidth: 1,
    borderColor: "#E74C3C",
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
    marginBottom: 14,
  },
  removeBtnText: { color: "#E74C3C", fontSize: 13, fontWeight: "600" },

  nextButton: {
    backgroundColor: "#2471A3",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  nextButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  // Queue list
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F2744",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  queueBadge: {
    backgroundColor: "#2471A3",
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  queueNumber: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  queueName: { fontSize: 15, color: "#FFFFFF", flex: 1 },
  queueArrow: { fontSize: 20, color: "#2E4F6E" },

  doctorBadge: {
    backgroundColor: "#6C3483",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doctorBadgeText: { fontSize: 13 },

  paidBadge: {
    backgroundColor: "#1E8449",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paidBadgeText: { fontSize: 11, color: "#FFFFFF", fontWeight: "700" },

  emptyText: {
    fontSize: 13,
    color: "#2E4F6E",
    fontStyle: "italic",
    marginBottom: 8,
  },

  logoutButton: {
    backgroundColor: "#E74C3C",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
