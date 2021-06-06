const { expect } = require("chai");
const { TOKEN, CONTRACT, RICHADDRESS } = require('../config/address.js');

describe("Bank", () => {

    before(async function () {
        await deployments.fixture(['CHBTC', 'CHETH', 'CHPT', 'CHT', 'CHUSD', 'CUSDT', 'Comptroller', 'Oracle']);

        const { HBTC, HETH, HPT, WHT, HUSD, USDT } = await getNamedAccounts();
        this.HBTC = HBTC;
        this.HETH = HETH;
        this.HPT = HPT;
        this.WHT = WHT;
        this.HUSD = HUSD;
        this.USDT = USDT;

        this.erc20HBTC = await ethers.getContractAt('CToken', HBTC);
        this.cErc20HBTC = await ethers.getContractAt('CErc20', (await ethers.getContract('CHBTC')).address);
        this.erc20HETH = await ethers.getContractAt('CToken', HETH);
        this.cErc20HETH = await ethers.getContractAt('CErc20', (await ethers.getContract('CHETH')).address);
        this.erc20HPT = await ethers.getContractAt('CToken', HPT);
        this.cErc20HPT = await ethers.getContractAt('CErc20', (await ethers.getContract('CHPT')).address);
        this.erc20WHT = await ethers.getContractAt('CToken', WHT);
        this.cErc20HT = await ethers.getContractAt('CEther', (await ethers.getContract('CHT')).address);
        this.erc20HUSD = await ethers.getContractAt('CToken', HUSD);
        this.cErc20HUSD = await ethers.getContractAt('CErc20', (await ethers.getContract('CHUSD')).address);
        this.erc20USDT = await ethers.getContractAt('CToken', USDT);
        this.cErc20USDT = await ethers.getContractAt('CErc20', (await ethers.getContract('CUSDT')).address);

        let unitroller = await ethers.getContract('Comptroller_Unitroller');
        this.comptroller = await ethers.getContractAt('Comptroller', unitroller.address);

        let signers = await ethers.getSigners();
        this.caller = signers[0];

        const { deployer, admin, oracleFeeder } = await ethers.getNamedSigners();
        this.oracleFeeder = oracleFeeder;

        {
            hbtcRichAddress = '0xd2786bc8B92217F515b026534c46B341D6322d30';
            tx = await this.caller.sendTransaction({to: hbtcRichAddress, value: '0x10000000000000000'});
            tx = await tx.wait();
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [hbtcRichAddress],
            });
            hbtcRicher = await ethers.getSigner(hbtcRichAddress)
            tx = await this.erc20HBTC.connect(hbtcRicher).transfer(this.caller.address, '2000000000000000000');
            tx = await tx.wait();
        }
        {
            hethRichAddress = '0xd2786bc8B92217F515b026534c46B341D6322d30';
            tx = await this.caller.sendTransaction({to: hethRichAddress, value: '0x10000000000000000'});
            tx = await tx.wait();
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [hethRichAddress],
            });
            hethRicher = await ethers.getSigner(hethRichAddress)
            tx = await this.erc20HETH.connect(hethRicher).transfer(this.caller.address, '2000000000000000000');
            tx = await tx.wait();
        }
        {
            hptRichAddress = '0xCEE6de4290a4002DE8712D16f8CfBA03CB9aFCf4';
            tx = await this.caller.sendTransaction({to: hptRichAddress, value: '0x10000000000000000'});
            tx = await tx.wait();
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [hptRichAddress],
            });
            hptRicher = await ethers.getSigner(hptRichAddress)
            tx = await this.erc20HPT.connect(hptRicher).transfer(this.caller.address, '2000000000000000000');
            tx = await tx.wait();
        }
        {
            husdRichAddress = '0xCEE6de4290a4002DE8712D16f8CfBA03CB9aFCf4';
            tx = await this.caller.sendTransaction({to: husdRichAddress, value: '0x10000000000000000'});
            tx = await tx.wait();
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [husdRichAddress],
            });
            husdRicher = await ethers.getSigner(husdRichAddress)
            tx = await this.erc20HUSD.connect(husdRicher).transfer(this.caller.address, '200000000');
            tx = await tx.wait();
        }
        {
            usdtRichAddress = '0x2615fE8d2b83970AdE02C649c2160512d29E20f8';
            tx = await this.caller.sendTransaction({to: usdtRichAddress, value: '0x10000000000000000'});
            tx = await tx.wait();
            await network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [usdtRichAddress],
            });
            usdtRicher = await ethers.getSigner(usdtRichAddress)
            tx = await this.erc20USDT.connect(usdtRicher).transfer(this.caller.address, '2000000000000000000');
            tx = await tx.wait();
        }

        this.simplePriceOracle = await ethers.getContract('SimplePriceOracle');
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

    beforeEach(async function () {
    });

    it("Mint", async function() {
        await this.erc20HBTC.connect(this.caller).approve(this.cErc20HBTC.address, '1000000000000000000');        
        await this.cErc20HBTC.connect(this.caller).mint('1000000000000000000');
        expect(await this.cErc20HBTC.balanceOf(this.caller.address)).equal('1000000000000000000')

        await this.erc20HETH.connect(this.caller).approve(this.cErc20HETH.address, '1000000000000000000');        
        await this.cErc20HETH.connect(this.caller).mint('1000000000000000000');
        expect(await this.cErc20HETH.balanceOf(this.caller.address)).equal('1000000000000000000')

        await this.cErc20HT.connect(this.caller).mint({value: '1000000000000000000'});
        expect(await this.cErc20HT.balanceOf(this.caller.address)).equal('1000000000000000000');

        await this.erc20HPT.connect(this.caller).approve(this.cErc20HPT.address, '1000000000000000000');        
        await this.cErc20HPT.connect(this.caller).mint('1000000000000000000');
        expect(await this.cErc20HPT.balanceOf(this.caller.address)).equal('1000000000000000000')

        await this.erc20USDT.connect(this.caller).approve(this.cErc20USDT.address, '1000000000000000000');        
        await this.cErc20USDT.connect(this.caller).mint('1000000000000000000');
        expect(await this.cErc20USDT.balanceOf(this.caller.address)).equal('1000000000000000000')

        await this.erc20HUSD.connect(this.caller).approve(this.cErc20HUSD.address, '100000000');        
        await this.cErc20HUSD.connect(this.caller).mint('100000000');
        expect(await this.cErc20HUSD.balanceOf(this.caller.address)).equal('100000000')
    });

    it("EnterMarket", async function() {
        expect(await this.comptroller.checkMembership(this.caller.address, this.cErc20HBTC.address)).equal(false);
        tx = await this.comptroller.connect(this.caller).enterMarkets([this.cErc20HBTC.address]);
        tx = await tx.wait();
        expect(await this.comptroller.checkMembership(this.caller.address, this.cErc20HBTC.address)).equal(true);

        expect(await this.comptroller.checkMembership(this.caller.address, this.cErc20HETH.address)).equal(false);
        tx = await this.comptroller.connect(this.caller).enterMarkets([this.cErc20HETH.address]);
        tx = await tx.wait();
        expect(await this.comptroller.checkMembership(this.caller.address, this.cErc20HETH.address)).equal(true);

        expect(await this.comptroller.checkMembership(this.caller.address, this.cErc20HT.address)).equal(false);
        tx = await this.comptroller.connect(this.caller).enterMarkets([this.cErc20HT.address]);
        tx = await tx.wait();
        expect(await this.comptroller.checkMembership(this.caller.address, this.cErc20HT.address)).equal(true);

        expect(await this.comptroller.checkMembership(this.caller.address, this.cErc20HPT.address)).equal(false);
        tx = await this.comptroller.connect(this.caller).enterMarkets([this.cErc20HPT.address]);
        tx = await tx.wait();
        expect(await this.comptroller.checkMembership(this.caller.address, this.cErc20HPT.address)).equal(true);

        expect(await this.comptroller.checkMembership(this.caller.address, this.cErc20USDT.address)).equal(false);
        tx = await this.comptroller.connect(this.caller).enterMarkets([this.cErc20USDT.address]);
        tx = await tx.wait();
        expect(await this.comptroller.checkMembership(this.caller.address, this.cErc20USDT.address)).equal(true);

        expect(await this.comptroller.checkMembership(this.caller.address, this.cErc20HUSD.address)).equal(false);
        tx = await this.comptroller.connect(this.caller).enterMarkets([this.cErc20HUSD.address]);
        tx = await tx.wait();
        expect(await this.comptroller.checkMembership(this.caller.address, this.cErc20HUSD.address)).equal(true);
    });

    it("Borrow", async function() {
        balanceBefore = await this.erc20HBTC.balanceOf(this.caller.address);
        tx = await this.cErc20HBTC.connect(this.caller).borrow('9000000000000');
        tx = await tx.wait();
        balanceAfter = await this.erc20HBTC.balanceOf(this.caller.address);
        expect(balanceAfter.sub(balanceBefore)).equal('9000000000000');
    });

    it("RepayBorrow", async function() {

        balanceBefore = await this.erc20HBTC.balanceOf(this.caller.address);
        await this.erc20HBTC.connect(this.caller).approve(this.cErc20HBTC.address, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        await this.cErc20HBTC.connect(this.caller).repayBorrow('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        balanceAfter = await this.erc20HBTC.balanceOf(this.caller.address);
        expect(balanceBefore.sub(balanceAfter)).to.be.above('9000000000000');
        await this.erc20HBTC.connect(this.caller).approve(this.cErc20HBTC.address, '0');
    });

    it("Redeem", async function() {
        balanceBefore = await this.erc20HBTC.balanceOf(this.caller.address);
        await this.cErc20HBTC.connect(this.caller).redeemUnderlying('1000000000000000000');
        balanceAfter = await this.erc20HBTC.balanceOf(this.caller.address);
        expect(balanceAfter.sub(balanceBefore)).equal('1000000000000000000');
        /*
        balanceBefore = await this.erc20HETH.balanceOf(this.caller.address);
        await this.cerc20HETH.connect(this.caller).redeemUnderlying('1000000000000000000');
        balanceAfter = await this.erc20HETH.balanceOf(this.caller.address);
        expect(balanceAfter.sub(balanceBefore)).equal('1000000000000000000');

        balanceBefore = await ethers.provider.getBalance(this.caller.address);
        await this.cEtherHT.connect(this.caller).redeemUnderlying('1000000000000000000');
        balanceAfter = await ethers.provider.getBalance(this.caller.address);
        expect(balanceAfter.sub(balanceBefore)).to.be.above('900000000000000000');
        */
    });

});
