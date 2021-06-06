module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments, getChainId, getUnnamedAccounts, }) {
    /*
    if (!hre.network.tags.test && !hre.network.tags.local) {
        return;
    }
    */
    const {deploy} = deployments;
    let { deployer, admin } = await ethers.getNamedSigners();
    const { Comptroller } = await getNamedAccounts();
    const { cHBTC, cHETH, cWHT, cHPT, cHUSD, cUSDT } = await getNamedAccounts();

    let unitroller = await ethers.getContractAt('Unitroller', Comptroller);
    let currentAdmin = await unitroller.admin();
    //console.log("currentAdmin:", currentAdmin);
    if (currentAdmin != admin.address && hre.network.tags.local) {
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [currentAdmin],
        });
        admin = await ethers.getSigner(currentAdmin);
    }

    let deployResult = await deploy('ComptrollerG7', {
        from: deployer.address,
        args: [
        ],
        log: true,
    });
    let comptroller = await ethers.getContract('ComptrollerG7');

    let imp = await unitroller.comptrollerImplementation();
    //console.dir(imp);
    if (imp != comptroller.address) {
        tx = await unitroller.connect(admin)._setPendingImplementation(comptroller.address);
        tx = await tx.wait();
        console.dir("set pending implementation: ");
        console.dir(tx);
        tx = await comptroller.connect(admin)._become(unitroller.address);
        tx = await tx.wait();
        console.dir(comptroller.address + " become comptroller: ");
        console.dir(tx);
    }

    comptroller = await ethers.getContractAt('ComptrollerG7', Comptroller);
    await deploy('ClaimContract', {
        from: deployer.address,
        args: [
        ],
        log: true,
    });
    let claimContract = await ethers.getContract('ClaimContract');
    let currentClaimContract = await comptroller.claimContract();
    if (currentClaimContract != claimContract.address) {
        tx = await comptroller.connect(admin)._setClaimContract(claimContract.address);
        tx = await tx.wait();
        console.dir("set claim contract: ");
        console.dir(tx);
    }
    currentSpeed = await comptroller.compSpeeds(cHBTC);
    if (currentSpeed.toString() != '1000000000000000000') {
        console.dir("set " + cHBTC + " HPT speed to 1000000000000000000");
        tx = await comptroller.connect(admin)._setCompSpeed(cHBTC, '1000000000000000000');
        tx = await tx.wait();
        console.dir(tx);
    }
    currentSpeed = await comptroller.compSpeeds(cHETH);
    if (currentSpeed.toString() != '1000000000000000000') {
        console.dir("set " + cHETH + " HPT speed to 1000000000000000000");
        tx = await comptroller.connect(admin)._setCompSpeed(cHETH, '1000000000000000000');
        tx = await tx.wait();
        console.dir(tx);
    }
    currentSpeed = await comptroller.compSpeeds(cWHT);
    if (currentSpeed.toString() != '1000000000000000000') {
        console.dir("set " + cWHT + " HPT speed to 1000000000000000000");
        tx = await comptroller.connect(admin)._setCompSpeed(cWHT, '1000000000000000000');
        tx = await tx.wait();
        console.dir(tx);
    }
    currentSpeed = await comptroller.compSpeeds(cHPT);
    if (currentSpeed.toString() != '1000000000000000000') {
        console.dir("set " + cHPT + " HPT speed to 1000000000000000000");
        tx = await comptroller.connect(admin)._setCompSpeed(cHPT, '1000000000000000000');
        tx = await tx.wait();
        console.dir(tx);
    }
    currentSpeed = await comptroller.compSpeeds(cHUSD);
    if (currentSpeed.toString() != '1000000000000000000') {
        console.dir("set " + cHUSD + " HPT speed to 1000000000000000000");
        tx = await comptroller.connect(admin)._setCompSpeed(cHUSD, '1000000000000000000');
        tx = await tx.wait();
        console.dir(tx);
    }
    currentSpeed = await comptroller.compSpeeds(cUSDT);
    if (currentSpeed.toString() != '1000000000000000000') {
        console.dir("set " + cUSDT + " HPT speed to 1000000000000000000");
        tx = await comptroller.connect(admin)._setCompSpeed(cUSDT, '1000000000000000000');
        tx = await tx.wait();
        console.dir(tx);
    }

};

module.exports.tags = ['ComptrollerUpdateG7'];
module.exports.dependencies = [];
