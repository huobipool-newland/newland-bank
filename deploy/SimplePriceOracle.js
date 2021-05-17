
const network = require('../networks/heco-self.json');
//部署预言机
module.exports = async ({ ethers,getNamedAccounts,deployments,getChainId,getUnnamedAccounts}) => {
    //预言机
    const {deploy} = deployments;
    const {deployer, admin} = await getNamedAccounts();
    //部署AdminStorage合约
    await deploy('SimplePriceOracle', {
        from: deployer,
        args: [network.Admins.priceOracleFeeder],
        log: true,
    });
};

module.exports.tags = ['SimplePriceOracle'];
module.exports.dependencies = [];