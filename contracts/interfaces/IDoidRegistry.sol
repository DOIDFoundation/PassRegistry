
// SPDX-License-Identifier: None
pragma solidity >=0.8.4;

interface IDoidRegistry {
    event NameMigrated(
        uint256 indexed id,
        address indexed owner,
        uint256 expires
    );
    event NameRegistered(
        uint256 indexed id,
        address indexed owner,
        uint256 expires
    );
    event NameRenewed(uint256 indexed id, uint256 expires);

    function valid(string memory name) external pure returns (bool);

    function available(string memory name) external view returns (bool);

    function available(uint256 id) external view returns (bool);

    function nameExpires(uint256 id) external view returns (uint256);

    function makeCommitment(
        string memory name,
        address owner,
        uint256 duration,
        bytes32 secret,
        bytes[] calldata data
    ) external pure returns (bytes32);

 
    function commit(bytes32 commitment) external;

    function register(
        string calldata name,
        uint256 coinType,
        address owner,
        uint256 duration,
        bytes32 secret,
        bytes[] calldata data
    ) external returns (uint256);

    function renew(uint256 id, uint256 duration)
        external returns (uint256);
 
}