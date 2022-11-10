
// SPDX-License-Identifier: None
pragma solidity >=0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "./StringUtils.sol";

contract PassRegistryStorage {
    mapping(address => uint) userInvitedNum;
    mapping(address => uint) userInvitesMax;
    mapping(bytes32 => address) hashToOwner;
    mapping(bytes32 => string) hashToName;
}

contract PassRegistry is PassRegistryStorage, ERC721Upgradeable {
    using StringUtils for *;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.Bytes32Set;

    enum UserClass {A, B, C }

    uint8 constant ClassAInvitationNum = 7;
    uint8 constant ClassBInvitationNum = 6;
    uint8 constant ClassCInvitationNum = 3;
    bytes32 constant ClassA = "";
    bytes32 constant ClassB = "";
    bytes32 constant ClassC = "";

    CountersUpgradeable.Counter private passId;
    mapping(address => EnumerableSetUpgradeable.Bytes32Set) private userNames;

    function initialize(string memory _name, string memory _symbol) public initializer {
        __ERC721_init(_name, _symbol);
    }


    /**
    * @notice lock a name by pass
     */
    function lockPass(bytes memory _invitationCode, string memory _name, string memory _msg) external {
        //bytes32 hashedName = keccak256(abi.encodePacked(_name));
        bytes32 hashedMsg = keccak256(abi.encodePacked(_msg));
        address codeFrom = recoverSigner(hashedMsg, _invitationCode);
        require(userInvitesMax[codeFrom] > userInvitedNum[codeFrom], "IC");

        uint passNum = 0;
        if (hashedMsg == ClassA){
            passNum = ClassAInvitationNum;
        }else if (hashedMsg == ClassB){
            passNum = ClassBInvitationNum;
        }else{
            passNum = ClassCInvitationNum;
        }

        // bind name if possible
        if(nameAvaliable(_name)) {
            userInvitedNum[codeFrom] += 1;

            passId.increment();
            _mint(msg.sender, passId.current());

            lockName(passId.current(), _name);
        }

        // mint invitecodes
        for (uint256 index = 0; index < passNum; index++) {
            passId.increment();
            _mint(msg.sender, passId.current());
        }
    } 

    /**
    * @notice lock a name with given passid
     */
    function lockName(uint _passId, string memory _name) public {
        require(ownerOf(_passId) == msg.sender, "IP");
        bytes32 hashedName = keccak256(abi.encodePacked(_name));
        require(hashToOwner[hashedName] != address(0), "IN");

        //lock name
        userNames[msg.sender].add(hashedName);
        hashToName[hashedName] = _name;
        hashToOwner[hashedName] = msg.sender;
        // init invatations
        userInvitedNum[msg.sender] = 0;
        userInvitesMax[msg.sender] = 3;
    }

    /**
    * @notice request user's pass list
     */
    function getUserPassList(address _user) external view returns (string[] memory) {
        string[] memory names = new string[](userNames[_user].length());

        for (uint256 index = 0; index < userNames[_user].length(); index++) {
            bytes32 hashedName = userNames[_user].at(index);
            names[index] = hashToName[hashedName];
        }
        return names;
    }

    /**
    * @notice check name length
    */
    function lenValid(string memory _name) public pure returns (bool){
        //return name.strlen() >= 2;
        return true;
    }

    /**
    * @notice check if name match some patterns
     */
    function matchValid(string memory _name) internal pure returns (bool) {
        return true;
    }

    function nameAvaliable(string memory _name) public view returns (bool) {
        bytes32 nameHash = keccak256(bytes(_name));
        return matchValid(_name) && lenValid(_name) && hashToOwner[nameHash] == address(0);
    }


    /**
    * @notice verify a request code by message and its signature
     */
    function verifyInvitationCode(address _user, string memory _msg, bytes memory _sig) public pure returns (bool) {
        //address requestFrom = ownerOf(_requestId);
        //bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        //bytes32 prefixedHashMessage = getRequestMessage(_hashedMessage, prefix);
        bytes32 _hashMessage = keccak256(abi.encodePacked(_msg));
        if (_user == recoverSigner(_hashMessage, _sig)) {
            return true;
        }
        return false;
    }

    function recoverSigner(bytes32 _hashMessage, bytes memory _sig) internal pure returns (address)
    {
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(_sig, 32))
            // second 32 bytes
            s := mload(add(_sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(_sig, 96)))
        }

        return ecrecover(_hashMessage, v, r, s);
    }
}