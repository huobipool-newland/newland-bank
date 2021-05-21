// SPDX-License-Identifier: MIT

pragma solidity >=0.5.16;

interface PiggyBreeder {

    event Stake(address indexed user, uint256 indexed pid, uint256 amount);
    event Claim(address indexed user, uint256 indexed pid);
    event UnStake(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event ReplaceMigrate(address indexed user, uint256 pid, uint256 amount);
    event Migrate(address indexed user, uint256 pid, uint256 targetPid, uint256 amount);

    function poolLength() external view returns (uint256);

    function usersLength(uint256 _pid) external view returns (uint256);

    function setDevAddr(address _devAddr) external;

    function setEnableClaimBlock(uint256 _enableClaimBlock) external;

    function setReduceIntervalBlock(uint256 _reduceIntervalBlock, bool _withUpdate) external;

    function stake(uint256 _pid, uint256 _amount) external;

    function unStake(uint256 _pid, uint256 _amount) external;

    function updatePool(uint256 _pid) external;

    function claim(uint256 _pid) external;

    function poolInfo(uint256 _pid) external view returns (address, uint256, uint256, uint256, uint256, address);

    function userInfo(uint256 _pid, address _user) external view returns (uint256, uint256, uint256, bool);

    //mapping(uint256 => mapping(address => UserInfo)) public userInfo;

}
