module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const { deployer, admin } = await ethers.getNamedSigners();
    const { HUSD } = await getNamedAccounts();

    let collateralFactor = '700000000000000000';
    let baseRatePerYear = '120000000000000000';
    let multiplierPerYear = '100000000000000000';
    let jumpMultiplierPerYear = '400000000000000000';
    let kink_ = '800000000000000000';
    let initialExchangeRate = '1000000000000000000';
    let reserveFactor = '200000000000000000';
    
    await deploy('InterestMode_HUSD', {
        from: deployer.address,
        args: [baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink_],
        log: true,
        contract: 'JumpRateModel',
    });

    let interestMode = await ethers.getContract('InterestMode_HUSD');
    let cErc20Delegate = await ethers.getContract('CErc20Delegate');
    let comptroller = await ethers.getContract('Comptroller_Unitroller');
    await deploy('CHUSD', {
        from: deployer.address,
        args: [
            HUSD,
            comptroller.address,
            interestMode.address,
            initialExchangeRate,
            "HUSD's cToken",
            'cHUSD',
            8,
            admin.address,
            cErc20Delegate.address,
            '0x',
        ],
        log: true,
        contract: 'CErc20Delegator',
    });

    let cToken = await ethers.getContract('CHUSD');
    comptroller = await ethers.getContractAt('Comptroller', comptroller.address);
    tx = await comptroller.connect(admin)._supportMarket(cToken.address);
    tx = await tx.wait();

    tx = await comptroller.connect(admin)._setCollateralFactor(cToken.address, collateralFactor);
    tx = await tx.wait();

    tx = await cToken.connect(admin)._setReserveFactor(reserveFactor);
    tx = await tx.wait();

    tx = await comptroller.connect(admin)._addCompMarkets([cToken.address]);
    tx = await tx.wait();

};

module.exports.tags = ['CHUSD'];
module.exports.dependencies = ['CErc20Delegate', 'Comptroller'];
