const chai = require("chai");
const expect = chai.expect;
const { TOKEN, CONTRACT, RICHADDRESS, POOL } = require('../config/address.js');
const { time } = require('@openzeppelin/test-helpers');
const { chaiAsPromised } = require('chai-as-promised');
//console.dir(chai);
//chai.should()
//chai.use(chaiAsPromised)

describe("Compound", () => {

    before(async function () {
        let signers = await ethers.getSigners();
        this.admin = signers[0];
        this.caller = signers[1];
    });

    beforeEach(async function () {
        await deployments.fixture(["Breeder"]);
    });

    it("Claim", async function() {
        let piggyBreeder = await ethers.getContract('PiggyBreeder');

        let richAddress = '0x4666821165c49e2d2c132b2a8941d26eb3a02f2a';
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [richAddress],
        });
        let richAccount = await ethers.getSigner(richAddress);
        let hbtc = await ethers.getContractAt('CToken', '0x1d8684e6cdd65383affd3d5cf8263fcda5001f13');
        await hbtc.connect(richAccount).transfer(this.caller.address, '1000000000000000000')
        await hbtc.connect(this.caller).approve(piggyBreeder.address, '1000000000000000000');
        await piggyBreeder.connect(this.caller).stake(0, '1000000000000000000');
        await ethers.provider.send("evm_increaseTime", [60])
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);

        let token = await ethers.getContract('WePiggyToken');
        let balanceBefore = await token.balanceOf(this.caller.address);
        console.log("balanceBefore: ", balanceBefore.toString());
        await piggyBreeder.connect(this.caller).claim(0);
        let balanceAfter = await token.balanceOf(this.caller.address);
        console.log("balanceAfter: ", balanceAfter.toString());
    });

});
