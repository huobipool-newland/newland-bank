
//部署预言机
module.exports = async ({ ethers,getNamedAccounts,deployments,getChainId,getUnnamedAccounts}) => {
    //预言机
    const {deploy} = deployments;
    const {deployer, admin} = await getNamedAccounts();
    const Unitroller =await deployments.get('Unitroller');
    const uAddress=Unitroller.address;
    //部署AdminStorage合约
    let priceOracle = new PriceOracleProxy(uAddress);


};

module.exports.tags = ['PriceOracle'];
module.exports.dependencies = ['Unitroller'];