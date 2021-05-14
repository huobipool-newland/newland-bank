
const network = require('../networks/hceo-self.json');

//部署预言机
module.exports = async ({ ethers,getNamedAccounts,deployments,getChainId,getUnnamedAccounts}) => {
    //预言机
    const {deploy,execute} = deployments;
    const {deployer, admin} = await getNamedAccounts();

    const priceOracleProxy =await deployments.get('PriceOracleProxy');
    const priceOracleUnitroller =await deployments.get('PriceOracleUnitroller');
    const simplePriceOracle =await deployments.get('SimplePriceOracle');

    await execute('PriceOracleUnitroller', {from: deployer,log:true}, '_setPendingImplementation',deployer);
    await execute('PriceOracleProxy', {from: deployer,log:true}, '_become',deployer);
    await execute('PriceOracleUnitroller', {from: deployer,log:true}, '_setPendingAdmin',deployer);
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