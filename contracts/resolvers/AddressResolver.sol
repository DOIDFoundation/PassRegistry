// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

import "./ResolverBase.sol";
import "./IAddressResolver.sol";

contract AddressResolverStorage {
    mapping(bytes32 => mapping(uint256 => bytes)) _addresses;
    mapping(bytes32 => EnumerableSetUpgradeable.UintSet) _nameTypes;

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * The size of the __gap array is calculated so that the amount of storage used by a
     * contract always adds up to the same number (in this case 50 storage slots).
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[48] private __gap;
}

abstract contract AddressResolver is AddressResolverStorage, IAddressResolver, ResolverBase {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.UintSet;

    function setAddr(
        bytes32 node,
        uint256 coinType,
        bytes memory a
    ) public virtual override authorised(node) {
        emit AddressChanged(node, coinType, a);
        _addresses[node][coinType] = a;
        _nameTypes[node].add(coinType);
    }

    function addrs(bytes32 node) public view virtual override returns (TypedAddress[] memory) {
        EnumerableSetUpgradeable.UintSet storage types = _nameTypes[node];
        TypedAddress[] memory ret = new TypedAddress[](types.length());

        for (uint256 index = 0; index < types.length(); index++) {
            uint coinType = types.at(index);
            ret[index].coinType = coinType;
            ret[index].addr = _addresses[node][coinType];
        }
        return ret;
    }

    function addr(
        bytes32 node,
        uint256 coinType
    ) public view virtual override returns (bytes memory) {
        return _addresses[node][coinType];
    }

    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return
            interfaceID == type(IAddressResolver).interfaceId ||
            super.supportsInterface(interfaceID);
    }
}
