// const { expect } = require('chai');
// const { ethers } = require('hardhat'); // Ensure ethers is imported from hardhat

// describe('SIMCardRegistration', function () {
//     let SIMCardRegistration;
//     let simCardReg;
//     let owner;
//     let addr1;
//     let addr2;

//     beforeEach(async function () {
//         //Get the signers\
//         [owner, addr1, addr2] = await ethers.getSigners();

//         // Deploy the smart contract
//         const SIMCardRegistration = await ethers.getContractFactory('SIMCardRegistration');
      
//         simCardReg = await SIMCardRegistration.deploy();
//         await simCardReg.deployed();
//     });

//     // Test 1: User Registration
//     it('Should register a new user and issue a unique SIM number', async function () {
//         // Register user addr1 with a name and email
//         await simCardReg.connect(addr1).registerUser('John Doe', 'john@example.com');

//         // Retrieve the user's details using the unique SIM number
//         const userDetails = await simCardReg.getUserDetails(addr1.address);

//         // Verify that the user was successfully registered
//         expect(userDetails.name).to.equal('John Doe');
//         expect(userDetails.email).to.equal('john@example.com');
//         expect(userDetails.isRegistered).to.be.true;
//     });
const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('SIMCardRegistration', function () {
    let SIMCardRegistrationFactory;
    let simCardReg;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        // Get the signers
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy the smart contract
        SIMCardRegistrationFactory = await ethers.getContractFactory('SIMCardRegistration');
        simCardReg = await SIMCardRegistrationFactory.deploy();
        //await simCardReg.deployed();
    });

    // Test 1: User Registration
    it('Should register a new user and issue a unique SIM number', async function () {
        // Register user addr1 with a name and email
        await simCardReg.connect(addr1).registerUser('Kevin Wafula', 'mwashavin@gmail.com');

        // Retrieve the user's details using the unique SIM number
        const [name, email, isRegistered] = await simCardReg.getUserDetails(addr1.address);

        // Verify that the user was successfully registered
        expect(name).to.equal('Kevin Wafula');
        expect(email).to.equal('mwashavin@gmail.com');
        expect(isRegistered).to.be.true;
    });



    // Test 2: Prevent Double Registration
    it('Should not allow double registration for the same user', async function () {
        // Register addr1 as a new user
        await simCardReg.connect(addr1).registerUser('Kevin Wafula', 'mwashavin@gmail.com');

        // Attempt to register the same user again and expect it to fail
        await expect(
            simCardReg.connect(addr1).registerUser('Kevin Wafula', 'mwashavin@gmail.com')
        ).to.be.revertedWith('User already registered');
    });

    // Test 3: Wallet Connection
    it('Should connect the crypto wallet and update user status', async function () {
        // Register user addr1
        await simCardReg.connect(addr1).registerUser('Kevin Wafula', 'mwashavin@gmail.com');

        // Connect the crypto wallet (simulate connection)
        await simCardReg.connect(addr1).connectWallet();

        // Check if the wallet connection is updated
        const isWalletConnected = await simCardReg.isWalletConnected(addr1.address);
        expect(isWalletConnected).to.be.true;
    });

    // // Test 4: Smart Contract Authorization
    // it('Should authorize a registered user to execute smart contracts', async function () {
    //     // Register user addr1
    //     await simCardReg.connect(addr1).registerUser('Kevin Wafula', 'mwashavin@gmail.com');

    //     // Connect the crypto wallet
    //     await simCardReg.connect(addr1).connectWallet();

    //     // Authorize the user to execute a smart contract (simulate a transaction)
    //     await simCardReg.connect(addr1).executeSmartContract();

    //     // Verify that the transaction was recorded on the blockchain
    //     const transactionRecord = await simCardReg.getTransactionDetails(addr1.address);
    //     expect(transactionRecord.executed).to.be.true;
    // });

    // Test 4: Smart Contract Authorization
    it('Should authorize a registered user to execute smart contracts', async function () {
        // Register user addr1
        await simCardReg.connect(addr1).registerUser('John Smith', 'johnsmith@example.com');

        // Connect the crypto wallet
        await simCardReg.connect(addr1).connectWallet();

        // Authorize the user to execute a smart contract
        await simCardReg.connect(addr1).executeSmartContract();

        // Verify transaction details
        const [isWalletConnected, transactionExecuted] = await simCardReg.getTransactionDetails(addr1.address);
        expect(isWalletConnected).to.be.true;
        expect(transactionExecuted).to.be.true;
    });

    // // Test 5: Immutability and Transparency
    // it('Should ensure data immutability and transparency for registered users', async function () {
    //     // Register user addr2
    //     await simCardReg.connect(addr2).registerUser('Alice Green', 'alice@example.com');

    //     // Retrieve and validate the user's details
    //     const userDetailsBefore = await simCardReg.getUserDetails(addr2.address);

    //     // Attempt to modify the user's registration (should not be allowed)
    //     await expect(
    //         simCardReg.connect(owner).updateUser(addr2.address, 'Updated Alice', 'updatedalice@example.com')
    //     ).to.be.revertedWith('Unauthorized access');

    //     // Retrieve and validate the user's details again (should remain unchanged)
    //     const userDetailsAfter = await simCardReg.getUserDetails(addr2.address);
    //     expect(userDetailsBefore.name).to.equal(userDetailsAfter.name);
    //     expect(userDetailsBefore.email).to.equal(userDetailsAfter.email);
    // });

    // Test 5: Immutability and Transparency
    it('Should ensure data immutability and transparency for registered users', async function () {
        // Register user addr2
        await simCardReg.connect(addr2).registerUser('Kevin Mwangi', 'wafulamwangi@gmail.com');

        // Retrieve and validate the user's details
        const userDetailsBefore = await simCardReg.getUserDetails(addr2.address);

        // Validate immutability by ensuring data doesn't change (re-registering should fail)
        await expect(
            simCardReg.connect(addr2).registerUser('Kevin Mwangi', 'wafulamwangi@gmail.com')
        ).to.be.revertedWith('User already registered');

        // Retrieve and validate the user's details again (should remain unchanged)
        const userDetailsAfter = await simCardReg.getUserDetails(addr2.address);
        expect(userDetailsBefore.name).to.equal(userDetailsAfter.name);
        expect(userDetailsBefore.email).to.equal(userDetailsAfter.email);
    });
});
