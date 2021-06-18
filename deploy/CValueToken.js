module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    let { deployer, admin } = await ethers.getNamedSigners();
    const { Comptroller } = await getNamedAccounts();
    let valueToken = await ethers.getContract('ValueToken');
    let collateralFactor = '800000000000000000';
    let baseRatePerYear = '400000000000000000';
    let multiplierPerYear = '100000000000000000';
    let jumpMultiplierPerYear = '400000000000000000';
    let kink_ = '800000000000000000';
    let initialExchangeRate = '1000000000000000000';
    let reserveFactor = '300000000000000000';
    
    await deploy('InterestMode_ValueToken', {
        from: deployer.address,
        args: [baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink_],
        log: true,
        contract: 'JumpRateModel',
    });

    let interestMode = await ethers.getContract('InterestMode_ValueToken');
    let cErc20Delegate = await ethers.getContract('CErc20Delegate');
    let comptroller = await ethers.getContractAt('Unitroller', Comptroller);
    //let comptroller = await ethers.getContract('Comptroller_Unitroller');
    let currentAdmin = await comptroller.admin();
    //console.log("currentAdmin: ", currentAdmin);
    let oldAdmin = admin;
    if (currentAdmin != admin.address && hre.network.tags.local) {
        //console.log("test123", currentAdmin);
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [currentAdmin],
        });
        admin = await ethers.getSigner(currentAdmin)
    }
    await deploy('CValueToken', {
        from: deployer.address,
        args: [
            valueToken.address,
            comptroller.address,
            interestMode.address,
            initialExchangeRate,
            "NVALUE's cToken",
            'cNVALUE',
            18,
            oldAdmin.address,
            cErc20Delegate.address,
            '0x',
        ],
        log: true,
        contract: 'CErc20Delegator',
    });
    let cToken = await ethers.getContract('CValueToken');
    comptroller = await ethers.getContractAt('ComptrollerG7', comptroller.address);
    //console.log("admin: ", admin.address);
    tx = await comptroller.connect(admin)._supportMarket(cToken.address);
    tx = await tx.wait();

    tx = await comptroller.connect(admin)._setCollateralFactor(cToken.address, collateralFactor);
    tx = await tx.wait();

    tx = await cToken.connect(oldAdmin)._setReserveFactor(reserveFactor);
    tx = await tx.wait();
};

module.exports.tags = ['CValueToken'];
module.exports.dependencies = ['ValueToken', 'CErc20Delegate'];
