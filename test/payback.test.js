const { expect } = require("chai");
const { TOKEN, CONTRACT, RICHADDRESS } = require('../config/address.js');

describe("ComptrollerUpdate", () => {

    before(async function () {
        await deployments.fixture(['Payback']);
        /*
        this.currentComptroller = '0xf9Af9778cC5B8AAAEfEE646e8e3277E7242a1F88';
        this.comptrollerProxy = await ethers.getContractAt('Unitroller', this.currentComptroller);

        this.oldComptrollerImplementation = await this.comptrollerProxy.comptrollerImplementation();
        console.log(this.oldComptrollerImplementation);
        this.oldComptrollerImplementation = await ethers.getContractAt('Comptroller', this.oldComptrollerImplementation);

        this.newComptrollerImplementation = await ethers.getContract('PaybackComptroller');

        this.owner = '0x2d0f8C750f6C02D0F05Ab2c116C7251B8A21EB2e';
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [this.owner],
        });
        this.owner = await ethers.getSigner(this.owner);

        await this.comptrollerProxy.connect(this.owner)._setPendingImplementation(this.newComptrollerImplementation.address);
        await this.newComptrollerImplementation.connect(this.owner)._become(this.comptrollerProxy.address);

        this.HPT = await ethers.getContractAt('CErc20', '0xE499Ef4616993730CEd0f31FA2703B92B50bB536');
        this.addr1 = '0x8dF9eFBF73043d8d95aF095FeA98f2C45e91521a';
        this.addr2 = '0xCf441129dC8d91B07fB8cb5122570Bfc607eC471';
        this.balanceBefore1 = await this.HPT.balanceOf(this.addr1);
        this.balanceBefore2 = await this.HPT.balanceOf(this.addr2);
        this.balanceBefore3 = await this.HPT.balanceOf(this.comptrollerProxy.address);
        this.newComptrollerImplementation = await ethers.getContractAt('Comptroller', this.currentComptroller);
        await this.newComptrollerImplementation.connect(this.owner).assetPayback();
        this.balanceAfter1 = await this.HPT.balanceOf(this.addr1);
        this.balanceAfter2 = await this.HPT.balanceOf(this.addr2);
        this.balanceAfter3 = await this.HPT.balanceOf(this.comptrollerProxy.address);
        console.log(this.balanceAfter1.sub(this.balanceBefore1).toString());
        console.log(this.balanceAfter2.sub(this.balanceBefore2).toString());
        console.log(this.balanceBefore3.sub(this.balanceAfter3).toString());

        await this.comptrollerProxy.connect(this.owner)._setPendingImplementation(this.oldComptrollerImplementation.address);
        await this.oldComptrollerImplementation.connect(this.owner)._become(this.comptrollerProxy.address);
        */
    });

    beforeEach(async function () {
    });

    it ("SetCompSpeed", async function() {
    });
});
