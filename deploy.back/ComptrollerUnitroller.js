const network = require('../networks/hceo-self.json');
//部署预言机
module.exports = async ({ ethers,getNamedAccounts,deployments,getChainId,getUnnamedAccounts}) => {
    //预言机
    const {deploy} = deployments;
    const {deployer, admin} = await getNamedAccounts();
    //部署AdminStorage合约
    await deploy('ComptrollerUnitroller', {
        from: deployer,
        args: [],
        log: true,
        contract:'Unitroller'
    });
};

module.exports.tags = ['ComptrollerUnitroller'];
module.exports.dependencies = [];