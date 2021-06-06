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

    let depToken = await ethers.getContract('WePiggyToken');
    let masterChef = await ethers.getContract('PiggyBreeder');
    let mockToken0 = await ethers.getContract('MockToken0');
    let mockToken1 = await ethers.getContract('MockToken1');

    let comptroller = await ethers.getContractAt('ComptrollerG7', Comptroller);
    let iface = new ethers.utils.Interface(["function claim(uint256)", "function stake(uint256,uint256)"])
    
    let key0 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DEPPool(0)')).substring(0, 42);
    let claimBytes0 = iface.encodeFunctionData("claim", [0]);
    tx = await comptroller.connect(admin)._addClaimInfo(key0, depToken.address, masterChef.address, claimBytes0);
    tx = await tx.wait();
    tx = await comptroller.connect(admin)._addMarketToClaimInfo(key0, [cHUSD], ['10000'], ['10000']);
    tx = await tx.wait();

    let key1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DEPPool(1)')).substring(0, 42);
    let claimBytes1 = iface.encodeFunctionData("claim", [1]);
    tx = await comptroller.connect(admin)._addClaimInfo(key1, depToken.address, masterChef.address, claimBytes1);
    tx = await tx.wait();
    tx = await comptroller.connect(admin)._addMarketToClaimInfo(key1, [cUSDT], ['10000'], ['10000']);
    tx = await tx.wait();

    let stakeBytes0 = iface.encodeFunctionData('stake', [0, '1000000000000000000']);
    tx = await comptroller.connect(admin).stake(key0, mockToken0.address, '1000000000000000000', stakeBytes0);
    tx = await tx.wait();

    let stakeBytes1 = iface.encodeFunctionData('stake', [1, '1000000000000000000']);
    tx = await comptroller.connect(admin).stake(key1, mockToken1.address, '1000000000000000000', stakeBytes1);
    tx = await tx.wait();
};

module.exports.tags = ['AddClaimInfo'];
module.exports.dependencies = ['ComptrollerUpdateG7', 'Breeder'];
