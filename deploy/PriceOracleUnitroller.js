const network = require('../networks/hceo-self.json');
//部署预言
module.exports = async ({ ethers,getNamedAccounts,deployments,getChainId,getUnnamedAccounts}) => {
    //预言机
    const {deploy,execute} = deployments;
    const {deployer, admin} = await getNamedAccounts();
    //部署AdminStorage合约
    await deploy('PriceOracleUnitroller', {
        from: deployer,
        args: [],
        log: true,
        contract:'Unitroller'
    });
};

module.exports.tags = ['PriceOracleUnitroller'];
module.exports.dependencies = [];