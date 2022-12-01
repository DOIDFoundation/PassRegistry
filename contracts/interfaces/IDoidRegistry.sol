
// SPDX-License-Identifier: None
pragma solidity >=0.8.4;

import "./IReverseRegistry.sol";
import "./IResolver.sol";

interface IDoidRegistry is 
    IReverseRegistry,
    IResolver
{
    event NewURI(uint256 indexed tokenId, string uri);

    event NewURIPrefix(string prefix);

    /**
     * @dev 通过tokenId，获取resolver地址
     * @param tokenId uint256 ID of the token to query the resolver of
     * @return address currently marked as the resolver of the given token ID
     */
    function resolverOf(uint256 tokenId) external view returns (address);

    /**
     * @notice 通过name labels 计算nameHash
     * @param labels array of domain labels splitted by '.' (for `aaa.bbb.crypto` it will be [`aaa`, `bbb`, `crypto`])
     */
    function namehash(string[] calldata labels) external pure returns (uint256);

    /**
     * @dev Existence of token.
     * @param tokenId uint256 ID of the token
     */
    function exists(uint256 tokenId) external view returns (bool);

    /**
     * @dev Transfer domain ownership without resetting domain records.
     * @param to address of new domain owner
     * @param tokenId uint256 ID of the token to be transferred
     */
    function setOwner(address to, uint256 tokenId) external;

 
    /**
     * @dev Burns `tokenId`. See {ERC721-_burn}.
     *
     * Requirements:
     *
     * - The caller must own `tokenId` or be an approved operator.
     */
    function burn(uint256 tokenId) external;

    /**
     * @dev Mints root token.
     * @param tokenId id of TLD token.
     * @param uri TLD URI.
     */
    function mintTLD(uint256 tokenId, string calldata uri) external;

    /**
    * @dev mint token with a pass
    * @param to mint to
    * @param passId used passid
     */
    function mintWithPassId(
        address to,
        uint passId
    ) external;

    /**
    * @dev batch mint with passId
    * @param to mint to
    * @param passIds used passid
     */
    function mintWithPassIds(
        address to,
        uint[] calldata passIds
    ) external;

    /**
     * @dev mints token with records
     * @param to address to mint the new SLD or subdomain to
     * @param labels array of SLD or subdomain name labels splitted by '.' to mint.
     * @param keys New record keys
     * @param values New record values
     * @param withReverse Flag whether to install reverse resolution
     */
    function mintWithRecords(
        address to,
        string[] calldata labels,
        string[] calldata keys,
        string[] calldata values,
        bool withReverse
    ) external;

    /**
     * @dev Adds ProxyReader address
     * @param addr address of ProxyReader
     */
    function addProxyReader(address addr) external;
    
}