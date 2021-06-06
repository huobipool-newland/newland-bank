module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const { deployer, admin } = await ethers.getNamedSigners();

    await deploy('CErc20Delegate', {
        from: deployer.address,
        args: [],
        log: true,
        contract: 'CErc20Delegate',
    });
};

module.exports.tags = ['CErc20Delegate'];
module.exports.dependencies = [];
