const BigNumber = require('bignumber.js')
module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const { deployer, admin } = await ethers.getNamedSigners();
    //deploy new contract
    await deploy('PaybackComptroller', {
        from: deployer.address,
        args: [],
        log: true,
        contract: 'Comptroller',
    });

    let newComptrollerImplementation = await ethers.getContract('PaybackComptroller');
    let oldComptrollerImplementation = await ethers.getContractAt('Comptroller', '0x4859CbcF9A1a0b87adF18CE73b935888b177f00b'); 

    let comptroller = await ethers.getContractAt('Unitroller', '0xf9Af9778cC5B8AAAEfEE646e8e3277E7242a1F88');
    let currentComptrollerImplementation = await comptroller.comptrollerImplementation();
    //update implementation
    if (currentComptrollerImplementation != newComptrollerImplementation.address) {
        tx = await comptroller.connect(deployer)._setPendingImplementation(newComptrollerImplementation.address);
        tx = await tx.wait();
        tx = await newComptrollerImplementation.connect(deployer)._become(comptroller.address);
        tx = await tx.wait();
    }
    //payback
    let HPT = await ethers.getContractAt('CErc20', '0xE499Ef4616993730CEd0f31FA2703B92B50bB536');
    let addr1 = '0x8dF9eFBF73043d8d95aF095FeA98f2C45e91521a';
    let addr2 = '0xCf441129dC8d91B07fB8cb5122570Bfc607eC471';
    let balanceBefore1 = await HPT.balanceOf(addr1);
    let balanceBefore2 = await HPT.balanceOf(addr2);
    let balanceBeforeComptroller = await HPT.balanceOf(comptroller.address);
    let totalNeedAmount = new BigNumber('1584905160000000000000000').plus(new BigNumber('100000000000000000000000'));
    if ((new BigNumber(balanceBeforeComptroller.toString())).comparedTo(totalNeedAmount) > 0) {
        let comp = await ethers.getContractAt('Comptroller', comptroller.address);
        tx = await comp.connect(deployer).assetPayback();
        tx = await tx.wait();
    }
    let balanceAfter1 = await HPT.balanceOf(addr1);
    let balanceAfter2 = await HPT.balanceOf(addr2);
    let balanceAfterComptroller = await HPT.balanceOf(comptroller.address);
    console.log("transfer to " + addr1 + " " + balanceAfter1.sub(balanceBefore1).toString());
    console.log("transfer to " + addr2 + " " + balanceAfter2.sub(balanceBefore2).toString());
    //switch back implementation
    currentComptrollerImplementation = await comptroller.comptrollerImplementation();
    if (currentComptrollerImplementation != oldComptrollerImplementation) {
        tx = await comptroller.connect(deployer)._setPendingImplementation(oldComptrollerImplementation.address);
        tx = await tx.wait();
        tx = await oldComptrollerImplementation.connect(deployer)._become(comptroller.address);
        tx = await tx.wait();
    }
};

module.exports.tags = ['Payback'];
module.exports.dependencies = [];
