module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments, getChainId, getUnnamedAccounts, }) {
    if (!hre.network.tags.test && !hre.network.tags.local) {
        return;
    }
    const {deploy} = deployments;
    let { deployer, admin } = await ethers.getNamedSigners();
    const { Comptroller } = await getNamedAccounts();

    let deployResult = await deploy('ClaimLens', {
        from: deployer.address,
        args: [
        ],
        log: true,
    });

    let claimLens = await ethers.getContract('ClaimLens');
    tx = await claimLens.setComptroller(Comptroller);
    tx = await tx.wait();
};

module.exports.tags = ['ClaimLens'];
module.exports.dependencies = [];
