import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ethers } from 'ethers';
import { useWallet } from './WalletContext';
import { useNavigation } from '@react-navigation/native';
import ESIM from '../artifacts/contracts/SimCard.sol/ESIM.json';

const CONTRACT_ADDRESS = "0x7948D6AcfCe545549F0C01A15527E2c6A1F8a49a";

const ProfileScreen = () => {
  const { address, disconnect } = useWallet();
  const navigation = useNavigation();
  const [userDetails, setUserDetails] = useState({ name: '', email: '', simNumber: '' });
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [error, setError] = useState(''); // State variable for error message

  useEffect(() => {
    fetchUserDetails();
  }, [address]);

  const fetchUserDetails = async () => {
    try {
      if (!(window as any).ethereum) {
        Alert.alert('Error', 'MetaMask is not installed');
        return;
      }

      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ESIM.abi, provider);

      const user = await contract.users(address);
      setUserDetails({
        name: user.name,
        email: user.email,
        simNumber: user.simNumber
      });
      setEditedName(user.name);
      setEditedEmail(user.email);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to fetch user details'); // Set error message
    }
  };

  const updateUserDetails = async () => {
    try {
      if (!(window as any).ethereum) {
        Alert.alert('Error', 'MetaMask is not installed');
        return;
      }

      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ESIM.abi, signer);

      const tx = await contract.updateUser(editedName, editedEmail);
      await tx.wait();

      setUserDetails(prevDetails => ({
        ...prevDetails,
        name: editedName,
        email: editedEmail
      }));

      setEditMode(false);
      Alert.alert('Success', 'User details updated successfully');
    } catch (error) {
      console.error('Error updating user details:', error);
      setError('Failed to update user details'); // Set error message
    }
  };

  const deleteAccount = async () => {
    console.log('Delete account function called');
    console.log('Current user details:', userDetails);

    try {
      console.log('Checking for ethereum object');
      if (!(window as any).ethereum) {
        console.error('MetaMask not detected');
        Alert.alert('Error', 'MetaMask is not installed');
        return;
      }

      console.log('Initializing Web3Provider');
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      
      console.log('Requesting account access');
      await provider.send("eth_requestAccounts", []);
      
      console.log('Getting signer');
      const signer = provider.getSigner();
      
      console.log('Getting signer address');
      const signerAddress = await signer.getAddress();
      console.log('Signer address:', signerAddress);

      console.log('Initializing contract');
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ESIM.abi, signer);
      
      console.log('Checking if contract method exists');
      if (typeof contract.deleteAccount !== 'function') {
        console.error('deleteAccount method not found in contract ABI');
        Alert.alert('Error', 'Contract method not found. Please check the contract ABI.');
        return;
      }

      console.log('Calling deleteAccount method with SIM number:', userDetails.simNumber);
      const tx = await contract.deleteAccount(userDetails.simNumber);
      console.log('Transaction sent:', tx.hash);
      
      console.log('Waiting for transaction confirmation');
      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);

      if (receipt.status === 1) {
        console.log('Account deleted successfully');
        Alert.alert('Success', 'Your account has been deleted');
        disconnect();
        navigation.navigate('WalletConnect');
      } else {
        console.error('Transaction failed');
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error in deleteAccount function:', error);
      let errorMessage = 'Failed to delete account. ';
      if (error.message.includes('User not registered')) {
        errorMessage += 'User is not registered.';
      } else if (error.message.includes('SIM number does not match')) {
        errorMessage += 'SIM number does not match the registered number.';
      } else if (error.message.includes('Balance must be zero')) {
        errorMessage += 'Your balance must be zero to delete the account.';
      } else if (error.message.includes('user rejected transaction')) {
        errorMessage += 'Transaction was rejected in MetaMask.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage += 'Insufficient funds for gas.';
      } else {
        errorMessage += 'Error: ' + error.message;
      }
      console.error('Detailed error:', errorMessage);
      setError(errorMessage); // Set error message
    }
  };

  const renderEditButton = () => (
    <TouchableOpacity 
      style={[styles.editButton, editMode && styles.editButtonActive]} 
      onPress={() => setEditMode(!editMode)}
    >
      <MaterialCommunityIcons 
        name={editMode ? "check" : "account-edit"} 
        size={24} 
        color={editMode ? "#FFFFFF" : "#4A90E2"} 
      />
    </TouchableOpacity>
  );

  const renderUserInfo = () => (
    <View style={styles.infoContainer}>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Name:</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={editedName}
            onChangeText={setEditedName}
            placeholder="Enter your name"
          />
        ) : (
          <Text style={styles.infoValue}>{userDetails.name}</Text>
        )}
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Email:</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={editedEmail}
            onChangeText={setEditedEmail}
            keyboardType="email-address"
            placeholder="Enter your email"
          />
        ) : (
          <Text style={styles.infoValue}>{userDetails.email}</Text>
        )}
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>SIM Number:</Text>
        <Text style={styles.infoValue}>{userDetails.simNumber}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Wallet Address:</Text>
        <Text style={styles.infoValue}>{address.slice(0, 6)}...{address.slice(-4)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{editMode ? "Edit Profile" : "Profile"}</Text>
          {renderEditButton()}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null} {/* Render error message */}
        <View style={[styles.profileSection, editMode && styles.profileSectionEditing]}>
          <View style={[styles.avatarContainer, editMode && styles.avatarContainerEditing]}>
            <Text style={styles.avatarText}>{userDetails.name.charAt(0).toUpperCase()}</Text>
          </View>
          {renderUserInfo()}
        </View>
        <View style={styles.actionSection}>
          {editMode ? (
            <TouchableOpacity style={styles.actionButton} onPress={updateUserDetails}>
              <Text style={styles.actionText}>Save Changes</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={disconnect}>
                <Text style={styles.actionText}>Log Out</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={deleteAccount}>
                <Text style={styles.actionText}>Delete SimCard Account</Text>
              </TouchableOpacity>
            </>
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
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    marginTop: 10,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  editButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  editButtonActive: {
    backgroundColor: '#4A90E2',
  },
  profileSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileSectionEditing: {
    backgroundColor: '#F0F8FF', // Light blue background when editing
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  avatarContainerEditing: {
    backgroundColor: '#3A7BD5', // Darker blue when editing
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoContainer: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    width: '30%',
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A2E',
    width: '70%',
    textAlign: 'right',
  },
  input: {
    fontSize: 16,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderRadius: 5,
    padding: 8,
    width: '70%',
  },
  actionSection: {
    padding: 20,
    marginTop: 20,
  },
  actionButton: {
    padding: 15,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default ProfileScreen;
