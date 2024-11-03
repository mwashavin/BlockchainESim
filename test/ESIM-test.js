const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ESIM Contract", function () {
    let ESIM, esim, owner, addr1, addr2;

    beforeEach(async function () {
        ESIM = await ethers.getContractFactory("ESIM");
        esim = await ESIM.deploy();
        await esim.deployed();

        [owner, addr1, addr2] = await ethers.getSigners();
    });

    describe("User Registration", function () {
        it("should register a new user", async function () {
            await esim.connect(addr1).registerUser("Alice", "alice@example.com");
            const userDetails = await esim.getUserDetails((await esim.users(addr1.address)).simNumber);

            expect(userDetails[0]).to.equal("Alice");
            expect(userDetails[1]).to.equal("alice@example.com");
            expect(userDetails[2]).to.be.true;
            expect(userDetails[3]).to.equal(0);
        });

        it("should prevent duplicate registration", async function () {
            await esim.connect(addr1).registerUser("Alice", "alice@example.com");
            await expect(esim.connect(addr1).registerUser("Alice", "alice@example.com"))
                .to.be.revertedWith("User already registered");
        });

        it("should prevent registration with duplicate email", async function () {
            await esim.connect(addr1).registerUser("Alice", "alice@example.com");
            await expect(esim.connect(addr2).registerUser("Bob", "alice@example.com"))
                .to.be.revertedWith("Email already registered");
        });

        it("should prevent registration with invalid email", async function () {
            await expect(esim.connect(addr1).registerUser("Alice", "invalid-email"))
                .to.be.revertedWith("Invalid email format");
        });
    });

    describe("Updating User Information", function () {
        it("should update user information", async function () {
            await esim.connect(addr1).registerUser("Alice", "alice@example.com");
            await esim.connect(addr1).updateUser("Alice Updated", "alice.updated@example.com");

            const userDetails = await esim.getUserDetails((await esim.users(addr1.address)).simNumber);
            expect(userDetails[0]).to.equal("Alice Updated");
            expect(userDetails[1]).to.equal("alice.updated@example.com");
        });

        it("should prevent updating with a duplicate email", async function () {
            await esim.connect(addr1).registerUser("Alice", "alice@example.com");
            await esim.connect(addr2).registerUser("Bob", "bob@example.com");

            await expect(esim.connect(addr2).updateUser("Bob", "alice@example.com"))
                .to.be.revertedWith("Email already in use by another user");
        });

        it("should prevent updating with invalid email", async function () {
            await esim.connect(addr1).registerUser("Alice", "alice@example.com");
            await expect(esim.connect(addr1).updateUser("Alice", "invalid-email"))
                .to.be.revertedWith("Invalid email format");
        });
    });

    describe("Deposits", function () {
        it("should deposit funds and update balance", async function () {
            await esim.connect(addr1).registerUser("Alice", "alice@example.com");

            await esim.connect(addr1).deposit({ value: ethers.utils.parseEther("1.0") });
            const balance = await esim.getBalance();

            expect(balance).to.equal(ethers.utils.parseEther("1.0"));
        });

        it("should prevent deposit of zero value", async function () {
            await esim.connect(addr1).registerUser("Alice", "alice@example.com");

            await expect(esim.connect(addr1).deposit({ value: ethers.utils.parseEther("0") }))
                .to.be.revertedWith("Deposit amount must be greater than zero");
        });
    });

    describe("Access Control and Edge Cases", function () {
        it("should prevent unregistered users from updating information", async function () {
            await expect(esim.connect(addr1).updateUser("Alice", "alice@example.com"))
                .to.be.revertedWith("User not registered");
        });

        it("should prevent unregistered users from depositing funds", async function () {
            await expect(esim.connect(addr1).deposit({ value: ethers.utils.parseEther("1.0") }))
                .to.be.revertedWith("User not registered");
        });

        it("should prevent fetching details of non-existent SIM number", async function () {
            const emptyDetails = await esim.getUserDetails("non-existent-sim");
            expect(emptyDetails[0]).to.equal("");
            expect(emptyDetails[1]).to.equal("");
            expect(emptyDetails[2]).to.be.false;
            expect(emptyDetails[3]).to.equal(0);
        });
    });
});
