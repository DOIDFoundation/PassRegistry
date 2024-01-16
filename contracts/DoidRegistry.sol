// SPDX-License-Identifier: None
pragma solidity >=0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IDoidRegistry.sol";
import "./interfaces/IPassRegistry.sol";
import "./resolvers/AddressResolver.sol";
import "./StringUtils.sol";

// import "hardhat/console.sol";
bytes32 constant lookup = 0x3031323334353637383961626364656600000000000000000000000000000000;
// namehash of "addr.reverse"
bytes32 constant ADDR_REVERSE_NODE = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;

contract DoidRegistryStorage {
    // address of passRegistry
    IPassRegistry passReg;

    // A map stores all commitments
    mapping(bytes32 => uint256) public commitments;
    uint256 public minCommitmentAge;
    uint256 public maxCommitmentAge;

    mapping(bytes32 => bytes) public names;

    mapping(bytes32 => bytes) public IPNS;
    mapping(bytes32 => address) public mainAddress;
    mapping(bytes32 => string) public reverseNames;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * The size of the __gap array is calculated so that the amount of storage used by a
     * contract always adds up to the same number (in this case 50 storage slots).
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[41] private __gap;
}

contract DoidRegistry is
    DoidRegistryStorage,
    OwnableUpgradeable,
    ERC721EnumerableUpgradeable,
    AddressResolver,
    IDoidRegistry
{
    using StringUtils for string;

    function initialize(
        address passRegistry,
        uint256 _minCommitmentAge,
        uint256 _maxCommitmentAge
    ) public initializer {
        minCommitmentAge = _minCommitmentAge;
        maxCommitmentAge = _maxCommitmentAge;
        passReg = IPassRegistry(passRegistry);
        __Ownable_init();
    }

    function isAuthorised(bytes32 _node) internal view override returns (bool) {
        address owner = ownerOf(uint256(_node));
        return
            owner == msg.sender ||
            mainAddress[_node] == msg.sender ||
            isApprovedForAll(owner, msg.sender);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AddressResolver, ERC721EnumerableUpgradeable) returns (bool) {
        return
            interfaceId == type(IDoidRegistry).interfaceId || super.supportsInterface(interfaceId);
    }

    function tokensOfOwner(address _user) public view override returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint[](balanceOf(_user));

        for (uint256 index = 0; index < balanceOf(_user); index++) {
            tokenIds[index] = tokenOfOwnerByIndex(_user, index);
        }
        return tokenIds;
    }

    function namesOfOwner(address _user) public view override returns (DoidInfo[] memory) {
        DoidInfo[] memory tokenIds = new DoidInfo[](balanceOf(_user));

        for (uint256 index = 0; index < balanceOf(_user); index++) {
            uint256 tokenId = tokenOfOwnerByIndex(_user, index);
            tokenIds[index].tokenId = tokenId;
            tokenIds[index].name = _nameOfToken(tokenId);
        }
        return tokenIds;
    }

    function nameHash(string memory _name) public pure override returns (bytes32) {
        // return keccak256(bytes(_name));
        return keccak256(abi.encodePacked(DOID_NODE, keccak256(bytes(_name))));
    }

    function _nameOfToken(uint256 id) internal view returns (string memory) {
        return string(names[bytes32(id)]);
    }

    function _nameOfHash(bytes32 _node) internal view returns (string memory) {
        return string(names[_node]);
    }

    function valid(string memory _name) public pure override returns (bool) {
        bytes memory bStr = bytes(_name);
        for (uint i = 0; i < bStr.length; i++) {
            // Uppercase character...
            if ((bStr[i] >= 0x41) && (bStr[i] <= 0x5A)) {
                return false;
            }
            // .
            if (bStr[i] == 0x2E) {
                return false;
            }
        }
        return _name.doidlen() >= 6;
    }

    /**
     * @dev Returns true iff the specified name is available for registration.
     */
    function available(string memory _name) public view override returns (bool) {
        if (_exists(uint256(nameHash(_name)))) return false;
        if (passReserved(_name)) {
            return false;
        }
        return true;
    }

    // Returns true iff the specified name is available for registration.
    function available(uint256 id) public view override returns (bool) {
        if (_exists(id)) return false;
        if (passReserved(id)) {
            return false;
        }
        return true;
    }

    function statusOfName(
        string memory _name
    ) public view override returns (string memory status, address owner, uint id) {
        status = "available";
        bytes32 node = keccak256(bytes(_name));
        id = 0;
        if (_exists(uint(node))) {
            status = "registered";
            owner = ownerOf(uint(node));
            id = uint(node);
            return (status, owner, id);
        }
        uint passId = passReg.getPassByHash(node);
        if (passReg.exists(passId)) {
            status = "locked";
            owner = passReg.getUserByHash(node);
            id = passId;
        } else if (!valid(_name) || passReg.nameReserves(_name)) {
            status = "reserved";
        }
    }

    function mainAddrOfName(string memory _name) public view override returns (address main) {
        return mainAddress[nameHash(_name)];
    }

    function ipnsOfName(string memory _name) public view override returns (bytes memory ipns) {
        return IPNS[nameHash(_name)];
    }

    /**
     * @dev Returns true if the specified name is reserved by pass.
     */
    function passReserved(uint256 id) public view returns (bool) {
        address owner = passReg.getUserByHash(bytes32(id));
        if (owner != tx.origin) {
            return true;
        }
        return false;
    }

    function passReserved(string memory name) public view returns (bool) {
        if (passReg.nameExists(name)) {
            if (passReg.nameReserves(name)) return true;
            address owner = passReg.getUserByName(name);
            if (owner == tx.origin) {
                return false;
            }
            return true;
        }
        if (name.doidlen() < 6) {
            return true;
        }
        return false;
    }

    function makeCommitment(
        string memory name,
        address owner,
        bytes32 secret,
        bytes[] calldata data
    ) public pure returns (bytes32) {
        // revert("deprecated");
        bytes32 label = keccak256(bytes(name));
        return keccak256(abi.encode(label, owner, data, secret));
    }

    function commit(bytes32 commitment) public {
        // revert("deprecated");
        require(commitments[commitment] + maxCommitmentAge < block.timestamp, "IC");
        commitments[commitment] = block.timestamp;
    }

    function _consumeCommitment(string memory _name, bytes32 commitment) internal {
        // Require an old enough commitment.
        require(commitments[commitment] + minCommitmentAge <= block.timestamp, "CN");

        // If the commitment is too old, or the name is registered, stop
        require(commitments[commitment] + maxCommitmentAge > block.timestamp, "CO");

        require(available(_name), "IN");

        delete (commitments[commitment]);
    }

    function nameMigration(string calldata _name, address owner) external onlyOwner{
        _register(_name, owner, "");
    }

    /**
     * @dev Register a name.
     * @param _name The address of the tokenId.
     * @param owner The address that should own the registration.
     */
    function register(
        string calldata _name,
        address owner,
        bytes32 secret,
        bytes[] calldata data
    ) external {
        // revert("deprecated");
        _register(_name, owner, secret, data);
    }

    /**
     * @dev Register a name in one step.
     * @param _name The address of the tokenId.
     * @param owner The address that should own the registration.
     */
    function register(string calldata _name, address owner) external override {
        _register(_name, owner, "");
    }

    function register(string calldata _name, address owner, bytes memory ipns) external override {
        _register(_name, owner, ipns);
    }

    function _register(
        string calldata _name,
        address owner,
        bytes32 secret,
        bytes[] calldata data
    ) internal {
        _consumeCommitment(_name, makeCommitment(_name, owner, secret, data));

        _register(_name, owner, "");
    }

    function _register(string calldata _name, address owner, bytes memory ipns) internal {
        require(available(_name), "IN");

        bytes32 node = keccak256(bytes(_name));
        uint id = uint(node);
        names[node] = bytes(_name);

        // register name for address
        _setNameForAddr(_name, owner);

        _mint(owner, id);

        setAddr(node, COIN_TYPE_ETH, addressToBytes(owner));

        if (ipns.length != 0) setMainAddrAndIPNS(node, owner, ipns);

        emit NameRegistered(id, _name, owner);
    }

    function _setNameForAddr(string calldata _name, address _addr) internal {
        bytes32 labelHash = sha3HexAddress(_addr);
        bytes32 reverseNode = keccak256(abi.encodePacked(ADDR_REVERSE_NODE, labelHash));
        reverseNames[reverseNode] = string(abi.encodePacked(_name, ".doid"));

        emit SetReverse(_addr, reverseNode);
    }

    // ENS Api
    /**
     * @dev Returns the node hash for a given account's reverse records.
     * @param addr The address to hash
     * @return The ENS node hash.
     */
    function node(address addr) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(ADDR_REVERSE_NODE, sha3HexAddress(addr)));
    }

    function name(bytes32 _node) external view returns (string memory) {
        return reverseNames[_node];
    }

    function resolver(bytes32) external view returns (address) {
        return address(this);
    }

    /**
     * @dev An optimised function to compute the sha3 of the lower-case
     *      hexadecimal representation of an Ethereum address.
     * @param addr The address to hash
     * @return ret The SHA3 hash of the lower-case hexadecimal encoding of the
     *         input address.
     */
    function sha3HexAddress(address addr) private pure returns (bytes32 ret) {
        assembly {
            for {
                let i := 40
            } gt(i, 0) {

            } {
                i := sub(i, 1)
                mstore8(i, byte(and(addr, 0xf), lookup))
                addr := div(addr, 0x10)
                i := sub(i, 1)
                mstore8(i, byte(and(addr, 0xf), lookup))
                addr := div(addr, 0x10)
            }

            ret := keccak256(0, 40)
        }
    }

    using StringsUpgradeable for uint256;

    function makeMainAddrMessage(
        string memory _name,
        address a,
        uint256 timestamp,
        uint256 nonce
    ) public pure override returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "Click sign to allow setting main address for ",
                    _name,
                    " to ",
                    StringsUpgradeable.toHexString(a),
                    "\n\n"
                    "This request will not trigger a blockchain transaction or cost any gas fees."
                    "\n\n"
                    "This message will expire after 24 hours."
                    "\n\nTimestamp: ",
                    timestamp.toString(),
                    "\nNonce: ",
                    nonce.toHexString()
                )
            );
    }

    function recoverMainAddr(
        string memory _name,
        address a,
        uint256 timestamp,
        uint256 nonce,
        bytes memory signature
    ) internal returns (address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n";
        string memory message = makeMainAddrMessage(_name, a, timestamp, nonce);
        bytes32 _hashMessage = keccak256(
            abi.encodePacked(prefix, bytes(message).length.toString(), message)
        );
        return recoverSigner(_hashMessage, signature);
    }

    function setMainAddrAndIPNS(
        string memory _name,
        address a,
        uint256 timestamp,
        uint256 nonce,
        bytes memory signature,
        bytes memory ipns
    ) public override {
        bytes32 node = keccak256(bytes(_name));
        require(isAuthorised(node), "NO");
        require(block.timestamp - timestamp < 86400, "EXP");
        address recoverdAddress = recoverMainAddr(_name, a, timestamp, nonce, signature);
        require(a == recoverdAddress, "IA");
        setMainAddrAndIPNS(node, a, ipns);
    }

    function setMainAddrAndIPNS(bytes32 node, address a, bytes memory ipns) internal {
        emit MainAddrChanged(node, a, ipns);
        mainAddress[node] = a;
        IPNS[node] = ipns;
    }

    function claimLockedName(string calldata name, address owner) public override {
        require(_msgSender() == address(passReg), "Excuted by PassRegistry only");
        _register(name, owner, "");
    }

    // function name() public pure override returns (string memory) {
    //     return "DOID: Decentralized OpenID";
    // }

    function symbol() public pure override returns (string memory) {
        return "DOID";
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);

        string memory passName = _nameOfToken(tokenId);

        return
            string(
                abi.encodePacked(
                    // data:application/json;charset=UTF-8,
                    // {"name":"
                    "data:application/json;charset=UTF-8,"
                    "%7B%22name%22%3A%22",
                    passName,
                    // .doid","description":"
                    ".doid%22%2C%22description%22%3A%22",
                    passName,
                    // .doid, a decentralized OpenID.","image":"data:image/svg+xml;charset=UTF-8,
                    ".doid%2C%20a%20decentralized%20OpenID.%22%2C%22image%22%3A%22data%3Aimage%2Fsvg%2Bxml%3Bcharset=UTF-8%2C",
                    // <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="#fff"><defs><radialGradient cx="30%" cy="-30%" r="2" id="a"><stop offset="20%" stop-color="#FFEA94"/><stop offset="45%" stop-color="#D39750"/><stop offset="80%" stop-color="#51290F"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#a)"/><path d="m23.706 15.918 2.602 1.38c.337.208.548.548.548.936v5.909c0 .365-.183.677-.47.885l-2.76 1.77a1.045 1.045 0 0 1-1.092.054l-2.212-1.197 3.802-2.29.026-4.426-2.864-1.51 2.422-1.508zm-1.692 7.419.624.311-2.422 1.484-.624-.312 2.422-1.483zm-.416-1.068.624.312-2.422 1.483-.652-.312 2.447-1.483zm-1.562-9.709 2.107 1.119-3.799 2.318-.025 4.4 2.863 1.537-2.422 1.51-2.498-1.355c-.416-.208-.652-.652-.652-1.093V15.32c0-.416.208-.832.573-1.068l2.552-1.638a1.234 1.234 0 0 1 1.3-.054zm2.967 2.498.624.312-2.422 1.484-.624-.312 2.422-1.484zm-.441-1.068.652.338-2.422 1.483-.652-.337 2.422-1.484z"/>
                    // <text x="15" y="128" font-size="12" font-family="Arial,sans-serif">
                    "%253Csvg%2520xmlns%253D%2522http%253A%252F%252Fwww.w3.org%252F2000%252Fsvg%2522%2520viewBox%253D%25220%25200%2520128%2520128%2522%2520fill%253D%2522%2523fff%2522%253E%253Cdefs%253E%253CradialGradient%2520cx%253D%252230%2525%2522%2520cy%253D%2522-30%2525%2522%2520r%253D%25222%2522%2520id%253D%2522a%2522%253E%253Cstop%2520offset%253D%252220%2525%2522%2520stop-color%253D%2522%2523FFEA94%2522%252F%253E%253Cstop%2520offset%253D%252245%2525%2522%2520stop-color%253D%2522%2523D39750%2522%252F%253E%253Cstop%2520offset%253D%252280%2525%2522%2520stop-color%253D%2522%252351290F%2522%252F%253E%253C%252FradialGradient%253E%253C%252Fdefs%253E%253Crect%2520width%253D%2522100%2525%2522%2520height%253D%2522100%2525%2522%2520fill%253D%2522url(%2523a)%2522%252F%253E%253Cpath%2520d%253D%2522m23.706%252015.918%25202.602%25201.38c.337.208.548.548.548.936v5.909c0%2520.365-.183.677-.47.885l-2.76%25201.77a1.045%25201.045%25200%25200%25201-1.092.054l-2.212-1.197%25203.802-2.29.026-4.426-2.864-1.51%25202.422-1.508zm-1.692%25207.419.624.311-2.422%25201.484-.624-.312%25202.422-1.483zm-.416-1.068.624.312-2.422%25201.483-.652-.312%25202.447-1.483zm-1.562-9.709%25202.107%25201.119-3.799%25202.318-.025%25204.4%25202.863%25201.537-2.422%25201.51-2.498-1.355c-.416-.208-.652-.652-.652-1.093V15.32c0-.416.208-.832.573-1.068l2.552-1.638a1.234%25201.234%25200%25200%25201%25201.3-.054zm2.967%25202.498.624.312-2.422%25201.484-.624-.312%25202.422-1.484zm-.441-1.068.652.338-2.422%25201.483-.652-.337%25202.422-1.484z%2522%252F%253E"
                    "%253Ctext%2520x%253D%252215%2522%2520y%253D%2522110%2522%2520font-size%253D%252212%2522%2520font-family%253D%2522Arial%252Csans-serif%2522%253E",
                    passName,
                    // .doid</text></svg>
                    // "}
                    ".doid%253C%252Ftext%253E%253C%252Fsvg%253E"
                    "%22%7D"
                )
            );
    }
}
