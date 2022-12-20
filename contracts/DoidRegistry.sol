
// SPDX-License-Identifier: None
pragma solidity >=0.8.4;

import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';

import './interfaces/IDoidRegistry.sol';
import './interfaces/IPassRegistry.sol';
import './resolvers/AddressResolver.sol';
import './StringUtils.sol';
import "hardhat/console.sol";

contract DoidRegistryStorage {

    uint256 public constant GRACE_PERIOD = 90 days;
    uint256 public constant MIN_REGISTRATION_DURATION = 28 days;

    // address of passRegistry
    IPassRegistry passReg;

    // A map of expiry times
    mapping(uint256 => uint256) expiries;
    // A map stores all commitments
    mapping(bytes32 => uint256) public commitments;
    uint256 public minCommitmentAge;
    uint256 public maxCommitmentAge;
 
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
    ERC721Upgradeable,
    AddressResolver,
    IDoidRegistry
{
    using StringUtils for string;

    function initialize (
        address passRegistry_, 
        uint256 minCommitmentAge_,
        uint256 maxCommitmentAge_
    ) public initializer {
        minCommitmentAge = minCommitmentAge_;
        maxCommitmentAge = maxCommitmentAge_;
        passReg = IPassRegistry(passRegistry_);
    }

    function isAuthorised(bytes32 node) internal view override returns (bool) {
        // @TODO: fix this
        address owner = ownerOf(uint(node));
        // if (owner == address(nameWrapper)) {
        //     owner = nameWrapper.ownerOf(uint256(node));
        // }
        return owner == msg.sender || isApprovedForAll(owner, msg.sender);
    }

    function supportsInterface(bytes4 interfaceId) public view override(AddressResolver, ERC721Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function ownerOf(uint tokenId) public view override(ERC721Upgradeable) returns (address owner) {
        require(expiries[tokenId] > block.timestamp);
        return super.ownerOf(tokenId);
    }

    function nameHash(string memory name) public view override returns(bytes32) {
        return keccak256(bytes(name));
    }

    function valid(string memory name) public pure override returns (bool) {
        return name.strlen() >= 3;
    }

    /**
    * @dev Returns true iff the specified name is available for registration. 
     */
    function available(string memory name) public view override returns (bool) {
        // Not available if it's registered here or in its grace period.
        if (expiries[uint(keccak256(bytes(name)))] + GRACE_PERIOD >= block.timestamp) {
            return false;
        }
        if (passReserved(name)){
            return false;
        }
        return true;
    }

    // Returns true iff the specified name is available for registration.
    function available(uint256 id) public view override returns (bool) {
        // Not available if it's registered here or in its grace period.
        if (expiries[id] + GRACE_PERIOD >= block.timestamp) {
            return false;
        }
        if (passReserved(id)){
            return false;
        }
        return true;
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

    // Returns the expiration timestamp of the specified id.
    function nameExpires(uint256 id) external view override returns (uint256) {
        return expiries[id];
    }

    function makeCommitment(
        string memory name,
        address owner,
        uint256 duration,
        bytes32 secret,
        bytes[] calldata data
    ) public pure override returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256(bytes(name)),
                    owner,
                    duration,
                    data,
                    secret
                )
            );
    }


    function commit(bytes32 commitment) public override {
        require(commitments[commitment] + maxCommitmentAge < block.timestamp, "IC");
        commitments[commitment] = block.timestamp;
    }


    function _consumeCommitment(
        string memory name,
        uint256 duration,
        bytes32 commitment
    ) internal {
        // Require an old enough commitment.
        require(commitments[commitment] + minCommitmentAge <= block.timestamp, "CN");

        // If the commitment is too old, or the name is registered, stop
        require (commitments[commitment] + maxCommitmentAge > block.timestamp, "CO");

        require(available(name), "IN");

        delete (commitments[commitment]);

        require(duration < MIN_REGISTRATION_DURATION, "DS");
    }

    /**
     * @dev Register a name.
     * @param name The address of the tokenId.
     * @param coinType The address crypto type .
     * @param owner The address that should own the registration.
     * @param duration Duration in seconds for the registration.
     */
    function register(
        string calldata name,
        uint256 coinType,
        address owner,
        uint256 duration,
        bytes32 secret,
        bytes[] calldata data
    ) external override returns (uint256) {
        uint256 expires = _register(name, owner, duration, secret, data);

        setAddr(keccak256(bytes(name)), coinType, abi.encodePacked(name));
        return expires;
    }

    function _register(
        string calldata name,
        address owner,
        uint256 duration,
        bytes32 secret,
        bytes[] calldata data
    ) internal returns (uint256) {
        require(available(name));
        require(
            block.timestamp + duration + GRACE_PERIOD >
                block.timestamp + GRACE_PERIOD
        ); // Prevent future overflow

        _consumeCommitment(
            name,
            duration,
            makeCommitment(
                name,
                owner,
                duration,
                secret,
                data
            )
        );

        uint id = uint(keccak256(bytes(name)));
        expiries[id] = block.timestamp + duration;
        if (_exists(id)) {
            // Name was previously owned, and expired
            _burn(id);
        }
        _mint(owner, id);

        emit NameRegistered(id, owner, block.timestamp + duration);

        return block.timestamp + duration;
    }

    function renew(uint256 id, uint256 duration)
        external
        override
        returns (uint256)
    {
        require(expiries[id] + GRACE_PERIOD >= block.timestamp); // Name must be registered here or in grace period
        require(
            expiries[id] + duration + GRACE_PERIOD > duration + GRACE_PERIOD
        ); // Prevent future overflow

        expiries[id] += duration;
        emit NameRenewed(id, expiries[id]);
        return expiries[id];
    }


}