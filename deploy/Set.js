//
// const network = require('../networks/hceo-self.json');
//
// //部署预言机
// module.exports = async ({ ethers,getNamedAccounts,deployments,getChainId,getUnnamedAccounts}) => {
//     //预言机
//     const {deploy,execute} = deployments;
//     const {deployer, admin} = await getNamedAccounts();
//
//     const PriceOracleProxy =await deployments.get('PriceOracleProxy');
//     const Unitroller =await deployments.get('Unitroller');
//
//     await execute('Unitroller', {from: deployer,log:true}, '_setPendingImplementation',PriceOracleProxy.address);
//     await execute('Unitroller', {from: deployer,log:true}, '_setPendingAdmin',network.Admins.priceOracleAdmin);
//     await execute('Unitroller', {from: deployer,log:true}, '_acceptAdmin',{from:network.Admins.priceOracleAdmin});
//
//     await execute('PriceOracleProxy', {from: deployer,log:true}, '_become',Unitroller.address);
//     await execute('PriceOracleProxy', {from: deployer,log:true}, '_become',Unitroller.address);
// };
//
// module.exports.tags = ['Unitroller','PriceOracleProxy'];
// module.exports.dependencies = ['Unitroller','PriceOracleProxy'];
// module.exports.runAtTheEnd = true;