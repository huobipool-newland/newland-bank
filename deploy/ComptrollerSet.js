const network = require('../networks/hceo-test.json');

// const Comptroller = artifacts.require('Comptroller');
//部署预言机
module.exports = async ({ ethers,getNamedAccounts,deployments,getChainId,getUnnamedAccounts}) => {
    //预言机
    const {deploy,execute,getArtifact} = deployments;
    const {deployer, admin} = await getNamedAccounts();
    const comptroller =await deployments.get('Comptroller');
    const comptrollerUnitroller =await deployments.get('ComptrollerUnitroller');
    const priceOracleUnitroller =await deployments.get('PriceOracleUnitroller');
    const priceOracleProxy =await deployments.get('PriceOracleProxy');
    const priceOracle = await ethers.getContractAt(priceOracleProxy.abi,priceOracleUnitroller.address,deployer);

    await execute('ComptrollerUnitroller', {from: deployer,log:true}, '_setPendingImplementation',comptroller.address);

    await execute('ComptrollerUnitroller', {from: deployer,log:true}, '_setPendingAdmin',deployer);

    await execute('Comptroller', {from: deployer,log:true}, '_become',comptrollerUnitroller.address);
    const unitroller = await ethers.getContractAt(comptrollerUnitroller.abi,comptrollerUnitroller.address,deployer);

    await unitroller._acceptAdmin();

    const proxy=await ethers.getContractAt(comptroller.abi,comptrollerUnitroller.address,deployer);
    await proxy._setPriceOracle(priceOracle.address);
    await proxy._setMaxAssets(deployer);
    await proxy._setCloseFactor(deployer);
    await proxy._setLiquidationIncentive(deployer);

    let tokens = network['Tokens'];


    for (let index in tokens) {
        let token = tokens[index];
        let tokenName='CErc20Delegator_'+token.name;
        const ctoken =await deployments.get(tokenName);
        await proxy._supportMarket(ctoken.address);
        await proxy._setCollateralFactor(ctoken.address,token.collateralFactor);
    }

    console.log("comptrolle 部署完成");


};

module.exports.tags = ['ComptrollerSet'];
module.exports.dependencies = ['ComptrollerUnitroller','Comptroller','PriceOracleUnitroller','PriceOracleSet','CErc20DelegatorTokens','SimplePriceOracle'];
module.exports.runAtTheEnd = true;