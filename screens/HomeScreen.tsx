import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Button, TextInput, Alert, ActivityIndicator, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWallet } from './WalletContext';
import { ethers } from 'ethers';
import ESIM from '../artifacts/contracts/SimCard.sol/ESIM.json';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabParamList, TabWalletParamList } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type HomeScreenNavigationProp = StackNavigationProp<BottomTabParamList, 'Wallet'> & {
  navigate: (screen: 'Wallet', params: TabWalletParamList['WalletScreen']) => void;
};

const CONTRACT_ADDRESS = "0x7948D6AcfCe545549F0C01A15527E2c6A1F8a49a";

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { address, setAddress, setConnected } = useWallet();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [simNumber, setSimNumber] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [loginSimNumber, setLoginSimNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activityLog, setActivityLog] = useState<string[]>([]);

  const addToActivityLog = (message: string) => {
    setActivityLog(prevLog => [...prevLog, message]);
    console.log(message);
  };

  useEffect(() => {
    if (address) {
      checkRegistrationStatus();
    }
  }, [address]);

  const connectWallet = async () => {
    try {
      if (!(window as any).ethereum) {
        Alert.alert('Error', 'MetaMask is not installed');
        return;
      }

      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setAddress(accounts[0]);
      setConnected(true);
      addToActivityLog(`Connected wallet: ${accounts[0]}`);
    } catch (error) {
      console.error('Wallet connection error:', error);
      Alert.alert('Error', 'Failed to connect wallet');
      addToActivityLog('Failed to connect wallet');
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ESIM.abi, provider);
      const user = await contract.users(address);
      setIsRegistered(user.isRegistered);
      if (user.isRegistered) {
        setName(user.name);
        setEmail(user.email);
        setSimNumber(user.simNumber);
        setLoginSimNumber(user.simNumber); // Set the login SIM number
      }
      addToActivityLog('Checked registration status');
    } catch (error) {
      console.error('Error checking registration status:', error);
      addToActivityLog('Error checking registration status');
    }
  };

  const registerUser = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Please enter both name and email');
      return;
    }

    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ESIM.abi, signer);

      const tx = await contract.registerUser(name, email);
      const receipt = await tx.wait();

      const event = receipt.events?.find((event: { event: string }) => event.event === 'UserRegistered');
      if (event) {
        const [userAddress, newSimNumber] = event.args;
        setSimNumber(newSimNumber);
        setIsRegistered(true);
        Alert.alert('Success', `User registered successfully. Your SIM number is ${newSimNumber}`);
        addToActivityLog(`User registered with SIM number: ${newSimNumber}`);
      } else {
        Alert.alert('Error', 'User registered but no SIM number was generated');
        addToActivityLog('User registered but no SIM number was generated');
      }

      checkRegistrationStatus();
    } catch (error) {
      console.error('Registration error:', error);
      if (error.error && error.error.message) {
        Alert.alert('Error', error.error.message);
        addToActivityLog(`Registration error: ${error.error.message}`);
      } else {
        Alert.alert('Error', 'Failed to register user');
        addToActivityLog('Failed to register user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    if (!loginSimNumber) {
      Alert.alert('Error', 'Please enter your SIM number');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ESIM.abi, provider);

      const [userName, userEmail, isRegistered] = await contract.getUserDetails(loginSimNumber);

      if (isRegistered) {
        addToActivityLog('User is registered. Navigating to Wallet...');
        navigation.navigate('Wallet', {
          address: address,
          name: userName,
          email: userEmail,
          simNumber: loginSimNumber
        });
      } else {
        addToActivityLog('User is not registered');
        Alert.alert('Error', 'User not found. Please register first.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to login. Please try again.');
      addToActivityLog('Failed to login. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.title}>E-SIM Home</Text>
          {address ? (
            <>
              <View style={styles.card}>
                <MaterialCommunityIcons name="wallet-outline" size={24} color="#4A90E2" style={styles.icon} />
                <Text style={styles.addressText}>Connected Address:</Text>
                <Text style={styles.addressValue}>{`${address.slice(0, 6)}...${address.slice(-4)}`}</Text>
              </View>
              {!isRegistered ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Register</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor="#A0AEC0"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor="#A0AEC0"
                    keyboardType="email-address"
                  />
                  <TouchableOpacity style={styles.button} onPress={registerUser} disabled={isLoading}>
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buttonText}>Register</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Login</Text>
                  <Text style={styles.simNumberText}>SIM Number: {simNumber}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter SIM Number"
                    value={loginSimNumber}
                    onChangeText={setLoginSimNumber}
                    placeholderTextColor="#A0AEC0"
                  />
                  <TouchableOpacity style={styles.button} onPress={login}>
                    <Text style={styles.buttonText}>Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.card}>
              <TouchableOpacity style={styles.button} onPress={connectWallet}>
                <Text style={styles.buttonText}>Connect Wallet</Text>
              </TouchableOpacity>
            </View>
          )}
          {activityLog.length > 0 && (
            <View style={styles.activityLogCard}>
              <Text style={styles.activityLogTitle}>Activity Log</Text>
              {activityLog.map((log, index) => (
                <Text key={index} style={styles.activityLogText}>{log}</Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffff00',
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 15,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    marginBottom: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    fontSize: 16,
    color: '#2D3748',
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 5,
  },
  addressValue: {
    fontSize: 18,
    color: '#2D3748',
    fontWeight: 'bold',
  },
  simNumberText: {
    fontSize: 16,
    color: '#2D3748',
    marginBottom: 15,
  },
  activityLogCard: {
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    padding: 15,
    width: '100%',
    marginTop: 20,
  },
  activityLogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 10,
  },
  activityLogText: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 5,
  },
});

export default HomeScreen;
