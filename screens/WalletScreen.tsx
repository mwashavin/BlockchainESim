import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ethers } from 'ethers';
import ESIM from '../artifacts/contracts/SimCard.sol/ESIM.json';

const CONTRACT_ADDRESS = "0x7948D6AcfCe545549F0C01A15527E2c6A1F8a49a";
const ETH_TO_KES_RATE = 150000; // 1 ETH = 150,000 KES (example rate)

type RouteParams = {
  address: string;
  name: string;
  email: string;
  simNumber: string;
};

const WalletScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { address, name, email, simNumber } = route.params as RouteParams;

  const [balanceETH, setBalanceETH] = useState('0.00');
  const [balanceKES, setBalanceKES] = useState('0.00');
  const [depositAmount, setDepositAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(true);

  useEffect(() => {
    checkRegistrationAndFetchBalance();
  }, []);

  const checkRegistrationAndFetchBalance = async () => {
    try {
      setIsLoading(true);
      if (!(window as any).ethereum) {
        Alert.alert('Error', 'MetaMask is not installed');
        return;
      }

      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ESIM.abi, provider);

      try {
        const [userName, userEmail, isUserRegistered, userBalance] = await contract.getUserDetails(simNumber);
        if (isUserRegistered) {
          const balanceEth = ethers.utils.formatEther(userBalance);
          setBalanceETH(parseFloat(balanceEth).toFixed(4));
          setBalanceKES((parseFloat(balanceEth) * ETH_TO_KES_RATE).toFixed(2));
          setIsRegistered(true);
        } else {
          setIsRegistered(false);
          Alert.alert(
            "Not Registered",
            "This SIM number is not registered. Would you like to register now?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Register", onPress: () => navigation.navigate('RegisterScreen', { simNumber }) }
            ]
          );
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        setIsRegistered(false);
        Alert.alert('Error', 'Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error checking registration and fetching balance:', error);
      Alert.alert('Error', 'Failed to connect to the network');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!isRegistered) {
      Alert.alert('Error', 'Please register before making a deposit');
      return;
    }
    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid deposit amount');
      return;
    }
    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ESIM.abi, signer);

      const depositWei = ethers.utils.parseEther(depositAmount);
      const tx = await contract.deposit(depositWei, { value: depositWei });
      
      console.log('Deposit transaction sent:', tx.hash);
      await tx.wait();
      
      console.log('Deposit transaction confirmed');
      Alert.alert('Success', 'Deposit successful');
      
      setDepositAmount('');
      checkRegistrationAndFetchBalance();
    } catch (error) {
      console.error('Error depositing funds:', error);
      Alert.alert('Error', 'Failed to deposit funds');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Sim Wallet</Text>
          <View style={styles.addressContainer}>
            <MaterialCommunityIcons name="wallet-outline" size={20} color="#4A90E2" />
            <Text style={styles.addressText}>{address.slice(0, 6)}...{address.slice(-4)}</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{balanceETH} ETH</Text>
          <Text style={styles.balanceFiat}>KES {balanceKES}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={checkRegistrationAndFetchBalance} disabled={isLoading}>
            <MaterialCommunityIcons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.userDetailsSection}>
          <Text style={styles.sectionTitle}>User Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>{name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SIM Number:</Text>
            <Text style={styles.detailValue}>{simNumber}</Text>
          </View>
        </View>

        

        <View style={styles.depositSection}>
          <Text style={styles.sectionTitle}>Deposit Funds</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount in ETH"
            value={depositAmount}
            onChangeText={setDepositAmount}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.depositButton} onPress={handleDeposit} disabled={isLoading}>
            <Text style={styles.depositButtonText}>Deposit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Info', 'Send functionality not implemented')}>
            <MaterialCommunityIcons name="send" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Info', 'Receive functionality not implemented')}>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Receive</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4A90E2" />
          </View>
        )}
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
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 10,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#4A90E2',
  },
  balanceCard: {
    backgroundColor: '#4A90E2',
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  balanceTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: 10,
  },
  balanceFiat: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  refreshButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  userDetailsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  depositSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  depositButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  depositButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  
});

export default WalletScreen;