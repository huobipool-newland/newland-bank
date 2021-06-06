const { expect } = require("chai");
const { TOKEN, CONTRACT, RICHADDRESS } = require('../config/address.js');
const { time } = require('@openzeppelin/test-helpers');

describe("Oracle", () => {

    before(async function () {
        await deployments.fixture(['Oracle']);
        let priceOracleProxy = await ethers.getContract('PriceOracleProxy');
        this.oracle = await ethers.getContract('PriceOracleProxy', priceOracleProxy.address);
        this.simplePriceOracle = await ethers.getContract('SimplePriceOracle');

        const { deployer, admin, oracleFeeder } = await ethers.getNamedSigners();
        this.deployer = deployer;
        this.admin = admin;
        this.oracleFeeder = oracleFeeder;

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
    });

    beforeEach(async function () {
    });

    it("setBulkDirectPrice", async function() {
        tx = await this.simplePriceOracle.connect(this.oracleFeeder).setBulkDirectPrice(
            0, 
            [
                this.HBTC, this.HETH, this.WHT, this.HPT, this.HUSD, this.USDT
            ], 
            [
                '1000000000000000000',
                '2000000000000000000',
                '3000000000000000000',
                '4000000000000000000',
                '5000000000000000000',
                '6000000000000000000',
            ]
        );
        tx = await tx.wait();
        tx = await this.simplePriceOracle.connect(this.oracleFeeder).setBulkDirectPrice(
            1, 
            [
                this.HBTC, this.HETH, this.WHT, this.HPT, this.HUSD, this.USDT
            ], 
            [
                '1000000000000000000',
                '2000000000000000000',
                '3000000000000000000',
                '4000000000000000000',
                '5000000000000000000',
                '6000000000000000000',
            ]
        );
        tx = await tx.wait();
        tx = await this.simplePriceOracle.connect(this.oracleFeeder).setBulkDirectPrice(
            2, 
            [
                this.HBTC, this.HETH, this.WHT, this.HPT, this.HUSD, this.USDT
            ], 
            [
                '1000000000000000000',
                '2000000000000000000',
                '3000000000000000000',
                '4000000000000000000',
                '5000000000000000000',
                '6000000000000000000',
            ]
        );
        tx = await tx.wait();
    });

    it("setBulkDirectPrice", async function() {
        //console.log("cHBTC:", this.cHBTC);
        expect(await this.simplePriceOracle.getUnderlyingPrice(this.cHBTC)).to.be.equal('1000000000000000000'); 
        expect(await this.simplePriceOracle.getUnderlyingPrice(this.cHETH)).to.be.equal('2000000000000000000'); 
        expect(await this.simplePriceOracle.getUnderlyingPrice(this.cWHT)).to.be.equal('3000000000000000000'); 
        expect(await this.simplePriceOracle.getUnderlyingPrice(this.cHPT)).to.be.equal('4000000000000000000'); 
        expect(await this.simplePriceOracle.getUnderlyingPrice(this.cHUSD)).to.be.equal('5000000000000000000'); 
        expect(await this.simplePriceOracle.getUnderlyingPrice(this.cUSDT)).to.be.equal('1000000000000000000'); 
    });

    //function getUnderlyingPrice(CToken cToken) public view returns (uint) {
});
