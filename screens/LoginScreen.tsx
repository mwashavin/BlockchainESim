import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useWallet } from './WalletContext';
import { ethers } from 'ethers';
import ESIM from '../artifacts/contracts/SimCard.sol/ESIM.json';

const CONTRACT_ADDRESS = "0x7948D6AcfCe545549F0C01A15527E2c6A1F8a49a";

const LoginScreen: React.FC = ({ route, navigation }) => {
  const { address } = useWallet();
  const [simNumber, setSimNumber] = useState(route.params?.simNumber || '');

  const login = async () => {
    if (!simNumber) {
      Alert.alert('Error', 'Please enter your SIM number');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ESIM.abi, provider);

      const [name, email] = await contract.getUserDetails(simNumber);

      if (name && email) {
        Alert.alert('Success', `Welcome back, ${name}!`, [
          { text: 'OK', onPress: () => navigation.navigate('Dashboard', { name, email, simNumber }) }
        ]);
      } else {
        Alert.alert('Error', 'User not found');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to login. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login with SIM Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter SIM Number"
        value={simNumber}
        onChangeText={setSimNumber}
      />
      <Button title="Login" onPress={login} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
});

export default LoginScreen;