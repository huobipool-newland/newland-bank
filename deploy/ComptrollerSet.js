
const network = require('../networks/hceo-self.json');

// const Comptroller = artifacts.require('Comptroller');
//部署预言机
module.exports = async ({ ethers,getNamedAccounts,deployments,getChainId,getUnnamedAccounts}) => {
    //预言机
    const {deploy,execute,getArtifact} = deployments;
    const {deployer, admin} = await getNamedAccounts();
    const comptroller =await deployments.get('Comptroller');
    const comtrollerUnitroller =await deployments.get('ComtrollerUnitroller');
    const priceOracleUnitroller =await deployments.get('PriceOracleUnitroller');
    const simplePriceOracle =await deployments.get('SimplePriceOracle');

    await execute('ComtrollerUnitroller', {from: deployer,log:true}, '_setPendingImplementation',comptroller.address);
    await execute('Comptroller', {from: deployer,log:true}, '_become',comtrollerUnitroller.address);
    await execute('ComtrollerUnitroller', {from: deployer,log:true}, '_setPendingAdmin',deployer);
    const unitroller = await ethers.getContractAt(comtrollerUnitroller.abi,comtrollerUnitroller.address,deployer);

    await unitroller._acceptAdmin();

    const proxy=await ethers.getContractAt(comptroller.abi,comtrollerUnitroller.address,deployer);
    await proxy._setPriceOracle(comtrollerUnitroller.address);
    await proxy._setMaxAssets(deployer);
    await proxy._setCloseFactor(deployer);
    await proxy._setLiquidationIncentive(deployer);

    let tokens = network['Tokens'];
    let ctoken;
    for (let token in network['Tokens']) {

        token = tokens[token];
        ctoken =await deployments.get('CErc20Delegator_'+token.name);
        await proxy._supportMarket(ctoken.address);
        await proxy._setCollateralFactor(ctoken.address,token.collateralFactor);

        await execute('SimplePriceOracle', {from: network.Admins.priceOracleFeeder,log:true}, 'setUnderlyingPrice',[cToken.address,token.initPrice]);

    }

    console.log("comtrolle 部署完成");


};

module.exports.tags = ['ComptrollerSet'];
module.exports.dependencies = ['ComptrollerUnitroller','Comptroller','PriceOracleUnitroller','PriceOracleSet','CErc20DelegatorTokens','SimplePriceOracle'];
module.exports.runAtTheEnd = true;