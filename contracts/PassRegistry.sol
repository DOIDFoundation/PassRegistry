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
    mapping(bytes32 => bool) reserveNames;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * The size of the __gap array is calculated so that the amount of storage used by a
     * contract always adds up to the same number (in this case 50 storage slots).
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[43] private __gap;
}

contract PassRegistry is
    PassRegistryStorage,
    ERC721EnumerableUpgradeable,
    AccessControlEnumerableUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    uint8 constant ClassAInvitationNum = 5;
    uint8 constant ClassBInvitationNum = 5;
    uint8 constant ClassCInvitationNum = 0;
    uint8 constant ClassANameLen = 2;
    uint8 constant ClassBNameLen = 4;
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
        passId._value = 100000;
    }

    function updatePassIdStart(uint _start) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        passId._value = _start;
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
        bytes32 _classHash,
        uint _passId
    ) external {
        if (_passId == 0) {
            address codeFrom = verifyInvitationCode(_classHash, _invitationCode);
            require(userInvitesMax[codeFrom] > userInvitedNum[codeFrom], "IC");
            userInvitedNum[codeFrom] += 1;
            passId.increment();
            _passId = passId.current();
        } else {
            require(!_exists(_passId), "II");
            bytes32 hashedMsg = keccak256(abi.encodePacked(_passId, _classHash));
            address codeFrom = verifyInvitationCode(hashedMsg, _invitationCode);
            require(hasRole(INVITER_ROLE, codeFrom), "IR");
        }
        bytes32 hashedName = keccak256(abi.encodePacked(_name));
        passInfo[_passId] = PassInfo({passId: _passId, passClass: _classHash, passHash: ""});
        _mint(msg.sender, _passId);
        (uint passNum, uint nameLen, ) = getClassInfo(_classHash);

        // mint extra passes
        for (uint256 index = 0; index < passNum; index++) {
            passId.increment();
            passInfo[passId.current()] = PassInfo({
                passId: passId.current(),
                passClass: ClassC,
                passHash: 0
            });
            _mint(msg.sender, passId.current());
        }

        _lockName(_passId, _name, hashedName, nameLen);

        emit LockPass(msg.sender, passNum);
    }

    /**
     * @notice lock a name with given passid
     */
    function lockName(uint _passId, string memory _name) external {
        bytes32 hashedName = keccak256(abi.encodePacked(_name));
        PassInfo memory pass = passInfo[_passId];

        (, uint nameLen, ) = getClassInfo(pass.passClass);

        require(_lockName(_passId, _name, hashedName, nameLen), "IN");
    }

    function _lockName(
        uint _passId,
        string memory _name,
        bytes32 _hashedName,
        uint _minLen
    ) internal returns (bool) {
        if (bytes(_name).length <= 0) return false;
        require(ownerOf(_passId) == msg.sender, "IP");
        require(passInfo[_passId].passHash == 0, "AL");
        if (!nameAvaliable(_minLen, _name)) {
            return false;
        }

        //lock name
        hashToName[_hashedName] = _name;
        hashToOwner[_hashedName] = msg.sender;
        passInfo[_passId].passHash = _hashedName;
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
     * @notice reserve a brunch of name
     */
    function reserveName(bytes32[] memory _hashes) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "IR");
        for (uint256 index = 0; index < _hashes.length; index++) {
            reserveNames[_hashes[index]] = true;
        }
    }

    /**
     * @notice check if name in reservation list
     */
    function nameReserves(string memory _name) public view returns (bool) {
        return reserveNames[keccak256(bytes(_name))];
    }

    /**
     * @notice check if name has already been registered
     */
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

        if (nameReserves(_name)) {
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
            }else{
                len++;
                if (b < 0xE0) {
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

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);

        string memory nameInfo;
        PassInfo memory passInfo = passInfo[tokenId];
        if (passInfo.passHash != 0) {
            nameInfo = string(
                abi.encodePacked(bytes(getNameByHash(passInfo.passHash)), bytes("%20locked"))
            );
        } else nameInfo = "no%20name%20locked%20yet";

        return
            string(
                abi.encodePacked(
                    bytes("data:application/json;utf8,%7B%22name%22%3A%22DOID%20Lock%20Pass%20%23"),
                    tokenId,
                    bytes("%22%2C%22description%22%3A%22A%20DOID%20lock%20pass%2C%20with%20"),
                    bytes(nameInfo),
                    bytes(
                        ".%22%2C%22image%22%3A%22data%3Aimage%2Fsvg%2Bxml%3Butf8%2C%253Csvg%2520xmlns%253D%2522http%253A%252F%252Fwww.w3.org%252F2000%252Fsvg%2522%2520viewBox%253D%25220%25200%252040.02%252051.9%2522%253E%253Cpath%2520d%253D%2522M28.81%252012.52l9.26%25204.91c1.2.74%25201.95%25201.95%25201.95%25203.33v21.03c0%25201.3-.65%25202.41-1.67%25203.15l-9.82%25206.3c-1.2.83-2.69.83-3.89.19l-7.87-4.26%252013.53-8.15.09-15.75L20.2%252017.9l8.62-5.37zm-6.02%252026.4l2.22%25201.11-8.62%25205.28-2.22-1.11%25208.62-5.28zm-1.48-3.8l2.22%25201.11-8.62%25205.28-2.32-1.11%25208.71-5.28zM15.75.57l7.5%25203.98L9.73%252012.8l-.09%252015.66%252010.19%25205.47-8.62%25205.37-8.89-4.82C.84%252033.74%25200%252032.16%25200%252030.59v-20.2c0-1.48.74-2.96%25202.04-3.8L11.12.76a4.39%25204.39%25200%25200%25201%25204.63-.19zm10.56%25208.89l2.22%25201.11-8.62%25205.28-2.22-1.11%25208.62-5.28zm-1.57-3.8l2.32%25201.2-8.62%25205.28-2.32-1.2%25208.62-5.28z%2522%2520fill%253D%2522%2523373737%2522%2520fill-rule%253D%2522evenodd%2522%252F%253E%253C%252Fsvg%253E%22%7D"
                    )
                )
            );
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
