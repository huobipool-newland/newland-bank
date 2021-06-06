module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    if (!hre.network.tags.test && !hre.network.tags.local) {
        return;
    }
    const {deploy} = deployments;
    const { deployer, admin } = await ethers.getNamedSigners();
    let deployResult = await deploy('WePiggyToken', {
        from: deployer.address,
        args: [
        ],
        log: true,
    });

    let token = await ethers.getContract('WePiggyToken');
    await deploy('PiggyBreeder', {
        from: deployer.address,
        args: [
            token.address, deployer.address, '1000000000000000000', 4899536, 4899536, '1',  '1000', '1'
        ],
        log: true,
        contract: 'PiggyBreederContract',
    });

    let piggyBreeder = await ethers.getContract('PiggyBreeder');
    await token.grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')), piggyBreeder.address);
    //await token.connect(deployer).mint(piggyBreeder.address, '1000000000000000000000000000');
    
    let hbtc = '0x1d8684e6cdd65383affd3d5cf8263fcda5001f13';
    await piggyBreeder.add('1000', hbtc, '0x0000000000000000000000000000000000000000', true);
    //function add(uint256 _allocPoint, IERC20 _lpToken, IMigrator _migrator, bool _withUpdate) public onlyOwner {
};

module.exports.tags = ['Breeder'];
module.exports.dependencies = [''];
