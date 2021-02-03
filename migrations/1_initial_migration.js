const PriceOracle = artifacts.require('PriceOracle');
const SimplePriceOracle = artifacts.require("SimplePriceOracle");
const PriceOracleProxy = artifacts.require("PriceOracleProxy");
const Unitroller = artifacts.require('Unitroller');
const Comptroller = artifacts.require('Comptroller');
const JumpRateModel = artifacts.require('JumpRateModel');
const network = require('../networks/hceo-self.json');
const CErc20Delegate = artifacts.require('CErc20Delegate');
const CErc20Delegator = artifacts.require('CErc20Delegator');

module.exports = async function(deployer) {
    //预言机
    let simplePriceOracle = null;
    let priceOracleProxy = null;
    let priceOracleUnitroller = null;
    let priceOracle = null;
    await deployer.deploy(SimplePriceOracle, network.Admins.priceOracleFeeder).then(function(res) { //首先部署语言机，使用一个最简单版本的预言机
        simplePriceOracle = res;
        return deployer.deploy(PriceOracleProxy);
    });.then(function(res) { //然后部署一个语言机的代理,将预言机逻辑分开
        priceOracleProxy = res;
        return deployer.deploy(Unitroller);
    }).then(function(res) { //然后部署Unitroller负责管理语言机的权限
        priceOracleUnitroller = res;
        return priceOracleUnitroller._setPendingImplementation(priceOracleProxy.address);
    }).then(function(res) { //然后将unitroller和priceOracleProxy关联
        return priceOracleProxy._become(priceOracleUnitroller.address);
    }).then(function(res) {
        return priceOracleUnitroller._setPendingAdmin(network.Admins.priceOracleAdmin);
    }).then(function(res) { //最后将权限教给特定的用户
        return priceOracleUnitroller._acceptAdmin({from:network.Admins.priceOracleAdmin});
    }).then(function(res) {
        return new PriceOracleProxy(priceOracleUnitroller.address);
    }).then(function (res) {
        priceOracle = res;
        return priceOracle._setUnderlying(simplePriceOracle.address, {from: network.Admins.priceOracleAdmin});
    }).then(function (res) { //然后设置依赖的预言机
        console.log ("deploy priceOracle finish: " + priceOracle.address)
    });
    //Comptroller
    let comptroller = null;
    let comptrollerUnitroller = null;
    await deployer.deploy(Comptroller).then(function(res) { //首先部署Comptroller合约
        comptroller = res;
        return deployer.deploy(Unitroller);
    }).then(function(res) { //然后部署Unitroller合约管理权限
        comptrollerUnitroller = res;
        return comptrollerUnitroller._setPendingImplementation(comptroller.address);
    }).then(function(res) { //然后建立关联
        return comptroller._become(comptrollerUnitroller.address);
    }).then(function(res) { //然后移交权限
        return comptrollerUnitroller._setPendingAdmin(network.Admins.comptrollerAdmin);
    }).then(function(res) {
        return comptrollerUnitroller._acceptAdmin({from:network.Admins.comptrollerAdmin});
    }).then(function(res) {
        return new Comptroller(comptrollerUnitroller.address);
    }).then(function(res) {
        comptroller = res;
        return comptroller._setPriceOracle(priceOracle.address, {from:network.Admins.comptrollerAdmin});
    }).then(function(res) { //设置预言机
        return comptroller._setMaxAssets(network.userMaxAsset, {from:network.Admins.comptrollerAdmin});
    }).then(function(res) { //设置每个用户最大抵押资产的数量
        return comptroller._setCloseFactor(network.closeFactorMantissa, {from:network.Admins.comptrollerAdmin});
    }).then(function(res) { //设置closeFactor
        return comptroller._setLiquidationIncentive(network.liquidationIncentiveMantissa, {from:network.Admins.comptrollerAdmin}); 
    }).then(function(res) { //设置激励因子
        console.log("deploy comptroller finish: " + comptrollerUnitroller.address)
    });
    //然后发行CToken
    let addresses = []
    let interestRateModeMap = {};
    let tokens = network['Tokens'];
    let cTokens = [];
    for (let token in network['Tokens']) {
        token = tokens[token];
        let interestRateModeKey = token.baseRatePerYear + "_" + token.multiplierPerYear + "_" + token.jumpMultiplierPerYear + "_" + token.kink_;
        if (interestRateModeMap[interestRateModeKey] == null) { //如果这个参数的模型不存在，则新生成这个模型
            res = await deployer.deploy(JumpRateModel, token.baseRatePerYear, token.multiplierPerYear, token.jumpMultiplierPerYear, token.kink_);
            interestRateModeMap[interestRateModeKey] = res;
        }
        let cToken = null;
        await deployer.deploy(CErc20Delegate).then(function(res) { //首先发Deletate
            return deployer.deploy(CErc20Delegator, 
                    token['contract'],
                    comptroller.address,
                    interestRateModeMap[interestRateModeKey].address,
                    token.initialExchangeRate,
                    token['name'] + "'s cToken",
                    'c' + token['name'],
                    18,
                    network.Admins.tokenAdmin,
                    res.address,
                    '0x'
            );
        }).then(function(res) { //然后发delegator
            cToken = res;
            cTokens.push(cToken);
            console.log("deploy cToken " + token.name + " finish, begin supportMarket");
            return comptroller._supportMarket(cToken.address, {from:network.Admins.comptrollerAdmin});
        }).then(function(res) { //然后将该币种加入市场
            console.log("supportMarket finish, begin set underlying price");
            return simplePriceOracle.setUnderlyingPrice(cToken.address, token.initPrice, {from:network.Admins.priceOracleFeeder});
        }).then(function(res) { //然后设置该币种的初始价格
            console.log("set underlying price finish begin setCollaterator");
            return comptroller._setCollateralFactor(cToken.address, token.collateralFactor, {from:network.Admins.comptrollerAdmin}); 
        }).then(function(res) { //然后设置该币种的质押率
            console.log('c' + token['name'] + ' address: ' + cToken.address);
        });
    }
    let contracts = {
        comptroller: comptroller.address,
        priceOracle: priceOracle.address,
        tokens: {}
    }
    contracts.tokens = tokens.map(function(item, index) {
        return {
            currency: item.name,
            tokenContract: item.contract,
            cTokenContract: cTokens[index].address,
        }
    });
    console.dir(JSON.stringify(contracts));
    console.log("deploy finish");
};
