module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    /*
    if (!hre.network.tags.test && !hre.network.tags.local) {
        return;
    }
    */
    const {deploy} = deployments;
    const { deployer, admin } = await ethers.getNamedSigners();
    const { Comptroller } = await getNamedAccounts();

    await deploy('WePiggyToken', {
        from: deployer.address,
        args: [
        ],
        log: true,
    });

    let token = await ethers.getContract('WePiggyToken');
    await deploy('PiggyBreeder', {
        from: deployer.address,
        args: [
            token.address, '0xf23486eA173b9e5a7b73C180651c95b1CBF169B2', '2000000000000000000', 5372592, 5372592, '28800',  '1', '1'
        ],
        log: true,
        contract: 'PiggyBreederContract',
    });

    let piggyBreeder = await ethers.getContract('PiggyBreeder');
    await token.connect(deployer).grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')), piggyBreeder.address);
    
    await deploy('MockToken0', {
        from: deployer.address,
        args: [
        ],
        log: true,
        contract: 'WePiggyToken',
    });
    let mockToken0 = await ethers.getContract('MockToken0');
    tx = await mockToken0.connect(deployer).grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')), deployer.address);
    tx = await tx.wait();
    tx = await mockToken0.connect(deployer).mint(Comptroller, '1000000000000000000');
    tx = await tx.wait();
    tx = await piggyBreeder.connect(deployer).add('1000', mockToken0.address, '0x0000000000000000000000000000000000000000', true);
    tx = await tx.wait();

    await deploy('MockToken1', {
        from: deployer.address,
        args: [
        ],
        log: true,
        contract: 'WePiggyToken',
    });
    let mockToken1 = await ethers.getContract('MockToken1');
    tx = await mockToken1.connect(deployer).grantRole(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('MINTER_ROLE')), deployer.address);
    tx = await tx.wait();
    tx = await mockToken1.connect(deployer).mint(Comptroller, '1000000000000000000');
    tx = await tx.wait();
    tx = await piggyBreeder.connect(deployer).add('1000', mockToken1.address, '0x0000000000000000000000000000000000000000', true);
    tx = await tx.wait();
};

module.exports.tags = ['Breeder'];
module.exports.dependencies = [''];
