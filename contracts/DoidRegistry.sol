// SPDX-License-Identifier: None
pragma solidity >=0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";

import './interfaces/IDoidRegistry.sol';
import './interfaces/IPassRegistry.sol';
import './resolvers/AddressResolver.sol';
import './StringUtils.sol';
import "hardhat/console.sol";

contract DoidRegistryStorage {
    uint256 public constant COIN_TYPE_ETH = 60;

    // address of passRegistry
    IPassRegistry passReg;

    // A map stores all commitments
    mapping(bytes32 => uint256) public commitments;
    uint256 public minCommitmentAge;
    uint256 public maxCommitmentAge;

    mapping(bytes32 => bytes) public names;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * The size of the __gap array is calculated so that the amount of storage used by a
     * contract always adds up to the same number (in this case 50 storage slots).
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[44] private __gap;
}

contract DoidRegistry is
    DoidRegistryStorage,
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
    }

    function isAuthorised(bytes32 node) internal view override returns (bool) {
        address owner = ownerOf(uint256(node));
        return owner == msg.sender || isApprovedForAll(owner, msg.sender);
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
            tokenIds[index].name = names[bytes32(tokenId)];
        }
        return tokenIds;
    }

    function nameHash(string memory name) public pure override returns(bytes32) {
        return keccak256(bytes(name));
    }

    function valid(string memory name) public pure override returns (bool) {
        return name.doidlen() >= 6;
    }

    /**
     * @dev Returns true iff the specified name is available for registration.
     */
    function available(string memory name) public view override returns (bool) {
        if (passReserved(name)){
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
    ) public view override returns (string memory status, address owner) {
        bytes32 node = keccak256(bytes(_name));
        uint256 id = uint256(node);
        if (_exists(id)) {
            status = "registered";
            owner = ownerOf(id);
        }
        address lockedOwner = passReg.getUserByHash(bytes32(id));
        if (lockedOwner != address(0)) {
            status = "locked";
            owner = lockedOwner;
        }
        status = "available";
    }

    /**
     * @dev Returns true if the specified name is reserved by pass.
     */
    function passReserved(uint256 id) public view returns (bool) {
        address owner = passReg.getUserByHash(bytes32(id));
        if(owner != msg.sender){
            return true;
        }
        return false;
    }

    function passReserved(string memory name) public view returns (bool) {
        if(passReg.nameExists(name)){
            address owner = passReg.getUserByName(name);
            if(owner != msg.sender){
                return true;
            }
        }
        return false;
    }

    function makeCommitment(
        string memory name,
        address owner,
        bytes32 secret,
        bytes[] calldata data
    ) public pure override returns (bytes32) {
        bytes32 label = keccak256(bytes(name));
        return keccak256(abi.encode(label, owner, data, secret));
    }

    function commit(bytes32 commitment) public override {
        require(commitments[commitment] + maxCommitmentAge < block.timestamp, "IC");
        commitments[commitment] = block.timestamp;
    }

    function _consumeCommitment(string memory name, bytes32 commitment) internal {
        // Require an old enough commitment.
        require(commitments[commitment] + minCommitmentAge <= block.timestamp, "CN");

        // If the commitment is too old, or the name is registered, stop
        require (commitments[commitment] + maxCommitmentAge > block.timestamp, "CO");

        require(available(name), "IN");

        delete (commitments[commitment]);
    }

    /**
     * @dev Register a name.
     * @param name The address of the tokenId.
     * @param owner The address that should own the registration.
     */
    function register(
        string calldata name,
        address owner,
        bytes32 secret,
        bytes[] calldata data
    ) external override returns (uint256) {
        uint256 expires = _register(name, owner, secret, data);

        setAddr(keccak256(bytes(name)), COIN_TYPE_ETH, abi.encodePacked(name));
        return expires;
    }

    function _register(
        string calldata name,
        address owner,
        bytes32 secret,
        bytes[] calldata data
    ) internal returns (uint256) {
        require(available(name));

        _consumeCommitment(name, makeCommitment(name, owner, secret, data));

        bytes32 node = keccak256(bytes(name));
        uint id = uint(node);
        names[node] = bytes(name);
        _mint(owner, id);

        emit NameRegistered(id, owner, block.timestamp);

        return block.timestamp;
    }
}
