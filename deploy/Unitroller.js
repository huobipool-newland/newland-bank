
//部署预言机
module.exports = async ({ ethers,getNamedAccounts,deployments,getChainId,getUnnamedAccounts}) => {
    //预言机
    const {deploy,execute} = deployments;
    const {deployer, admin} = await getNamedAccounts();
    //部署AdminStorage合约
    await deploy('Unitroller', {
        from: deployer,
        args: [],
        log: true,
    });
};


module.exports.tags = ['Unitroller'];