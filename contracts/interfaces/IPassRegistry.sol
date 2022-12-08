
pragma solidity ^0.8.0;

interface IPassRegistry {
    function getUserInvitedNumber(address _user) external view returns (uint, uint);

    function getNameByHash(bytes32 _hash) external view returns (string memory);

    function getUserByHash(bytes32 _hash) external view returns (address);


}