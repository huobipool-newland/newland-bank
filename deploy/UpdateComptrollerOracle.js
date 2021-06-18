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

    let comptroller = await ethers.getContractAt('ComptrollerG7', Comptroller);
    let currentAdmin = await comptroller.admin();
    //console.log("currentAdmin: ", currentAdmin);
    if (currentAdmin != admin.address && hre.network.tags.local) {
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [currentAdmin],
        });
        admin = await ethers.getSigner(currentAdmin)
    }
    let oracle = await ethers.getContract('PriceOracleProxy');
    let currentOracle = await comptroller.oracle();
    if (currentOracle != oracle.address) {
        //console.log("update oracle");
        tx = await comptroller.connect(admin)._setPriceOracle(oracle.address);
        tx = await tx.wait();
        console.log("update comptroller oracle to " + oracle.address);
        console.dir(tx);
    }

};

module.exports.tags = ['UpdateComptrollerOracle'];
module.exports.dependencies = ['Oracle'];
