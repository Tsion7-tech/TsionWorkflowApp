import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_TITLE = 'Work Flow Register by Tsion Belay';

const MAIN_ACTIVITIES = [
  'የጤና ተቋሙ ማህደር የተያዙትን የቀደሙ መረጃዎችን ማየት',
  'በቼክ ሊስት መሠረት ቁጥጥር እና ክትትል ማድረግ',
  'የጤና ተቋሙ ባለሙያዎችን ማህደር ማየት',
  'ቼክሊስት በመሙላት ግብረ መልስ ትንተና መስራት',
  'ለተቋሙ ግብረ መልስ በጸሁፍ መስጠት',
];

const SUB_LABELS = ['መጠን', 'ጊዜ', 'ጥራት'];

const YETAAQDE_VALUES = [
  1, 0.5, 100,
  1, 4.5, 100,
  1, 0.17, 100,
  1, 2.5, 100,
  1, 0.33, 100
];

export default function App() {

  const ROW_COUNT = MAIN_ACTIVITIES.length * 3;

  // ---------------- DATE STORAGE ----------------
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const [startTimes, setStartTimes] = useState(Array(ROW_COUNT).fill(''));
  const [endTimes, setEndTimes] = useState(Array(ROW_COUNT).fill(''));

  // ---------------- PASSWORD SYSTEM ----------------
  const [isLocked, setIsLocked] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [storedPassword, setStoredPassword] = useState(null);
  const [resetMode, setResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const loadPassword = async () => {
      const saved = await AsyncStorage.getItem('app-password');
      if (saved) setStoredPassword(saved);
    };
    loadPassword();
  }, []);

  // ---------------- SAVE DAILY DATA ----------------
  const saveData = async () => {
    const data = { startTimes, endTimes };
    await AsyncStorage.setItem(
      workflow-${selectedDate},
      JSON.stringify(data)
    );
  };

  const loadData = async () => {
    const saved = await AsyncStorage.getItem(
      workflow-${selectedDate}
    );

    if (saved) {
      const parsed = JSON.parse(saved);
      setStartTimes(parsed.startTimes || Array(ROW_COUNT).fill(''));
      setEndTimes(parsed.endTimes || Array(ROW_COUNT).fill(''));
    } else {
      setStartTimes(Array(ROW_COUNT).fill(''));
      setEndTimes(Array(ROW_COUNT).fill(''));
    }
  };

  useEffect(() => {
    if (!isLocked) loadData();
  }, [selectedDate, isLocked]);

  useEffect(() => {
    if (!isLocked) saveData();
  }, [startTimes, endTimes]);

  // ---------------- PASSWORD HANDLING ----------------
  const handlePasswordSubmit = async () => {
    if (!storedPassword) {
      await AsyncStorage.setItem('app-password', passwordInput);
      setStoredPassword(passwordInput);
      setIsLocked(false);
    } else {
      if (passwordInput === storedPassword) {
        setIsLocked(false);
      } else {
        Alert.alert('Incorrect Password');
      }
    }
    setPasswordInput('');
  };

  const handleResetPassword = async () => {
    if (passwordInput !== storedPassword) {
      Alert.alert('Current password incorrect');
      return;
    }

    if (!newPassword) {
      Alert.alert('Enter new password');
      return;
    }

    await AsyncStorage.setItem('app-password', newPassword);
    setStoredPassword(newPassword);
    setPasswordInput('');
    setNewPassword('');
    setResetMode(false);
    Alert.alert('Password changed successfully');
  };

  const deletePassword = async () => {
    await AsyncStorage.removeItem('app-password');
    setStoredPassword(null);
    setIsLocked(true);
    setResetMode(false);
    Alert.alert('Password deleted. Set new password.');
  };

  // ---------------- CALCULATIONS ----------------
  const parseTime = (t) => {
    if (!t || !t.includes(':')) return null;
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h + m / 60;
  };

  const calculateRow = (rowIndex) => {
    const subRow = rowIndex % 3;
    const yetaaqde = YETAAQDE_VALUES[rowIndex];

    let workTime = '-';
    let metenPct = '-';
    let timePct = '-';
    let qualityPct = '-';
if (subRow === 1) {
      const start = parseTime(startTimes[rowIndex]);
      const end = parseTime(endTimes[rowIndex]);
      if (start !== null && end !== null) {
        const delta = end - start <= 0 ? end - start + 24 : end - start;
        workTime = delta.toFixed(2);
        timePct = ((yetaaqde / delta) * 100).toFixed(1);
      }
    }

    if (subRow === 0) {
      const val = parseFloat(startTimes[rowIndex]);
      if (!isNaN(val)) {
        metenPct = ((val / yetaaqde) * 100).toFixed(1);
      }
    }

    if (subRow === 2) {
      const val = parseFloat(startTimes[rowIndex]);
      if (!isNaN(val)) {
        qualityPct = ((val / yetaaqde) * 100).toFixed(1);
      }
    }

    return { workTime, metenPct, timePct, qualityPct };
  };

  const calculateActivityAverage = (activityIndex) => {
    const base = activityIndex * 3;
    const m = calculateRow(base).metenPct;
    const t = calculateRow(base + 1).timePct;
    const q = calculateRow(base + 2).qualityPct;

    if (m === '-'  t === '-'  q === '-') return '-';
    return ((+m + +t + +q) / 3).toFixed(1);
  };

  const standardLabel = (avg) => {
    if (avg === '-') return '-';
    if (avg == 100) return 'በእስታንዳርድ';
    if (avg > 100) return 'ከእስታንዳርድ በላይ';
    return 'ከእስታንዳርድ በታች';
  };

  // ---------------- LOCK SCREEN ----------------
  if (isLocked) {
    return (
      <SafeAreaView style={styles.lockContainer}>
        {!resetMode ? (
          <>
            <Text style={styles.lockTitle}>
              {storedPassword ? 'Enter Password' : 'Set New Password'}
            </Text>

            <TextInput
              style={styles.lockInput}
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
              placeholder="Password"
            />

            <Text style={styles.lockButton} onPress={handlePasswordSubmit}>
              {storedPassword ? 'Unlock' : 'Save Password'}
            </Text>

            {storedPassword && (
              <Text
                style={styles.resetLink}
                onPress={() => setResetMode(true)}
              >
                Reset Password
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.lockTitle}>Change Password</Text>

            <TextInput
              style={styles.lockInput}
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
              placeholder="Current Password"
            />

            <TextInput
              style={styles.lockInput}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New Password"
            />

            <Text style={styles.lockButton} onPress={handleResetPassword}>
              Save New Password
            </Text>

            <Text style={styles.resetLink} onPress={deletePassword}>
              Delete Password Completely
            </Text>

            <Text
              style={{ marginTop: 10 }}
              onPress={() => setResetMode(false)}
            >
              Cancel
            </Text>
          </>
        )}
      </SafeAreaView>
    );
  }

  // ---------------- MAIN TABLE ----------------
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{APP_TITLE}</Text>

      <Text style={{ margin: 10 }}>ቀን (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.dateInput}
        value={selectedDate}
        onChangeText={setSelectedDate}
      />

      <Text
        style={{ color: 'red', textAlign: 'right', margin: 10 }}
        onPress={() => setIsLocked(true)}
      >
        🔒 Lock
      </Text>

      <ScrollView horizontal>
        <View>
          {Array.from({ length: ROW_COUNT }, (_, rowIndex) => {
            const activityIndex = Math.floor(rowIndex / 3);
            const subLabel = SUB_LABELS[rowIndex % 3];
            const r = calculateRow(rowIndex);
            const avg = calculateActivityAverage(activityIndex);
return (
              <View key={rowIndex} style={styles.row}>
                <Text style={[styles.cell, { width: 40 }]}>{rowIndex + 1}</Text>
                <Text style={[styles.cell, { width: 300 }]}>
                  {MAIN_ACTIVITIES[activityIndex]} - {subLabel}
                </Text>

                <TextInput
                  style={[styles.cell, { width: 80 }]}
                  value={startTimes[rowIndex]}
                  onChangeText={(t) => {
                    const a = [...startTimes];
                    a[rowIndex] = t;
                    setStartTimes(a);
                  }}
                />

                <TextInput
                  style={[styles.cell, { width: 80 }]}
                  value={endTimes[rowIndex]}
                  onChangeText={(t) => {
                    const a = [...endTimes];
                    a[rowIndex] = t;
                    setEndTimes(a);
                  }}
                />

                <Text style={[styles.cell, { width: 80 }]}>{r.workTime}</Text>
                <Text style={[styles.cell, { width: 80 }]}>{r.metenPct}</Text>
                <Text style={[styles.cell, { width: 80 }]}>{r.timePct}</Text>
                <Text style={[styles.cell, { width: 80 }]}>{r.qualityPct}</Text>
                <Text style={[styles.cell, { width: 80 }]}>
                  {subLabel === 'ጊዜ' ? avg : '-'}
                </Text>
                <Text style={[styles.cell, { width: 100 }]}>
                  {subLabel === 'ጊዜ' ? standardLabel(avg) : '-'}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { textAlign: 'center', fontSize: 18, fontWeight: 'bold', margin: 10 },
  row: { flexDirection: 'row' },
  cell: {
    borderWidth: 0.5,
    padding: 6,
    textAlign: 'center',
  },
  dateInput: {
    borderWidth: 1,
    marginHorizontal: 10,
    padding: 6,
    width: 150,
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockTitle: { fontSize: 18, marginBottom: 10 },
  lockInput: {
    borderWidth: 1,
    width: 200,
    padding: 8,
    marginBottom: 10,
  },
  lockButton: {
    backgroundColor: '#1976d2',
    color: 'white',
    padding: 10,
    width: 200,
    textAlign: 'center',
  },
  resetLink: { marginTop: 15, color: 'red' },
});