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
    const { DEP, DepPool, DepMockToken0, DepMockToken1 } = await getNamedAccounts();

    comptroller = await ethers.getContractAt('ComptrollerG7', Comptroller);

    let currentAdmin = await comptroller.admin();
    if (currentAdmin != admin.address) {
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [currentAdmin],
        });
        admin = await ethers.getSigner(currentAdmin);
    }

    let key0 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DEPPool(0)')).substring(0, 42);
    tx = await comptroller._delClaimInfo(key0);
    tx = await tx.wait();
    console.log("delete claimInfo " + key0);
    console.dir(tx);
    let key1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DEPPool(1)')).substring(0, 42);
    tx = await comptroller._delClaimInfo(key1);
    tx = await tx.wait();
    console.log("delete claimInfo " + key1);
    console.dir(tx);

    let iface = new ethers.utils.Interface(["function claim(uint256)", "function stake(uint256,uint256)"])
    
    key0 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DEPPool(19)')).substring(0, 42);
    let claimBytes0 = iface.encodeFunctionData("claim", [19]);
    tx = await comptroller.connect(admin)._addClaimInfo(key0, DEP, DepPool, claimBytes0);
    tx = await tx.wait();
    console.log("addClaimInfo: " + key0);
    console.dir(tx);
    tx = await comptroller.connect(admin)._addMarketToClaimInfo(key0, [cHUSD], ['10000'], ['10000']);
    tx = await tx.wait();
    console.log("add market " + cHUSD + " into " + key0);
    console.dir(tx);

    key1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DEPPool(20)')).substring(0, 42);
    let claimBytes1 = iface.encodeFunctionData("claim", [20]);
    tx = await comptroller.connect(admin)._addClaimInfo(key1, DEP, DepPool, claimBytes1);
    tx = await tx.wait();
    console.log("addClaimInfo: ", key1);
    console.dir(tx);
    tx = await comptroller.connect(admin)._addMarketToClaimInfo(key1, [cUSDT], ['10000'], ['10000']);
    tx = await tx.wait();
    console.log("add market " + cUSDT + " into " + key1);
    console.dir(tx);

    let stakeBytes0 = iface.encodeFunctionData('stake', [19, '1']);
    tx = await comptroller.connect(admin).stake(key0, DepMockToken0, '1', stakeBytes0);
    tx = await tx.wait();
    console.log("stake for " + key0);
    console.dir(tx);

    let stakeBytes1 = iface.encodeFunctionData('stake', [20, '1']);
    tx = await comptroller.connect(admin).stake(key1, DepMockToken1, '1', stakeBytes1);
    tx = await tx.wait();
    console.log("stake for " + key1);
    console.dir(tx);


    /*
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
    */

};

module.exports.tags = ['ComptrollerChange'];
module.exports.dependencies = [];
