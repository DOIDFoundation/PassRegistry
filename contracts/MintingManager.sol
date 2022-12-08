pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol';

import './StringUtils.sol';
import './interfaces/IMintingManager.sol';
import './interfaces/IDoidRegistry.sol';

contract MintingManager is OwnableUpgradeable, AccessControlUpgradeable, PausableUpgradeable, IMintingManager{

    using StringUtils for *;

    IDoidRegistry public doidRegistry;
    
    /**
     * @dev Mapping TLD `namehash` to TLD label
     *
     * `namehash` = uint256(keccak256(abi.encodePacked(uint256(0x0), keccak256(abi.encodePacked(label)))))
     */
    mapping(uint256 => string) internal _tlds;

    /**
     * @dev The modifier checks domain's tld and label on mint.
     * @param tld should be registered.
     * @param label should not have legacy CNS free domain prefix.
     *      Legacy CNS free domain prefix is 'udtestdev-'.
     *      keccak256('udtestdev-') = 0xb551e0305c8163b812374b8e78b577c77f226f6f10c5ad03e52699578fbc34b8
     */
    modifier onlyAllowedSLD(uint256 tld, string memory label) {
        _ensureAllowed(tld, label);
        _;
    }


    function initialize(address doidRegistry_) public initializer {
        doidRegistry = IDoidRegistry(doidRegistry_);
        __Ownable_init();
    }


    function addTld(string calldata tld) external override onlyOwner {
        _addTld(tld);
    }

    function removeTld(uint256 tld) external override onlyOwner {
        require(_isTld(tld), 'MintingManager: TLD_NOT_REGISTERED');

        delete _tlds[tld];
        emit RemoveTld(tld);
    }

    function claim(uint256 tld, string calldata label) external override onlyAllowedSLD(tld, label) whenNotPaused {
        string[] memory empty;
        _issueWithRecords(_msgSender(), _buildLabels(tld, _freeSLDLabel(label)), empty, empty, true);
    }

    function claimTo(
        address to,
        uint256 tld,
        string calldata label
    ) external override onlyAllowedSLD(tld, label) whenNotPaused {
        string[] memory empty;
        _issueWithRecords(to, _buildLabels(tld, _freeSLDLabel(label)), empty, empty, true);
    }

    function claimToWithRecords(
        address to,
        uint256 tld,
        string calldata label,
        string[] calldata keys,
        string[] calldata values
    ) external override onlyAllowedSLD(tld, label) whenNotPaused {
        _issueWithRecords(to, _buildLabels(tld, _freeSLDLabel(label)), keys, values, true);
    }

    function setTokenURIPrefix(string calldata prefix) external override onlyOwner {
        //doidRegistry.setTokenURIPrefix(prefix);
    }


    function _issueWithRecords(
        address to,
        string[] memory labels,
        string[] memory keys,
        string[] memory values,
        bool withReverse
    ) private {
        (uint256 tokenId, ) = _namehash(labels);

        if (doidRegistry.exists(tokenId) && doidRegistry.ownerOf(tokenId) == address(this)) {
            //doidRegistry.unlockWithRecords(to, tokenId, keys, values, withReverse);
        } else {
            _beforeTokenMint(tokenId);

            doidRegistry.mintWithRecords(to, labels, keys, values, withReverse);
        }
    }

    function _buildLabels(uint256 tld, string memory label) private view returns (string[] memory) {
        string[] memory labels = new string[](2);
        labels[0] = label;
        labels[1] = _tlds[tld];
        return labels;
    }

    function _freeSLDLabel(string calldata label) private pure returns (string memory) {
        return string(abi.encodePacked('uns-devtest-', label));
    }


    function _namehash(uint256 tokenId, string memory label) internal pure returns (uint256) {
        require(bytes(label).length != 0, 'MintingManager: LABEL_EMPTY');
        return uint256(keccak256(abi.encodePacked(tokenId, keccak256(abi.encodePacked(label)))));
    }

    function _namehash(string[] memory labels) internal pure returns (uint256 tokenId, uint256 parentId) {
        for (uint256 i = labels.length; i > 0; i--) {
            parentId = tokenId;
            tokenId = _namehash(parentId, labels[i - 1]);
        }
    }

    function _beforeTokenMint(uint256 tokenId) private {
        //require(isBlocked(tokenId) == false, 'MintingManager: TOKEN_BLOCKED');
        //_block(tokenId);
    }

    function _ensureAllowed(uint256 tld, string memory label) private view {
        require(_isTld(tld), 'MintingManager: TLD_NOT_REGISTERED');
        StringUtils.Slice memory _label = label.toSlice();
        if (_label._len > 10) {
            require(
                _label.slice(0, 10).keccak() != 0xb551e0305c8163b812374b8e78b577c77f226f6f10c5ad03e52699578fbc34b8,
                'MintingManager: TOKEN_LABEL_PROHIBITED'
            );
        }
        require(_isValidLabel(label), 'MintingManager: LABEL_INVALID');
    }


    /**
     * @dev The function adds TLD and mint token in UNS Registry.
     * Current MintingManager has '.crypto' TLD registered, but UNS Registry does not have '.crypto' token.
     * It leads to revert on mint.
     * The function can be executed in order to mint '.crypto' token in UNS registry, while TLD already registered.
     * Sideffect: It is possible to add the same TLD multiple times, it will burn gas.
     */
    function _addTld(string memory tld) private {
        uint256 tokenId = _namehash(uint256(0x0), tld);

        _tlds[tokenId] = tld;
        emit NewTld(tokenId, tld);

        if (!doidRegistry.exists(tokenId)) {
            doidRegistry.mintTLD(tokenId, tld);
        }
    }

    /**
     * @dev This function checks whether TLD exists
     */
    function _isTld(uint256 tld) private view returns (bool) {
        return bytes(_tlds[tld]).length > 0;
    }

    /**
     * The label must contains letters, digits, and hyphen.
     */
    function _isValidLabel(string memory str) private pure returns (bool) {
        if (bytes(str).length == 0) {
            return false;
        }

        uint256 ptr;
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            ptr := add(str, 0x20)
        }

        for (uint256 i = 0; i < bytes(str).length; i++) {
            uint8 data = _charAt(ptr, i);
            if (
                data != 45 && // hyphen (-)
                !(data >= 48 && data <= 57) && // 0-9
                !(data >= 97 && data <= 122) // a-z
            ) {
                return false;
            }
        }
        return true;
    }

    function _charAt(uint256 ptr, uint256 index) private pure returns (uint8) {
        bytes1 ptrdata;
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            ptrdata := mload(add(ptr, index))
        }
        return uint8(ptrdata);
    }


}