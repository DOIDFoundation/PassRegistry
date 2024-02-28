// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

contract DoidTimeLock {
    struct StakingInfo {
        bool queued;
        uint amount;
        uint timestamp;
    }
    error NotOwnerError();
    error AlreadyQueuedError(address user);
    error TimestampNotInRangeError(uint blockTimestamp, uint timestamp);
    error NotQueuedError(address user);
    error TimestampNotPassedError(uint blockTimestmap, uint timestamp);
    error TimestampExpiredError(uint blockTimestamp, uint expiresAt);
    error TxFailedError();

    event Queue(
        address indexed target,
        uint value,
        uint timestamp
    );
    event Execute(
        address indexed target,
        uint value,
        uint timestamp
    );
    event EmergencyWithdraw(address user, uint amount);

    uint public constant MIN_DELAY = 3600; // seconds
    uint public constant MAX_DELAY = 365 * 24 * 3600; // seconds
    uint public constant GRACE_PERIOD = 10; // seconds

    address public owner;
    mapping(address => StakingInfo) public userStaking;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwnerError();
        }
        _;
    }

    receive() external payable {}

    function getQueue(address _user) public view  returns (bool _queued, uint _amount, uint _timestamp){
        _queued = userStaking[_user].queued;
        _amount = userStaking[_user].amount;
        _timestamp = userStaking[_user].timestamp;
    }

    function queue(uint _timestamp)external payable{
        if(userStaking[msg.sender].queued){
            revert AlreadyQueuedError(msg.sender);
        }
        if (
            _timestamp < block.timestamp + MIN_DELAY ||
            _timestamp > block.timestamp + MAX_DELAY
        ) {
            revert TimestampNotInRangeError(block.timestamp, _timestamp);
        }

        userStaking[msg.sender] = StakingInfo({queued: true, amount:msg.value, timestamp: _timestamp});
        emit Queue(msg.sender, msg.value, _timestamp);
    }

    function execute() external payable returns (bytes memory) {
        if (!userStaking[msg.sender].queued){
            revert NotQueuedError(msg.sender);
        }

        // ----|-------------------|-------
        //  timestamp    timestamp + grace period
        uint _timestamp = userStaking[msg.sender].timestamp;
        if (block.timestamp < _timestamp) {
            revert TimestampNotPassedError(block.timestamp, _timestamp);
        }
        if (block.timestamp > _timestamp + GRACE_PERIOD) {
            revert TimestampExpiredError(block.timestamp, _timestamp + GRACE_PERIOD);
        }

        userStaking[msg.sender].queued = false;

        // call target
        (bool ok, bytes memory res) = msg.sender.call{value: userStaking[msg.sender].amount}("");
        if (!ok) {
            revert TxFailedError();
        }

        emit Execute(msg.sender, userStaking[msg.sender].amount, _timestamp);

        return res;
    }

    function emergencyWithdraw(uint _amount) external onlyOwner returns (bytes memory) {
        (bool ok, bytes memory res) = msg.sender.call{value: _amount}("");
        if (!ok) {
            revert TxFailedError();
        }
        emit EmergencyWithdraw(msg.sender, _amount);
        return res;
    }
}

