// SPDX-License-Identifier: None
pragma solidity >=0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

//import "hardhat/console.sol";

contract PassRegistryStorage {
    struct PassInfo {
        uint passId;
        bytes32 passClass;
        bytes32 passHash;
    }
    mapping(address => uint) userInvitedNum;
    mapping(address => uint) userInvitesMax;
    mapping(bytes32 => address) hashToOwner;
    mapping(bytes32 => string) hashToName;
    mapping(uint => PassInfo) passInfo;
    CountersUpgradeable.Counter internal passId;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * The size of the __gap array is calculated so that the amount of storage used by a
     * contract always adds up to the same number (in this case 50 storage slots).
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[44] private __gap;
}

contract PassRegistry is
    PassRegistryStorage,
    ERC721EnumerableUpgradeable,
    AccessControlEnumerableUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    uint8 constant ClassAInvitationNum = 6;
    uint8 constant ClassBInvitationNum = 6;
    uint8 constant ClassCInvitationNum = 1;
    uint8 constant ClassANameLen = 2;
    uint8 constant ClassBNameLen = 3;
    uint8 constant ClassCNameLen = 6;
    bytes32 constant ClassA = 0x03783fac2efed8fbc9ad443e592ee30e61d65f471140c10ca155e937b435b760; // A
    bytes32 constant ClassB = 0x1f675bff07515f5df96737194ea945c36c41e7b4fcef307b7cd4d0e602a69111; // B
    bytes32 constant ClassC = 0x017e667f4b8c174291d1543c466717566e206df1bfd6f30271055ddafdb18f72; //C

    /** @dev 全局邀请权限 */
    bytes32 public constant INVITER_ROLE = keccak256("INVITER_ROLE");

    // EVENTs
    event LockPass(address user, uint passNumber);
    event LockName(address user, uint passId, string name);

    function initialize(
        address _admin,
        string memory _name,
        string memory _symbol
    ) public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
        __ERC721_init(_name, _symbol);
    }

    function getClassInfo(
        bytes32 _hash
    ) public pure returns (uint invNum, uint nameLen, bytes32 class) {
        invNum = ClassCInvitationNum;
        nameLen = ClassCNameLen;
        class = ClassC;
        if (_hash == ClassA) {
            invNum = ClassAInvitationNum;
            nameLen = ClassANameLen;
            class = ClassA;
        } else if (_hash == ClassB) {
            invNum = ClassBInvitationNum;
            nameLen = ClassANameLen;
            class = ClassB;
        }
    }

    /**
     * @notice lock a name with code
     */
    function lockPass(
        bytes memory _invitationCode,
        string memory _name,
        string memory _class
    ) external {
        //bytes32 hashedMsg = keccak256(abi.encodePacked(msg.sender, _class));
        //console.logBytes32(hashedMsg);
        bytes32 hashedMsg = keccak256(abi.encodePacked(_class));
        address codeFrom = verifyInvitationCode(hashedMsg, _invitationCode);
        if (!hasRole(INVITER_ROLE, codeFrom)) {
            // code from users can be used no more than limit
            require(keccak256(bytes(_class)) == ClassC, "IC");
            require(userInvitesMax[codeFrom] > userInvitedNum[codeFrom], "IC");
        } else {
            // code from foudation can be used only once.
            // require(userInvitedNum[codeFrom] == 0, "IC");
        }

        (uint passNum, uint nameLen, bytes32 class) = getClassInfo(hashedMsg);

        uint lockingPassId = passId.current() + 1;

        // mint passes
        for (uint256 index = 0; index < passNum; index++) {
            passId.increment();
            passInfo[passId.current()] = PassInfo({
                passId: passId.current(),
                passClass: ClassC,
                passHash: ""
            });
            _mint(msg.sender, passId.current());
        }

        // bind name if possible
        bytes32 hashedName = keccak256(abi.encodePacked(_name));
        userInvitedNum[codeFrom] += 1;
        passInfo[lockingPassId].passClass = class;
        if (_lockName(lockingPassId, _name, hashedName, nameLen))
            passInfo[lockingPassId].passHash = hashedName;

        emit LockPass(msg.sender, passNum);
    }

    /**
     * @notice lock a name with given passid
     */
    function lockName(uint _passId, string memory _name) external {
        bytes32 hashedName = keccak256(abi.encodePacked(_name));
        PassInfo memory pass = passInfo[_passId];

        (, uint nameLen, ) = getClassInfo(pass.passClass);

        require(_lockName(_passId, _name, hashedName, nameLen), "IV");
    }

    function _lockName(
        uint _passId,
        string memory _name,
        bytes32 _hashedName,
        uint _minLen
    ) internal returns (bool) {
        require(ownerOf(_passId) == msg.sender, "IP");
        if (!nameAvaliable(_minLen, _name)) {
            return false;
        }

        //lock name
        hashToName[_hashedName] = _name;
        hashToOwner[_hashedName] = msg.sender;
        // init invatations at first time
        if (userInvitesMax[msg.sender] == 0) {
            userInvitedNum[msg.sender] = 0;
            userInvitesMax[msg.sender] = 3 * balanceOf(msg.sender);
        }

        emit LockName(msg.sender, _passId, _name);
        return true;
    }

    /**
     * @notice request user's pass list
     */
    function getUserPassList(address _user) external view returns (uint[] memory) {
        //string[] memory names = new string[](balanceOf(_user));
        uint[] memory passList = new uint[](balanceOf(_user));

        for (uint256 index = 0; index < balanceOf(_user); index++) {
            //names[index] = hashToName[passIdToHash[tokenOfOwnerByIndex(_user, index)]];
            passList[index] = tokenOfOwnerByIndex(_user, index);
        }
        return passList;
    }

    function getUserPassesInfo(address _user) external view returns (PassInfo[] memory) {
        PassInfo[] memory info = new PassInfo[](balanceOf(_user));

        for (uint256 index = 0; index < balanceOf(_user); index++) {
            info[index] = passInfo[tokenOfOwnerByIndex(_user, index)];
        }
        return info;
    }

    function getUserPassInfo(uint _passId) external view returns (PassInfo memory) {
        return passInfo[_passId];
    }

    function getUserInvitedNumber(address _user) external view returns (uint, uint) {
        return (userInvitedNum[_user], userInvitesMax[_user]);
    }

    function getNameByHash(bytes32 _hash) public view returns (string memory) {
        return hashToName[_hash];
    }

    function getUserByHash(bytes32 _hash) public view returns (address) {
        return hashToOwner[_hash];
    }

    /**
     * @notice check name length
     */
    function lenValid(uint _minLen, string memory _name) public pure returns (bool) {
        return strlen(_name) >= _minLen && strlen(_name) <= 64;
    }

    /**
     * @notice check if name match some patterns
     */
    function matchDenyList(string memory _name) internal pure returns (bool) {
        return false;
    }

    function nameExists(string memory _name) public view returns (bool) {
        // is locked before
        bytes32 nameHash = keccak256(bytes(_name));
        if (hashToOwner[nameHash] == address(0)) {
            return false;
        }
        return true;
    }

    function nameAvaliable(uint _minLen, string memory _name) public view returns (bool) {
        if (!lenValid(_minLen, _name)) {
            return false;
        }

        if (nameExists(_name)) {
            return false;
        }

        if (matchDenyList(_name)) {
            return false;
        }
        return true;
    }

    function strlen(string memory s) internal pure returns (uint256) {
        uint256 len;
        uint256 i = 0;
        uint256 bytelength = bytes(s).length;
        for (len = 0; i < bytelength; len++) {
            bytes1 b = bytes(s)[i];
            if (b < 0x80) {
                i += 1;
            } else if (b < 0xE0) {
                i += 2;
            } else if (b < 0xF0) {
                i += 3;
            } else if (b < 0xF8) {
                i += 4;
            } else if (b < 0xFC) {
                i += 5;
            } else {
                i += 6;
            }
        }
        return len;
    }

    /**
     * @notice verify a request code by message and its signature
     */
    function verifyInvitationCode(bytes32 _msg, bytes memory _sig) public pure returns (address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 _hashMessage = keccak256(abi.encodePacked(prefix, _msg));
        return recoverSigner(_hashMessage, _sig);
    }

    function recoverSigner(
        bytes32 _hashMessage,
        bytes memory _sig
    ) internal pure returns (address) {
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

    // The following functions are overrides required by Solidity.
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(AccessControlEnumerableUpgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
