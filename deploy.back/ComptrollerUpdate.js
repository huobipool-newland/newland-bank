module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments, getChainId, getUnnamedAccounts, }) {
    if (!hre.network.tags.test && !hre.network.tags.local) {
        return;
    }
    const {deploy} = deployments;
    const { deployer, admin } = await ethers.getNamedSigners();
    const { Comptroller } = await getNamedAccounts();

    let unitroller = await ethers.getContractAt('Unitroller', Comptroller);

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
        console.dir(comptroller.address + "become comptroller: ");
        console.dir(tx);
    }

};

module.exports.tags = ['ComptrollerUpdate'];
module.exports.dependencies = ['Breeder'];
