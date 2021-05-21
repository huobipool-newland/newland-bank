
const network = require('../networks/hceo-test.json');
//部署预言机
module.exports = async ({ ethers,getNamedAccounts,deployments,getChainId,getUnnamedAccounts}) => {
    //预言机
    const {deploy} = deployments;
    const {deployer, admin} = await getNamedAccounts();
    //部署AdminStorage合约

    let tokens = network['Tokens'];
    for (let token in network['Tokens']) {
        token = tokens[token];
        await deploy('CErc20Delegate_'+token.name, {
            from: deployer,
            args: [],
            log: true,
            contract:'CErc20Delegate'
        });
    }

};

module.exports.tags = ['CErc20DelegateTokens'];
module.exports.dependencies = [];