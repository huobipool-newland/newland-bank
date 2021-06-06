module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const { deployer, admin } = await ethers.getNamedSigners();

    await deploy('Comptroller_G4', {
        from: deployer.address,
        args: [],
        log: true,
        contract: 'Comptroller',
    });

    await deploy('Comptroller_Unitroller', {
        from: deployer.address,
        args: [],
        log: true,
        contract: 'Unitroller',
    });

    let comptroller = await ethers.getContract('Comptroller_G4');
    let unitroller = await ethers.getContract('Comptroller_Unitroller');
    tx = await unitroller.connect(deployer)._setPendingImplementation(comptroller.address);
    tx = await tx.wait();
    tx = await comptroller.connect(deployer)._become(unitroller.address);
    tx = await tx.wait();
    
    tx = await unitroller.connect(deployer)._setPendingAdmin(admin.address);
    tx = await tx.wait();
    tx = await unitroller.connect(admin)._acceptAdmin();
    tx = await tx.wait();

    comptroller = await ethers.getContractAt('Comptroller', unitroller.address);
    let priceOracleUnitroller = await ethers.getContract('PriceOracleProxy');
    let oracle = await ethers.getContractAt('PriceOracleProxy', priceOracleUnitroller.address);
    tx = await comptroller.connect(admin)._setPriceOracle('0x3b0aB04fAD35e464346E67254e5992f4Db1F6AF8'/*oracle.address*/);
    tx = await tx.wait();

    tx = await comptroller.connect(admin)._setMaxAssets(10);
    tx = await tx.wait();

    tx = await comptroller.connect(admin)._setCloseFactor('800000000000000000');
    tx = await tx.wait();

    tx = await comptroller.connect(admin)._setLiquidationIncentive('1100000000000000000');
    tx = await tx.wait();
};

module.exports.tags = ['Comptroller'];
module.exports.dependencies = ['Oracle'];
