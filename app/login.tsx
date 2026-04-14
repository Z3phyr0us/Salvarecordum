import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    if (email.endsWith('@patient.slvdm')) {
      router.replace('/Patient/HomeScreen');
    } else if (email.endsWith('@cashier.slvdm')) {
      router.replace('/Cashier/dashboard');
    } else if (email.endsWith('@nurse.slvdm')) {
      router.replace('/Nurse/patients');
    } else {
      setError('Unrecognized email domain. Please use a valid @slvdm account.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A1931" />

      {/* LOGO */}
      <View style={styles.logoWrapper}>
        <Image
          source={require('../assets/images/salvareco.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>SALVARECORDUM</Text>
        <Text style={styles.appSub}>Save Records. Save Lives.</Text>
      </View>

      {/* CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sign In</Text>
        <Text style={styles.cardSub}>Use your institutional email to continue</Text>

        {/* EMAIL */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="example@cashier.slvdm"
          placeholderTextColor="#4A6FA5"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* PASSWORD */}
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#4A6FA5"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* ERROR */}
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        {/* BUTTON */}
        <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        {/* HINT */}
        <Text style={styles.hint}>
          @patient.slvdm  @cashier.slvdm  @nurse.slvdm
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1931',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 12,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  appSub: {
    fontSize: 12,
    color: '#5B8DB8',
    letterSpacing: 1,
    marginTop: 4,
  },
  card: {
    width: '100%',
    backgroundColor: '#0F2744',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: '#5B8DB8',
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B8DB8',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0A1931',
    borderWidth: 1,
    borderColor: '#1E3A5F',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  error: {
    color: '#E74C3C',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2471A3',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hint: {
    textAlign: 'center',
    fontSize: 11,
    color: '#2E4F6E',
    letterSpacing: 0.5,
  },
});