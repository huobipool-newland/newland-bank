const { expect } = require("chai");
const { TOKEN, CONTRACT, RICHADDRESS } = require('../config/address.js');
const { time } = require('@openzeppelin/test-helpers');

describe("ValueToken", () => {

    before(async function () {
        await deployments.fixture(['Oracle', 'ValueToken', 'CValueToken', 'CUSDTUpdate', 'CHUSDUpdate']);
        this.oracle = await ethers.getContract('PriceOracleProxy');
        this.oracle = await ethers.getContractAt('PriceOracleProxy', this.oracle.address);

        const { HBTC, HETH, WHT, HPT, HUSD, USDT } = await getNamedAccounts();
        this.HBTC = HBTC;
        this.HETH = HETH;
        this.WHT = WHT;
        this.HPT = HPT;
        this.HUSD = HUSD;
        this.USDT = USDT;

        const { cHBTC, cHETH, cWHT, cHPT, cHUSD, cUSDT } = await getNamedAccounts();
        this.cHBTC = cHBTC;
        this.cHETH = cHETH;
        this.cWHT = cWHT;
        this.cHPT = cHPT;
        this.cHUSD = cHUSD;
        this.cUSDT = cUSDT;

        this.valueToken = await ethers.getContract('ValueToken');
        this.cValueToken = await ethers.getContract('CValueToken');

        const { Comptroller } = await getNamedAccounts();
        this.comptroller = await ethers.getContractAt('ComptrollerG7', Comptroller);

        let { deployer, admin } = await ethers.getNamedSigners();
        this.deployer = deployer;
        this.admin = admin;
    });

    beforeEach(async function () {
    });


    it("getUnderlyingPrice", async function() {
        await this.valueToken.connect(this.deployer).mint(this.deployer.address, '1000000000000000000000000');
        expect(await this.valueToken.balanceOf(this.deployer.address)).to.be.equal('1000000000000000000000000');
        await this.valueToken.connect(this.deployer).approve(this.cValueToken.address, '10000000000000000000');
        await this.cValueToken.connect(this.deployer).mint('10000000000000000000');
        expect(await this.valueToken.balanceOf(this.deployer.address)).to.be.equal('999990000000000000000000');
        await this.comptroller.connect(this.deployer).enterMarkets([this.cValueToken.address]);

        let cErc20USDT = await ethers.getContractAt('CErc20', this.cUSDT);
        let erc20USDT = await ethers.getContractAt('CErc20', this.USDT);
        let balanceBefore = await erc20USDT.balanceOf(this.deployer.address);
        await cErc20USDT.connect(this.deployer).borrow('90000000000000000');
        let balanceAfter = await erc20USDT.balanceOf(this.deployer.address);
        //console.log("borrowAmount: ", balanceAfter.sub(balanceBefore).toString());
        expect(balanceAfter.sub(balanceBefore)).to.be.equal('90000000000000000');

        let cErc20HUSD = await ethers.getContractAt('CErc20', this.cHUSD);
        let erc20HUSD = await ethers.getContractAt('CErc20', this.HUSD);
        balanceBefore = await erc20HUSD.balanceOf(this.deployer.address);
        await cErc20HUSD.connect(this.deployer).borrow('100000000');
        balanceAfter = await erc20HUSD.balanceOf(this.deployer.address);
        //console.log("borrowAmount: ", balanceAfter.sub(balanceBefore).toString());
        expect(balanceAfter.sub(balanceBefore)).to.be.equal('100000000');



        /*
        //console.log("cHBTC:", this.cHBTC);
        expect(await this.oracle.getUnderlyingPrice(this.cHBTC)).to.be.above('0'); 
        expect(await this.oracle.getUnderlyingPrice(this.cHETH)).to.be.above('0'); 
        expect(await this.oracle.getUnderlyingPrice(this.cWHT)).to.be.above('0'); 
        expect(await this.oracle.getUnderlyingPrice(this.cHPT)).to.be.above('0'); 
        expect(await this.oracle.getUnderlyingPrice(this.cHUSD)).to.be.above('0'); 
        expect(await this.oracle.getUnderlyingPrice(this.cUSDT)).to.be.above('0'); 
        expect(await this.oracle.getUnderlyingPrice(this.cValueToken.address)).to.be.equal('1000000000000000000'); 
        */
    });

    //function getUnderlyingPrice(CToken cToken) public view returns (uint) {
});
