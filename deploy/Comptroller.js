
const network = require('../networks/hceo-test.json');
//部署预言机
module.exports = async ({ ethers,getNamedAccounts,deployments,getChainId,getUnnamedAccounts}) => {
    //预言机
    const {deploy} = deployments;
    const {deployer, admin} = await getNamedAccounts();
    //部署AdminStorage合约
    await deploy('Comptroller', {
        from: deployer,
        args: [],
        log: true,
    });
    console.log("Comptroller合约部署完成..")
};

module.exports.tags = ['Comptroller'];
module.exports.dependencies = [];