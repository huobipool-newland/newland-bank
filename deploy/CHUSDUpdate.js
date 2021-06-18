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
    const { cHUSD } = await getNamedAccounts();

    let cErc20Delegator = await ethers.getContractAt('CErc20Delegator', cHUSD);
    let cErc20Delegate = await ethers.getContract('CErc20Delegate');

    let currentAdmin = await cErc20Delegator.admin();
    //console.log("currentAdmin: ", currentAdmin);
    if (currentAdmin != admin.address && hre.network.tags.local) {
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [currentAdmin],
        });
        admin = await ethers.getSigner(currentAdmin)
    }

    tx = await cErc20Delegator.connect(admin)._setImplementation(cErc20Delegate.address, false, '0x');
    tx = await tx.wait();
};

module.exports.tags = ['CHUSDUpdate'];
module.exports.dependencies = ['CErc20Delegate'];
