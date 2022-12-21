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

    /**
     * Returns the address associated with the node.
     * @param node The node to query.
     * @return The associated address.
     */
    function addr(bytes32 node)
        public
        view
        virtual
        override
        returns (address payable)
    {
        bytes memory a = addr(node, COIN_TYPE_ETH);
        if (a.length == 0) {
            return payable(0);
        }
        return bytesToAddress(a);
    }

    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return
            interfaceID == type(IAddressResolver).interfaceId ||
            super.supportsInterface(interfaceID);
    }

    function bytesToAddress(bytes memory b)
        internal
        pure
        returns (address payable a)
    {
        require(b.length == 20);
        assembly {
            a := div(mload(add(b, 32)), exp(256, 12))
        }
    }

    function addressToBytes(address a) internal pure returns (bytes memory b) {
        b = new bytes(20);
        assembly {
            mstore(add(b, 32), mul(a, exp(256, 12)))
        }
    }
}
