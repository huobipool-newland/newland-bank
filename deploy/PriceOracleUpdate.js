module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments, getChainId, getUnnamedAccounts, }) {
    /*
    if (!hre.network.tags.test && !hre.network.tags.local) {
        return;
    }
    */

    const {deploy} = deployments;
    let { deployer, admin } = await ethers.getNamedSigners();
    const { Comptroller } = await getNamedAccounts();
    const { cHBTC, cHETH, cWHT, cHPT, cHUSD, cUSDT } = await getNamedAccounts();

    let comptroller = await ethers.getContractAt('ComptrollerG7', Comptroller); 
    let oracleAddress = await comptroller.oracle();
    //console.log("oracleAddress: ", oracleAddress);
    let oracleUnitroller = await ethers.getContractAt('Unitroller', oracleAddress);
    let currentAdmin = await oracleUnitroller.admin();
    //console.log("currentAdmin: ", currentAdmin);
    if (currentAdmin != admin.address && hre.network.tags.local) {
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [currentAdmin],
        });
        admin = await ethers.getSigner(currentAdmin)
    }
    await deploy('PriceOracleProxy', {
        from: deployer.address,
        args: [
        ],
        log: true,
    });
    let oracleProxy = await ethers.getContract('PriceOracleProxy');
    tx = await oracleUnitroller.connect(admin)._setPendingImplementation(oracleProxy.address);
    tx = await tx.wait();
    tx = await oracleProxy.connect(admin)._become(oracleUnitroller.address);
    tx = await tx.wait();
    let oracle = await ethers.getContractAt('PriceOracleProxy', oracleAddress);
    console.log("oracle underlying: ", await oracle.underlying());


};

module.exports.tags = ['PriceOracleUpdate'];
module.exports.dependencies = [];
