// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

/**
 * Interface for the new (multicoin) addr function.
 */
interface IAddressResolver {
    event AddressChanged(bytes32 indexed node, uint256 coinType, bytes newAddress);

    struct TypedAddress {
        uint256 coinType;
        bytes addr;
    }

    function setAddr(bytes32 node, uint256 coinType, bytes memory a) external;

    function addr(bytes32 node, uint256 coinType) external view returns (bytes memory);

    /**
     * @dev returns all address bytes for all cointypes for a node
     * @param node request node.
     * @return TypedAddress array of all addresses with type.
     */
    function addrs(bytes32 node) external view returns (TypedAddress[] memory);
}
