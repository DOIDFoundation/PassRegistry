
import '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';

pragma solidity ^0.8.0;

interface IPassRegistry is IERC721Upgradeable{
    struct PassInfo {
        uint passId;
        bytes32 passClass;
        bytes32 passHash;
    }
 
    function getUserInvitedNumber(address _user) external view returns (uint, uint);

    function getNameByHash(bytes32 _hash) external view returns (string memory);

    function getUserByHash(bytes32 _hash) external view returns (address);

    function getUserPassInfo(uint _passId) external view returns (PassInfo memory);
}