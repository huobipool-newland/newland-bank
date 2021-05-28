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
        let richAddress = RICHADDRESS.USDT;  //这个账户有足够多的钱
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [richAddress],
        });
        this.caller = await ethers.getSigner(richAddress);
        richAddress = RICHADDRESS.HPT;
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [richAddress],
        });
        this.hptAccount = await ethers.getSigner(richAddress);
        //await this.caller.sendTransaction({to: this.hptAccount.address, value: '1000000000000000000'});

        this.erc20HBTC = await ethers.getContractAt('CTokenInterface', TOKEN.HBTC);
        this.erc20HETH = await ethers.getContractAt('CTokenInterface', TOKEN.HETH);
        this.erc20HPT = await ethers.getContractAt('CTokenInterface', TOKEN.HPT);
        this.erc20HUSD = await ethers.getContractAt('CTokenInterface', TOKEN.HUSD);
        this.erc20USDT = await ethers.getContractAt('CTokenInterface', TOKEN.USDT);

        let CErc20DelegateFactory = await ethers.getContractFactory('CErc20Delegate');
        this.cerc20Delegate = await CErc20DelegateFactory.deploy();
        this.CEtherFactory = await ethers.getContractFactory('CEther');
        this.CErc20DelegatorFactory = await ethers.getContractFactory('CErc20Delegator');

        let baseRatePerYear = '400000000000000000';
        let multiplierPerYear = '100000000000000000';
        let jumpMultiplierPerYear = '400000000000000000';
        let kink = '800000000000000000';
        let JumpRateModelFactory = await ethers.getContractFactory('JumpRateModel');
        this.rateMode = await JumpRateModelFactory.deploy(baseRatePerYear, multiplierPerYear, jumpMultiplierPerYear, kink);
        this.priceOracle = await ethers.getContractAt('PriceOracleProxy', CONTRACT.PriceOracle);

        let ComptrollerFactory = await ethers.getContractFactory('Comptroller');
        this.comptrollerContract = await ComptrollerFactory.deploy();
        let UnitrollerFactory = await ethers.getContractFactory('Unitroller');
        let unitroller = await UnitrollerFactory.deploy();
        await unitroller._setPendingImplementation(this.comptrollerContract.address);
        await this.comptrollerContract._become(unitroller.address);
        await unitroller._setPendingAdmin(this.admin.address);
        await unitroller.connect(this.admin)._acceptAdmin();
        this.comptroller = await ethers.getContractAt('Comptroller', unitroller.address);
        await this.comptroller.connect(this.admin)._setPriceOracle(this.priceOracle.address);
        await this.comptroller.connect(this.admin)._setMaxAssets('10');
        await this.comptroller.connect(this.admin)._setCloseFactor('900000000000000000');
        await this.comptroller.connect(this.admin)._setLiquidationIncentive('1100000000000000000');
        this.unitroller = unitroller;

        let hbtcDelegator = await this.CErc20DelegatorFactory.deploy(
            TOKEN.HBTC,
            this.comptroller.address,
            this.rateMode.address,
            '1000000000000000000',
            "HBTC's Token",
            'cHBTC',
            18,
            this.admin.address,
            this.cerc20Delegate.address,
            '0x'
        );
        this.cerc20HBTC = await ethers.getContractAt('CErc20', hbtcDelegator.address);
        await this.comptroller.connect(this.admin)._supportMarket(this.cerc20HBTC.address);
        await this.comptroller.connect(this.admin)._setCollateralFactor(this.cerc20HBTC.address, '900000000000000000');

        let hethDelegator = await this.CErc20DelegatorFactory.deploy(
            TOKEN.HETH,
            this.comptroller.address,
            this.rateMode.address,
            '1000000000000000000',
            "HETH's Token",
            'cHETH',
            18,
            this.admin.address,
            this.cerc20Delegate.address,
            '0x'
        );
        this.cerc20HETH = await ethers.getContractAt('CErc20', hethDelegator.address);
        await this.comptroller.connect(this.admin)._supportMarket(this.cerc20HETH.address);
        await this.comptroller.connect(this.admin)._setCollateralFactor(this.cerc20HETH.address, '900000000000000000');
        
        let htDelegator = await this.CEtherFactory.deploy(
            TOKEN.WHT,
            this.comptroller.address,
            this.rateMode.address,
            '1000000000000000000',
            "HT's Token",
            'cHT',
            18,
            this.admin.address
        );
        this.cEtherHT = await ethers.getContractAt('CEther', htDelegator.address);
        await this.comptroller.connect(this.admin)._supportMarket(this.cEtherHT.address);
        await this.comptroller.connect(this.admin)._setCollateralFactor(this.cEtherHT.address, '900000000000000000');

        let hptDelegator = await this.CErc20DelegatorFactory.deploy(
            TOKEN.HPT,
            this.comptroller.address,
            this.rateMode.address,
            '1000000000000000000',
            "HPT's Token",
            'cHPT',
            18,
            this.admin.address,
            this.cerc20Delegate.address,
            '0x'
        );
        this.cerc20HPT = await ethers.getContractAt('CErc20', hptDelegator.address);
        await this.comptroller.connect(this.admin)._supportMarket(this.cerc20HPT.address);
        await this.comptroller.connect(this.admin)._setCollateralFactor(this.cerc20HPT.address, '900000000000000000');

        let husdDelegator = await this.CErc20DelegatorFactory.deploy(
            TOKEN.HUSD,
            this.comptroller.address,
            this.rateMode.address,
            '1000000000000000000',
            "HUSD's Token",
            'cHUSD',
            8,
            this.admin.address,
            this.cerc20Delegate.address,
            '0x'
        );
        this.cerc20HUSD = await ethers.getContractAt('CErc20', husdDelegator.address);
        await this.comptroller.connect(this.admin)._supportMarket(this.cerc20HUSD.address);
        await this.comptroller.connect(this.admin)._setCollateralFactor(this.cerc20HUSD.address, '900000000000000000');

        let usdtDelegator = await this.CErc20DelegatorFactory.deploy(
            TOKEN.USDT,
            this.comptroller.address,
            this.rateMode.address,
            '1000000000000000000',
            "USDT's Token",
            'cUSDT',
            18,
            this.admin.address,
            this.cerc20Delegate.address,
            '0x'
        );
        this.cerc20USDT = await ethers.getContractAt('CErc20', usdtDelegator.address);
        await this.comptroller.connect(this.admin)._supportMarket(this.cerc20USDT.address);
        await this.comptroller.connect(this.admin)._setCollateralFactor(this.cerc20USDT.address, '900000000000000000');
        await this.comptroller.connect(this.admin)._addCompMarkets([
            this.cerc20HBTC.address,
            this.cerc20HETH.address,
            this.cEtherHT.address,
            this.cerc20HPT.address,
            this.cerc20USDT.address,
            this.cerc20HUSD.address
        ]);

        await this.erc20HPT.connect(this.hptAccount).transfer(this.comptroller.address, '1000000000000000000000000');        
        await this.comptroller.connect(this.admin)._setCompRate('100000000000000000000');
        blockNumberBefor = await ethers.provider.getBlockNumber();
        //console.dir(blockNumberBefor);
    });

    it("Mint", async function() {
        await this.erc20HBTC.connect(this.caller).approve(this.cerc20HBTC.address, '1000000000000000000');        
        await this.cerc20HBTC.connect(this.caller).mint('1000000000000000000');
        expect(await this.cerc20HBTC.balanceOf(this.caller.address)).equal('1000000000000000000')
        //await this.cerc20HBTC.connect(this.caller).redeem('1000000000000000000');

        await this.erc20HETH.connect(this.caller).approve(this.cerc20HETH.address, '1000000000000000000');        
        await this.cerc20HETH.connect(this.caller).mint('1000000000000000000');
        expect(await this.cerc20HETH.balanceOf(this.caller.address)).equal('1000000000000000000')
        //await this.cerc20HETH.connect(this.caller).redeem('1000000000000000000');

        await this.cEtherHT.connect(this.caller).mint({value: '1000000000000000000'});
        expect(await this.cEtherHT.balanceOf(this.caller.address)).equal('1000000000000000000');
        //await this.cEtherHT.connect(this.caller).redeem('1000000000000000000');

        await this.erc20HPT.connect(this.caller).approve(this.cerc20HPT.address, '1000000000000000000');        
        await this.cerc20HPT.connect(this.caller).mint('1000000000000000000');
        expect(await this.cerc20HPT.balanceOf(this.caller.address)).equal('1000000000000000000')
        //await this.cerc20HPT.connect(this.caller).redeem('1000000000000000000');

        await this.erc20USDT.connect(this.caller).approve(this.cerc20USDT.address, '1000000000000000000');        
        await this.cerc20USDT.connect(this.caller).mint('1000000000000000000');
        expect(await this.cerc20USDT.balanceOf(this.caller.address)).equal('1000000000000000000')
        //await this.cerc20USDT.connect(this.caller).redeem('1000000000000000000');

        await this.erc20HUSD.connect(this.caller).approve(this.cerc20HUSD.address, '100000000');        
        await this.cerc20HUSD.connect(this.caller).mint('100000000');
        expect(await this.cerc20HUSD.balanceOf(this.caller.address)).equal('100000000')
        //await this.cerc20HUSD.connect(this.caller).redeem('100000000');
    });

    beforeEach(async function () {
    });

    it("EnterMarket", async function() {
        expect(await this.comptroller.checkMembership(this.caller.address, this.cerc20HBTC.address)).equal(false);
        await this.comptroller.connect(this.caller).enterMarkets([this.cerc20HBTC.address]);
        expect(await this.comptroller.checkMembership(this.caller.address, this.cerc20HBTC.address)).equal(true);

        expect(await this.comptroller.checkMembership(this.caller.address, this.cerc20HETH.address)).equal(false);
        await this.comptroller.connect(this.caller).enterMarkets([this.cerc20HETH.address]);
        expect(await this.comptroller.checkMembership(this.caller.address, this.cerc20HETH.address)).equal(true);

        expect(await this.comptroller.checkMembership(this.caller.address, this.cEtherHT.address)).equal(false);
        await this.comptroller.connect(this.caller).enterMarkets([this.cEtherHT.address]);
        expect(await this.comptroller.checkMembership(this.caller.address, this.cEtherHT.address)).equal(true);

        expect(await this.comptroller.checkMembership(this.caller.address, this.cerc20HPT.address)).equal(false);
        await this.comptroller.connect(this.caller).enterMarkets([this.cerc20HPT.address]);
        expect(await this.comptroller.checkMembership(this.caller.address, this.cerc20HPT.address)).equal(true);

        expect(await this.comptroller.checkMembership(this.caller.address, this.cerc20USDT.address)).equal(false);
        await this.comptroller.connect(this.caller).enterMarkets([this.cerc20USDT.address]);
        expect(await this.comptroller.checkMembership(this.caller.address, this.cerc20USDT.address)).equal(true);

        expect(await this.comptroller.checkMembership(this.caller.address, this.cerc20HUSD.address)).equal(false);
        await this.comptroller.connect(this.caller).enterMarkets([this.cerc20HUSD.address]);
        expect(await this.comptroller.checkMembership(this.caller.address, this.cerc20HUSD.address)).equal(true);
    });

    it("Borrow", async function() {
        balanceBefore = await this.erc20HBTC.balanceOf(this.caller.address);
        await this.cerc20HBTC.connect(this.caller).borrow('900000000000000000');
        balanceAfter = await this.erc20HBTC.balanceOf(this.caller.address);
        expect(balanceAfter.sub(balanceBefore)).equal('900000000000000000');

        balanceBefore = await this.erc20HETH.balanceOf(this.caller.address);
        await this.cerc20HETH.connect(this.caller).borrow('900000000000000000');
        balanceAfter = await this.erc20HETH.balanceOf(this.caller.address);
        expect(balanceAfter.sub(balanceBefore)).equal('900000000000000000');
        
        balanceBefore = await ethers.provider.getBalance(this.caller.address);
        await this.cEtherHT.connect(this.caller).borrow('900000000000000000');
        balanceAfter = await ethers.provider.getBalance(this.caller.address);
        expect(balanceAfter.sub(balanceBefore)).to.be.below('900000000000000000');
        
        balanceBefore = await this.erc20HPT.balanceOf(this.caller.address);
        await this.cerc20HPT.connect(this.caller).borrow('900000000000000000');
        balanceAfter = await this.erc20HPT.balanceOf(this.caller.address);
        expect(balanceAfter.sub(balanceBefore)).equal('900000000000000000');
        
        balanceBefore = await this.erc20USDT.balanceOf(this.caller.address);
        await this.cerc20USDT.connect(this.caller).borrow('900000000000000000');
        balanceAfter = await this.erc20USDT.balanceOf(this.caller.address);
        expect(balanceAfter.sub(balanceBefore)).equal('900000000000000000');
        
        balanceBefore = await this.erc20HUSD.balanceOf(this.caller.address);
        await this.cerc20HUSD.connect(this.caller).borrow('90000000');
        balanceAfter = await this.erc20HUSD.balanceOf(this.caller.address);
        expect(balanceAfter.sub(balanceBefore)).equal('90000000');
    });

    it("Claim", async function() {
        await this.comptroller.refreshCompSpeeds();
        //更新Comptroller
        let ClaimContractFactory = await ethers.getContractFactory('ClaimContract');
        this.claimContract = await ClaimContractFactory.deploy();
        let ComptrollerG7Factory = await ethers.getContractFactory('ComptrollerG7');
        this.comptrollerG7Contract = await ComptrollerG7Factory.deploy();
        await this.unitroller._setPendingImplementation(this.comptrollerG7Contract.address);
        await this.comptrollerG7Contract._become(this.unitroller.address);
        this.comptroller = await ethers.getContractAt('ComptrollerG7', this.unitroller.address);
        await this.comptroller.connect(this.admin)._setClaimContract(this.claimContract.address);
        expect(await this.comptroller.claimContract()).to.be.equal(this.claimContract.address);
        let pid = '0';
        let chef = await ethers.getContractAt('PiggyBreeder', '0x59F8AD2495236B25BA95E3161154F0024fbDBDCe');
        let poolInfo = await chef.poolInfo(pid);
        let lpToken = poolInfo[0];
        let lpERC20 = await ethers.getContractAt('CErc20', lpToken);
        let richAddress = '0x1001c3354c02de74c5c8273a27ae63bb15acc2fd';
        let balance = await lpERC20.balanceOf(richAddress);
        //console.dir(poolInfo);
        //console.dir(balance);
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [richAddress],
        });
        let richer = await ethers.getSigner(richAddress);
        lpERC20.connect(richer).transfer(this.comptroller.address, balance.toString());
        balance = await lpERC20.balanceOf(this.comptroller.address);
        //console.dir(balance);
        let iface = new ethers.utils.Interface(["function claim(uint256)", "function stake(uint256,uint256)"])
        let claimBytes = iface.encodeFunctionData("claim", [pid]);
        //console.log(claimBytes);
        await this.comptroller.connect(this.admin)._addClaimInfo(TOKEN.DEP, TOKEN.DEP, POOL.DEP, claimBytes);
        await this.comptroller.connect(this.admin)._addMarketToClaimInfo(TOKEN.DEP, [this.cerc20USDT.address], ['10000'], ["10000"]);
        let stakeBytes = iface.encodeFunctionData('stake', [pid, balance.toString()]);
        //console.dir(stakeBytes);
        await this.comptroller.stake(TOKEN.DEP, lpToken, balance.toString(), stakeBytes);
        balance = await lpERC20.balanceOf(this.comptroller.address);
        //console.dir(balance);
        await ethers.provider.send("evm_increaseTime", [60])
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await chef.updatePool(pid);

        //let claimInfo = await this.comptroller.claimInfos(TOKEN.DEP);
        //console.dir(claimInfo);
        //claimInfo = await this.comptroller.claimInfos(TOKEN.DEP);
        //console.dir(claimInfo);
        await this.erc20USDT.connect(this.caller).approve(this.cerc20USDT.address, '1000000000000000000');        
        await this.cerc20USDT.connect(this.caller).mint('1000000000000000000');
        await this.comptroller.connect(this.caller).claim(this.caller.address);
        await this.cerc20HUSD.connect(this.caller).borrow('90000000');
        await ethers.provider.send("evm_increaseTime", [60])
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await chef.updatePool(pid);
        balanceBefore = await lpERC20.balanceOf(this.caller.address);
        console.log("balanceBefore: ", balanceBefore.toString());
        await this.comptroller.connect(this.caller).claim(this.caller.address);
        balanceAfter = await lpERC20.balanceOf(this.caller.address);
        console.log("balanceAfter: ", balanceAfter.toString());
    });

    it("GetClaimInfoKeysLength", async function() {
        let length = await this.comptroller.getClaimInfoKeysLength();
        expect(length).to.be.equal(1);
    });

    it("MarketInClaimInfo", async function() {
        expect(await this.comptroller.marketInClaimInfo(this.cerc20USDT.address, 0)).to.be.equal(true);
        expect(await this.comptroller.marketInClaimInfo(this.cerc20HBTC.address, 0)).to.be.equal(false);
    });

    it("MarketClaimInfo", async function() {
        let claimInfo = await this.comptroller.marketClaimInfo(this.cerc20USDT.address, 0);
        //console.dir(claimInfo);
        expect(claimInfo.token_).to.be.equal(TOKEN.DEP);
    });

    it("UserMarketClaimInfo", async function() {
        let claimInfo = await this.comptroller.userMarketClaimInfo(this.caller.address, this.cerc20USDT.address, 0);

        //console.dir(claimInfo);
        //expect(claimInfo.token_).to.be.equal(TOKEN.DEP);
    });

});
