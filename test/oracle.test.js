const { expect } = require("chai");
const { TOKEN, CONTRACT, RICHADDRESS } = require('../config/address.js');
const { time } = require('@openzeppelin/test-helpers');

describe("Oracle", () => {

    before(async function () {
        await deployments.fixture(['Oracle', 'ValueToken', 'CValueToken']);
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

        this.cValueToken = await ethers.getContract('CValueToken');
    });

    beforeEach(async function () {
    });


    it("getUnderlyingPrice", async function() {
        //console.log("cHBTC:", this.cHBTC);
        expect(await this.oracle.getUnderlyingPrice(this.cHBTC)).to.be.above('0'); 
        expect(await this.oracle.getUnderlyingPrice(this.cHETH)).to.be.above('0'); 
        expect(await this.oracle.getUnderlyingPrice(this.cWHT)).to.be.above('0'); 
        expect(await this.oracle.getUnderlyingPrice(this.cHPT)).to.be.above('0'); 
        expect(await this.oracle.getUnderlyingPrice(this.cHUSD)).to.be.above('0'); 
        expect(await this.oracle.getUnderlyingPrice(this.cUSDT)).to.be.above('0'); 
        expect(await this.oracle.getUnderlyingPrice(this.cValueToken.address)).to.be.equal('1000000000000000000'); 
    });

    //function getUnderlyingPrice(CToken cToken) public view returns (uint) {
});
