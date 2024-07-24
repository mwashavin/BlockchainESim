// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ESIM {
    struct User {
        string name;
        string email;
        string simNumber;
        bool isRegistered;
        uint256 balance;
    }

    mapping(address => User) public users;
    mapping(string => address) public simToAddress;

    event UserRegistered(address indexed userAddress, string simNumber);
    event UserUpdated(address indexed userAddress, string name, string email);
    event Deposit(address indexed userAddress, uint256 amount);
    event UserDeleted(address indexed userAddress, string simNumber);

    function registerUser(string memory _name, string memory _email) public {
        require(!users[msg.sender].isRegistered, "User already registered");
        
        string memory simNumber = generateSimNumber(msg.sender);
        users[msg.sender] = User(_name, _email, simNumber, true, 0);
        simToAddress[simNumber] = msg.sender;
        
        emit UserRegistered(msg.sender, simNumber);
    }

    function updateUser(string memory _name, string memory _email) public {
        require(users[msg.sender].isRegistered, "User not registered");
        
        users[msg.sender].name = _name;
        users[msg.sender].email = _email;
        
        emit UserUpdated(msg.sender, _name, _email);
    }

    function getUserDetails(string memory _simNumber) public view returns (string memory, string memory, bool, uint256) {
        address userAddress = simToAddress[_simNumber];
        
        if (!users[userAddress].isRegistered) {
            return ("", "", false, 0);
        }
        
        return (users[userAddress].name, users[userAddress].email, true, users[userAddress].balance);
    }

    function deposit(uint256 _amount) public payable {
        require(users[msg.sender].isRegistered, "User not registered");
        require(msg.value == _amount, "Sent value does not match the specified amount");
        users[msg.sender].balance += _amount;
        emit Deposit(msg.sender, _amount);
    }

    function getBalance() public view returns (uint256) {
        require(users[msg.sender].isRegistered, "User not registered");
        return users[msg.sender].balance;
    }

    function generateSimNumber(address _userAddress) internal pure returns (string memory) {
        bytes32 hash = keccak256(abi.encodePacked(_userAddress));
        bytes memory result = new bytes(10);
        result[0] = "0";
        for (uint i = 1; i < 10; i++) {
            result[i] = bytes1(uint8(uint(uint8(hash[i])) % 10) + 48);
        }
        return string(result);
    }

    function deleteAccount(string memory _simNumber) public {
        require(users[msg.sender].isRegistered, "User not registered");
        require(keccak256(abi.encodePacked(users[msg.sender].simNumber)) == keccak256(abi.encodePacked(_simNumber)), "SIM number does not match");
        require(users[msg.sender].balance == 0, "Balance must be zero to delete account");

        delete simToAddress[_simNumber];
        delete users[msg.sender];

        emit UserDeleted(msg.sender, _simNumber);
    }
}