module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const { deployer, admin } = await ethers.getNamedSigners();
    const { WHT } = await getNamedAccounts();

    let collateralFactor = '300000000000000000';
    let baseRatePerYear = '400000000000000000';
    let multiplierPerYear = '100000000000000000';
    let jumpMultiplierPerYear = '400000000000000000';
    let kink_ = '800000000000000000';
    let initialExchangeRate = '1000000000000000000';
    let reserveFactor = '300000000000000000';

    await deploy('InterestMode_HT', {
        from: deployer.address,
        args: [baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink_],
        log: true,
        contract: 'JumpRateModel',
    });
    let interestMode = await ethers.getContract('InterestMode_HT');
    let comptroller = await ethers.getContract('Comptroller_Unitroller');
    await deploy('CHT', {
        from: deployer.address,
        args: [
            WHT,
            comptroller.address,
            interestMode.address,
            initialExchangeRate,
            "HT's cToken",
            'cHT',
            18,
            admin.address,
        ],
        log: true,
        contract: 'CEther',
    });

    let cToken = await ethers.getContract('CHT');
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

module.exports.tags = ['CHT'];
module.exports.dependencies = ['Comptroller'];
