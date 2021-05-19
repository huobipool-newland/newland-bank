const network = require('../networks/hceo-test.json');
//部署预言机
module.exports = async ({ ethers,getNamedAccounts,deployments,getChainId,getUnnamedAccounts}) => {
    //预言机
    const {deploy} = deployments;
    const {deployer, admin} = await getNamedAccounts();
    //部署AdminStorage合约

    const comptroller =await deployments.get('Comptroller');
    let tokens = network['Tokens'];
    for (let token in network['Tokens']) {
        token = tokens[token];
        const jumpRateModel_Token =await deployments.get('JumpRateModel_'+token.name);
        const cErc20Delegate_Token =await deployments.get('CErc20Delegate_'+token.name);
        await deploy('CErc20Delegator_'+token.name, {
            from: deployer,
            args: [
                token.contract,
                comptroller.address,
                jumpRateModel_Token.address,
                token.initialExchangeRate,
                token.name + "'s cToken",
                'c' + token.name,
                18,
                deployer,
                cErc20Delegate_Token.address,
                '0x'
            ],
            log: true,
            contract:'CErc20Delegator'
        });
    }
};

module.exports.tags = ['CErc20DelegatorTokens'];
module.exports.dependencies = ['CErc20Delegate','ComptrollerUnitroller','JumpRateModelTokens','CErc20DelegateTokens','Comptroller'];