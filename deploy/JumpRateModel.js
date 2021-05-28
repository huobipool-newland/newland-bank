
const network = require('../networks/hceo-self.json');
//部署预言机
module.exports = async ({ ethers,getNamedAccounts,deployments,getChainId,getUnnamedAccounts}) => {
    //预言机
    const {deploy} = deployments;
    const {deployer, admin} = await getNamedAccounts();
    //部署AdminStorage合约

    let tokens = network['Tokens'];
    for (let token in network['Tokens']) {
        token = tokens[token];
        await deploy('JumpRateModel_'+token.name, {
            from: deployer,
            args: [token.baseRatePerYear,token.multiplierPerYear,token.jumpMultiplierPerYear,token.kink_],
            log: true,
            contract:'JumpRateModel'
        });
    }
};

module.exports.tags = ['JumpRateModelTokens'];
module.exports.dependencies = [];