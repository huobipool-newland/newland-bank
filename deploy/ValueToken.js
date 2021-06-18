module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    let { deployer, admin } = await ethers.getNamedSigners();
    const { CLendbridge, Comptroller } = await getNamedAccounts();

    let deployResult = await deploy('ValueToken', {
        from: deployer.address,
        args: ["Newland Value Token", "NVALUE", 18],
        log: true,
    });
    let valueToken = await ethers.getContract('ValueToken');
    let totalSupply = await valueToken.totalSupply();
    if (totalSupply.toString() == '0') {
        tx = await valueToken.connect(deployer).mint(CLendbridge, '100000000000000000000000000');
        tx = await tx.wait();
        console.log("mint 100000000000000000000000000 to " + CLendbridge);
        console.dir(tx);
    }

    let comptroller = await ethers.getContractAt('ComptrollerG7', Comptroller); 
    let oracleAddress = await comptroller.oracle();

    let oracle = await ethers.getContractAt('PriceOracleProxy', oracleAddress);
    let currentAdmin = await oracle.admin();
    //console.log("currentAdmin: ", currentAdmin);
    if (currentAdmin != admin.address && hre.network.tags.local) {
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [currentAdmin],
        });
        admin = await ethers.getSigner(currentAdmin)
    }
    tx = await oracle.connect(admin)._setFixPrice(valueToken.address, '1000000000000000000');
    tx = await tx.wait();

};

module.exports.tags = ['ValueToken'];
module.exports.dependencies = ['UpdateComptrollerOracle'];
