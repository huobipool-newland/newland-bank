
const network = require('../networks/heco-self.json');

//部署预言机
module.exports = async ({ ethers,getNamedAccounts,deployments,getChainId,getUnnamedAccounts}) => {
    //预言机
    const {deploy,execute} = deployments;
    const {deployer, admin} = await getNamedAccounts();

    const PriceOracleProxy =await deployments.get('PriceOracleProxy');
    const Unitroller =await deployments.get('Unitroller');
    const SimplePriceOracle =await deployments.get('SimplePriceOracle');

    await execute('Unitroller', {from: deployer,log:true}, '_setPendingImplementation',PriceOracleProxy.address);
    await execute('Unitroller', {from: deployer,log:true}, '_setPendingAdmin',network.Admins.priceOracleAdmin);
    // await execute('Unitroller', {from: ,log:true}, '_acceptAdmin');

    await execute('PriceOracleProxy', {from: deployer,log:true}, '_become',Unitroller.address);
    await execute('PriceOracle', {from: network.Admins.priceOracleAdmin,log:true}, '_setUnderlying',[SimplePriceOracle.address]);


};

module.exports.tags = ['Unitroller','PriceOracleProxy','SimplePriceOracle','PriceOracle'];
module.exports.runAtTheEnd = true;