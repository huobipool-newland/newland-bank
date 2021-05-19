const network = require('../networks/hceo-test.json');
//部署预言机
module.exports = async ({ ethers,getNamedAccounts,deployments,getChainId,getUnnamedAccounts}) => {
    //预言机
    const {deploy,execute} = deployments;
    const {deployer, admin} = await getNamedAccounts();


    const priceOracleProxy =await deployments.get('PriceOracleProxy');
    const simplePriceOracle =await deployments.get('SimplePriceOracle');
    const priceOracleUnitroller =await deployments.get('PriceOracleUnitroller');

    await execute('PriceOracleUnitroller', {from: deployer,log:true}, '_setPendingImplementation',priceOracleProxy.address);
    await execute('PriceOracleProxy', {from: deployer,log:true}, '_become',priceOracleUnitroller.address);
    await execute('PriceOracleUnitroller', {from: deployer,log:true}, '_setPendingAdmin',network.Admins.priceOracleAdmin);
    // await execute('Unitroller', {from: ,log:true}, '_acceptAdmin');
    const unitroller=await ethers.getContract('PriceOracleUnitroller',deployer);
    await unitroller._acceptAdmin();

    const proxy=await ethers.getContractAt(priceOracleProxy.abi,priceOracleUnitroller.address,deployer);

    await proxy._setUnderlying(simplePriceOracle.address);
    console.log("price oracle 预言机部署完成..");

};

module.exports.tags = ['PriceOracleSet'];
module.exports.dependencies = ['PriceOracleUnitroller','PriceOracleProxy','SimplePriceOracle'];

module.exports.runAtTheEnd = true;