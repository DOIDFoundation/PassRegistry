// SPDX-License-Identifier: None
pragma solidity >=0.8.4;

interface IDoidRegistry {
    event NameRegistered(uint256 indexed id, string name, address indexed owner);
    event MainAddrChanged(bytes32 indexed node, address indexed newAddress, bytes newIPNS);

    struct DoidInfo {
        uint256 tokenId;
        string name;
    }

    /**
     * @dev Request user's tokens
     * @return tokenIds.
     */
    function tokensOfOwner(address _user) external view returns (uint256[] memory);

    /**
     * @dev Request user's names
     * @return names with tokenId.
     */
    function namesOfOwner(address _user) external view returns (DoidInfo[] memory);

    /**
     * @dev Request status of a name
     * @return status 'available' or 'registered' or 'locked', or 'reserved'.
     * @return owner address that owns or locks this name
     * @return id token id of name (if registered) or pass (if locked) or 0 (if available or reserved).
     */
    function statusOfName(
        string memory name
    ) external view returns (string memory status, address owner, uint id);

    function nameHash(string memory name) external view returns (bytes32);

    function valid(string memory name) external pure returns (bool);

    function available(string memory name) external view returns (bool);

    function available(uint256 id) external view returns (bool);

    function register(string calldata name, address owner) external;

    function register(string calldata name, address owner, bytes memory ipns) external;

    /**
     * @dev Make a messge to sign for setting main address.
     * @param name name to set address.
     * @param a address to set.
     * @param timestamp signature will expire after 24 hours since timestamp.
     * @param nonce nonce.
     * @return message to sign.
     */
    function makeMainAddrMessage(
        string memory name,
        address a,
        uint256 timestamp,
        uint256 nonce
    ) external returns (string memory);

    function setMainAddrAndIPNS(
        string memory name,
        address a,
        uint256 timestamp,
        uint256 nonce,
        bytes memory signature,
        bytes memory ipns
    ) external;

    /**
     * @dev Claim a locked name for PassRegistry.
     * @notice Can only be called by PassRegistry.
     */
    function claimLockedName(string memory name, address owner) external;
}
