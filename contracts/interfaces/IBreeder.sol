// SPDX-License-Identifier: MIT

pragma solidity >=0.5.16;
pragma experimental ABIEncoderV2;

interface IBreeder {

    // Info of each user.
    struct UserInfo {
        uint256 amount;     // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt.
        uint256 pendingReward;
        bool unStakeBeforeEnableClaim;
    }

    // Info of each pool.
    struct PoolInfo {
        address lpToken;           // Address of LP token contract.
        uint256 allocPoint;       // How many allocation points assigned to this pool. PiggyTokens to distribute per block.
        uint256 lastRewardBlock;  // Last block number that PiggyTokens distribution occurs.
        uint256 accPiggyPerShare; // Accumulated PiggyTokens per share, times 1e12. See below.
        uint256 totalDeposit;       // Accumulated deposit tokens.
        address migrator;
    }

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

    //function poolInfo(uint256 _pid) external view returns (address, uint256, uint256, uint256, uint256, address);

    //function userInfo(uint256 _pid, address _user) external view returns (uint256, uint256, uint256, bool);

    //mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    function pendingPiggy(uint256 _pid, address _user) external view returns (uint256);

    function poolInfo(uint256 _pid) external view returns (PoolInfo memory);

    function userInfo(uint256 _pid, address _user) external view returns (UserInfo memory);

    function startBlock() external view returns (uint);

    function reduceIntervalBlock() external view returns (uint);

    function totalAllocPoint() external view returns (uint);

    function getPiggyPerBlock(uint256 _power) external view returns (uint256);

}
