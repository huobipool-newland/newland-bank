module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const { deployer, admin } = await ethers.getNamedSigners();
    //部署AdminStorage合约
    let deployResult = await deploy('Comptroller', {
        from: deployer.address,
        args: [],
        log: true,
    });
};

module.exports.tags = ['Comptroller'];
module.exports.dependencies = [];
