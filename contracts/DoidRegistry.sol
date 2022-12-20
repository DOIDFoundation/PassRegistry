
// SPDX-License-Identifier: None
pragma solidity >=0.8.4;

import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';

import './interfaces/IDoidRegistry.sol';
import './interfaces/IPassRegistry.sol';
import './resolvers/AddressResolver.sol';
import './StringUtils.sol';

contract DoidRegistryStorage {

    uint256 public constant GRACE_PERIOD = 90 days;
    IPassRegistry passReg;

    // A map of expiry times
    mapping(uint256 => uint256) expiries;

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

    function initialize (address passRegistry) public initializer {
        passReg = IPassRegistry(passRegistry);
    }

    function isAuthorised(bytes32 node) internal view override returns (bool) {
        // @TODO: fix this
        address owner = address(0);//owner(node);
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

    function valid(string memory name) public pure override returns (bool) {
        return name.strlen() >= 3;
    }

    /**
    * @dev Returns true iff the specified name is available for registration. 
     */
    function available(string memory name) public view override returns (bool) {
        return available(uint(keccak256(bytes(name))));
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
        if(owner == msg.sender || owner == address(0)){
            return true;
        }
        return false;
    }

    // Returns the expiration timestamp of the specified id.
    function nameExpires(uint256 id) external view override returns (uint256) {
        return expiries[id];
    }


    /**
     * @dev Register a name.
     * @param name The address of the tokenId.
     * @param coinType The address crypto type .
     * @param id The token ID (keccak256 of the label).
     * @param owner The address that should own the registration.
     * @param duration Duration in seconds for the registration.
     */
    function register(
        string calldata name,
        uint256 coinType,
        uint256 id,
        address owner,
        uint256 duration
    ) external override returns (uint256) {
        uint256 expires = _register(id, owner, duration, true);

        setAddr(keccak256(bytes(name)), coinType, abi.encodePacked(name));
        return expires;
    }

    function _register(
        uint256 id,
        address owner,
        uint256 duration,
        bool updateRegistry
    ) internal returns (uint256) {
        require(available(id));
        require(
            block.timestamp + duration + GRACE_PERIOD >
                block.timestamp + GRACE_PERIOD
        ); // Prevent future overflow

        expiries[id] = block.timestamp + duration;
        if (_exists(id)) {
            // Name was previously owned, and expired
            _burn(id);
        }
        _mint(owner, id);
//        if (updateRegistry) {
//            ens.setSubnodeOwner(baseNode, bytes32(id), owner);
//        }

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