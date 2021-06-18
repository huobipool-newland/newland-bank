module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const { deployer, admin } = await ethers.getNamedSigners();
    const { oracleFeeder, SimplePriceOracle } = await getNamedAccounts();
    //console.log(oracleFeeder);
    /*
    await deploy('SimplePriceOracle', {
        from: deployer.address,
        args: [oracleFeeder],
        log: true,
    });
    */
    await deploy('PriceOracleProxy_Impl', {
        from: deployer.address,
        args: [],
        log: true,
        contract: 'PriceOracleProxy',
    });

    await deploy('PriceOracleProxy', {
        from: deployer.address,
        args: [],
        log: true,
        contract: 'Unitroller',
    });
    let priceOracleProxyImpl = await ethers.getContract('PriceOracleProxy_Impl');
    let priceOracleProxy = await ethers.getContract('PriceOracleProxy');
    tx = await priceOracleProxy.connect(deployer)._setPendingImplementation(priceOracleProxyImpl.address);
    tx = await tx.wait();
    tx = await priceOracleProxyImpl.connect(deployer)._become(priceOracleProxy.address);
    tx = await tx.wait();

    tx = await priceOracleProxy.connect(deployer)._setPendingAdmin(admin.address);
    tx = await tx.wait();
    tx = await priceOracleProxy.connect(admin)._acceptAdmin();
    tx = await tx.wait();

    let simplePriceOracle = await ethers.getContractAt('SimplePriceOracle', SimplePriceOracle);
    let priceOracle = await ethers.getContractAt('PriceOracleProxy', priceOracleProxy.address);
    tx = await priceOracle.connect(admin)._setUnderlying(simplePriceOracle.address);
    tx = await tx.wait();
};

module.exports.tags = ['Oracle'];
module.exports.dependencies = [];
