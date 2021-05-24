module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments, getChainId, getUnnamedAccounts, }) {
    if (!hre.network.tags.test && !hre.network.tags.local) {
        return;
    }
    const {deploy} = deployments;
    const { deployer, admin } = await ethers.getNamedSigners();

    let unitroller = await ethers.getContractAt('Unitroller', '0xac80F18DD0Bf863d91dA835784AbBe6Cd1211a95');
    let oldComptroller = await unitroller.comptrollerImplementation();
    console.dir("old comptroller: " + oldComptroller);

    let deployResult = await deploy('ComptrollerG7', {
        from: deployer.address,
        args: [
        ],
        log: true,
        
    });
    let comptrollerG7 = await ethers.getContract('ComptrollerG7');
    if (oldComptroller != comptrollerG7.address) {
        tx = await unitroller.connect(admin)._setPendingImplementation(comptrollerG7.address);
        console.dir("set pending implementation: ");
        console.dir(tx);
        tx = await comptrollerG7.connect(admin)._become(unitroller.address);
        console.dir(comptrollerG7.address + "become comptroller: ");
        console.dir(tx);
    }
    let comptroller = await ethers.getContractAt('ComptrollerG7', unitroller.address);

    let claimContract = await comptroller.claimContract();
    console.dir("current claim contract: " + claimContract);
    if (claimContract == '0x0000000000000000000000000000000000000000') {
        deployResult = await deploy('ClaimContract', {
            from: deployer.address,
            args: [
            ],
            log: true,
        });
        let claimContract = await ethers.getContract('ClaimContract');
        tx = await comptroller.connect(admin)._setClaimContract(claimContract.address);
        tx = await tx.wait()
        console.dir("update claimContract :" + claimContract.address);
        console.dir(tx);
    }

    let token = await ethers.getContract('WePiggyToken');
    let piggyBreeder = await ethers.getContract('PiggyBreeder');
    
    let hbtc = await ethers.getContractAt('CToken', '0x1d8684e6cdd65383affd3d5cf8263fcda5001f13');
    console.log(await hbtc.balanceOf(unitroller.address));
    let balance = await hbtc.balanceOf(unitroller.address);
    if (balance.toString() == '0') {
        tx = await hbtc.connect(deployer).transfer(unitroller.address, '1000000000000000000');
        tx = await tx.wait();
        console.dir("transfer token to comptroller: ");
        console.dir(tx);
    }
    let claimInfo = await comptroller.claimInfos(token.address);
    console.dir(claimInfo);
    if (claimInfo.token == '0x0000000000000000000000000000000000000000') {
        let iface = new ethers.utils.Interface(["function claim(uint256)", "function stake(uint256,uint256)"])
        let claimBytes = iface.encodeFunctionData("claim", [0]);
        let stakeBytes = iface.encodeFunctionData('stake', [0, '1000000000000000000']);
        console.dir(await unitroller.comptrollerImplementation());
        tx = await comptroller.connect(admin)._addClaimInfo(token.address, token.address, piggyBreeder.address, claimBytes);
        tx = await tx.wait();
        console.dir("add claimInfo: " + token.address);
        console.dir(tx);
        tx = await comptroller.connect(admin)._addMarketToClaimInfo(token.address, ['0xac80F18DD0Bf863d91dA835784AbBe6Cd1211a95'], ['10000'], ["10000"]);
        tx = await tx.wait();
        console.dir("add market usdt(0xac80F18DD0Bf863d91dA835784AbBe6Cd1211a95) to claimInfo: ");
        console.dir(tx);
        //console.dir(await comptroller.claimInfos(token.address));
    }

};

module.exports.tags = ['ComptrollerUpdate'];
module.exports.dependencies = ['Breeder'];
