const { expect } = require("chai");
const { TOKEN, CONTRACT, RICHADDRESS } = require('../config/address.js');

describe("PriceOracle", () => {

    before(async function () {
        await deployments.fixture(['PriceOracleUpdate', 'ValueToken', 'CValueToken']);

        const { HBTC, HETH, HPT, WHT, HUSD, USDT } = await getNamedAccounts();
        this.HBTC = HBTC;
        this.HETH = HETH;
        this.HPT = HPT;
        this.WHT = WHT;
        this.HUSD = HUSD;
        this.USDT = USDT;
        const { cHBTC, cHETH, cHPT, cWHT, cHUSD, cUSDT } = await getNamedAccounts();
        this.cHBTC = cHBTC;
        this.cHETH = cHETH;
        this.cHPT = cHPT;
        this.cWHT = cWHT;
        this.cHUSD = cHUSD;
        this.cUSDT = cUSDT;

        this.erc20HBTC = await ethers.getContractAt('CToken', HBTC);
        this.cErc20HBTC = await ethers.getContractAt('CErc20', cHBTC);
        this.erc20HETH = await ethers.getContractAt('CToken', HETH);
        this.cErc20HETH = await ethers.getContractAt('CErc20', cHETH);
        this.erc20HPT = await ethers.getContractAt('CToken', HPT);
        this.cErc20HPT = await ethers.getContractAt('CErc20', cHPT);
        this.erc20WHT = await ethers.getContractAt('CToken', WHT);
        this.cErc20HT = await ethers.getContractAt('CEther', cWHT);
        this.erc20HUSD = await ethers.getContractAt('CToken', HUSD);
        this.cErc20HUSD = await ethers.getContractAt('CErc20', cHUSD);
        this.erc20USDT = await ethers.getContractAt('CToken', USDT);
        this.cErc20USDT = await ethers.getContractAt('CErc20', cUSDT);
        this.valueToken = await ethers.getContract('ValueToken');
        this.cValueToken = await ethers.getContract('CValueToken');

        const { Comptroller } = await getNamedAccounts();

        this.comptroller = await ethers.getContractAt('ComptrollerG7', Comptroller);

        let oracleAddress = await this.comptroller.oracle();
        this.oracle = await ethers.getContractAt('PriceOracleProxy', oracleAddress);
        /*
        let signers = await ethers.getSigners();
        this.caller = signers[0];

        const { deployer, admin } = await ethers.getNamedSigners();

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
            tx = await this.erc20HPT.connect(hptRicher).transfer(this.caller.address, '20000000000000000000000000');
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
            tx = await this.erc20HUSD.connect(husdRicher).transfer(this.caller.address, '20000000000');
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
            tx = await this.erc20USDT.connect(usdtRicher).transfer(this.caller.address, '200000000000000000000');
            tx = await tx.wait();
        }
        tx = await this.erc20HPT.connect(this.caller).transfer(this.comptroller.address, '1000000000000000000000000');
        tx = await tx.wait();
        */
    });

    beforeEach(async function () {
    });

    it ("GetPrice", async function() {
        let hbtcValue = await this.oracle.getUnderlyingPrice(this.cErc20HBTC.address);
        //console.log("hbtcValue: ", hbtcValue.toString());
        expect(hbtcValue).to.be.above('0');
        let hethValue = await this.oracle.getUnderlyingPrice(this.cErc20HETH.address);
        expect(hethValue).to.be.above('0');
        let hptValue = await this.oracle.getUnderlyingPrice(this.cErc20HPT.address);
        expect(hptValue).to.be.above('0');
        let htValue = await this.oracle.getUnderlyingPrice(this.cErc20HT.address);
        expect(htValue).to.be.above('0');
        let husdValue = await this.oracle.getUnderlyingPrice(this.cErc20HUSD.address);
        expect(husdValue).to.be.above('0');
        let usdtValue = await this.oracle.getUnderlyingPrice(this.cErc20USDT.address);
        expect(usdtValue).to.be.above('0');
        let valueTokenValue = await this.oracle.getUnderlyingPrice(this.cValueToken.address);
        //console.log("valueTokenValue: ", valueTokenValue.toString());
        expect(valueTokenValue).to.be.above('0');
        /*
        let currentAdmin = await this.comptroller.admin();
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [currentAdmin],
        });
        this.admin = await ethers.getSigner(currentAdmin);
        
        expect(await this.comptroller.compSpeeds(this.cErc20HBTC.address)).to.be.equal('0');
        tx = await this.comptroller.connect(this.admin)._setCompSpeed(this.cErc20HBTC.address, '1000000000000000000');
        tx = await tx.wait();
        expect(await this.comptroller.compSpeeds(this.cErc20HBTC.address)).to.be.equal('1000000000000000000');

        expect(await this.comptroller.compSpeeds(this.cErc20HETH.address)).to.be.equal('0');
        tx = await this.comptroller.connect(this.admin)._setCompSpeed(this.cErc20HETH.address, '1000000000000000000');
        tx = await tx.wait();
        expect(await this.comptroller.compSpeeds(this.cErc20HETH.address)).to.be.equal('1000000000000000000');

        expect(await this.comptroller.compSpeeds(this.cErc20HPT.address)).to.be.equal('0');
        tx = await this.comptroller.connect(this.admin)._setCompSpeed(this.cErc20HPT.address, '1000000000000000000');
        tx = await tx.wait();
        expect(await this.comptroller.compSpeeds(this.cErc20HPT.address)).to.be.equal('1000000000000000000');

        expect(await this.comptroller.compSpeeds(this.cErc20HT.address)).to.be.equal('0');
        tx = await this.comptroller.connect(this.admin)._setCompSpeed(this.cErc20HT.address, '1000000000000000000');
        tx = await tx.wait();
        expect(await this.comptroller.compSpeeds(this.cErc20HT.address)).to.be.equal('1000000000000000000');

        expect(await this.comptroller.compSpeeds(this.cErc20HUSD.address)).to.be.equal('0');
        tx = await this.comptroller.connect(this.admin)._setCompSpeed(this.cErc20HUSD.address, '1000000000000000000');
        tx = await tx.wait();
        expect(await this.comptroller.compSpeeds(this.cErc20HUSD.address)).to.be.equal('1000000000000000000');

        expect(await this.comptroller.compSpeeds(this.cErc20USDT.address)).to.be.equal('0');
        tx = await this.comptroller.connect(this.admin)._setCompSpeed(this.cErc20USDT.address, '1000000000000000000');
        tx = await tx.wait();
        expect(await this.comptroller.compSpeeds(this.cErc20USDT.address)).to.be.equal('1000000000000000000');
        */
    });

    it("Mint", async function() {
        /*
        await this.erc20HBTC.connect(this.caller).approve(this.cErc20HBTC.address, '1000000000000000000');        
        balanceBefore = await this.erc20HBTC.balanceOf(this.caller.address);
        await this.cErc20HBTC.connect(this.caller).mint('1000000000000000000');
        balanceAfter = await this.erc20HBTC.balanceOf(this.caller.address);
        expect(balanceBefore.sub(balanceAfter)).to.be.equal('1000000000000000000')

        await this.erc20USDT.connect(this.caller).approve(this.cErc20USDT.address, '200000000000000000000');        
        balanceBefore = await this.erc20USDT.balanceOf(this.caller.address);
        await this.cErc20USDT.connect(this.caller).mint('200000000000000000000');
        balanceAfter = await this.erc20USDT.balanceOf(this.caller.address);
        expect(balanceBefore.sub(balanceAfter)).to.be.equal('200000000000000000000')

        await this.erc20HUSD.connect(this.caller).approve(this.cErc20HUSD.address, '20000000000');        
        balanceBefore = await this.erc20HUSD.balanceOf(this.caller.address);
        await this.cErc20HUSD.connect(this.caller).mint('20000000000');
        balanceAfter = await this.erc20HUSD.balanceOf(this.caller.address);
        expect(balanceBefore.sub(balanceAfter)).to.be.equal('20000000000')
        */
    });

    it("EnterMarket", async function() {
        /*
        expect(await this.comptroller.checkMembership(this.caller.address, this.cErc20HBTC.address)).equal(false);
        tx = await this.comptroller.connect(this.caller).enterMarkets([this.cErc20HBTC.address]);
        tx = await tx.wait();
        expect(await this.comptroller.checkMembership(this.caller.address, this.cErc20HBTC.address)).equal(true);
        */
    });

    it("Borrow", async function() {
        /*
        balanceBefore = await this.erc20USDT.balanceOf(this.caller.address);
        tx = await this.cErc20USDT.connect(this.caller).borrow('100000000000000000000');
        tx = await tx.wait();
        balanceAfter = await this.erc20USDT.balanceOf(this.caller.address);
        expect(balanceAfter.sub(balanceBefore)).equal('100000000000000000000');
        
        balanceBefore = await this.erc20HUSD.balanceOf(this.caller.address);
        tx = await this.cErc20HUSD.connect(this.caller).borrow('10000000000');
        tx = await tx.wait();
        balanceAfter = await this.erc20HUSD.balanceOf(this.caller.address);
        expect(balanceAfter.sub(balanceBefore)).equal('10000000000');
        */
    });

    it("ClaimOneByOne", async function() {
        /*
        await ethers.provider.send("evm_increaseTime", [60])
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);

        let pendingHPT = await this.claimLens.pendingHPT(this.caller.address, this.cHBTC, true, true);
        //console.log("pendingHPT: in ", this.cHBTC, ":", pendingHPT.toString());
        balanceBefore = await this.erc20HPT.balanceOf(this.caller.address);
        //console.log("balanceBefore: ", balanceBefore);
        tx = await this.comptroller.connect(this.caller).claimAll(this.caller.address, [this.cHBTC]);
        tx = await tx.wait();
        //console.dir(tx);
        balanceAfter = await this.erc20HPT.balanceOf(this.caller.address);
        //console.log("balanceAfter: ", balanceAfter);
        //console.log("claimHPT:", balanceAfter.sub(balanceBefore).toString());
        expect(pendingHPT).to.be.equal(balanceAfter.sub(balanceBefore));

        pendingHPT = await this.claimLens.pendingHPT(this.caller.address, this.cHETH, true, true);
        //console.log("pendingHPT: in ", this.cHBTC, ":", pendingHPT.toString());
        balanceBefore = await this.erc20HPT.balanceOf(this.caller.address);
        //console.log("balanceBefore: ", balanceBefore);
        tx = await this.comptroller.connect(this.caller).claimAll(this.caller.address, [this.cHETH]);
        tx = await tx.wait();
        //console.dir(tx);
        balanceAfter = await this.erc20HPT.balanceOf(this.caller.address);
        //console.log("balanceAfter: ", balanceAfter);
        //console.log("claimHPT:", balanceAfter.sub(balanceBefore).toString());
        expect(pendingHPT).to.be.equal(balanceAfter.sub(balanceBefore));

        pendingHPT = await this.claimLens.pendingHPT(this.caller.address, this.cWHT, true, true);
        //console.log("pendingHPT: in ", this.cHBTC, ":", pendingHPT.toString());
        balanceBefore = await this.erc20HPT.balanceOf(this.caller.address);
        //console.log("balanceBefore: ", balanceBefore);
        tx = await this.comptroller.connect(this.caller).claimAll(this.caller.address, [this.cWHT]);
        tx = await tx.wait();
        //console.dir(tx);
        balanceAfter = await this.erc20HPT.balanceOf(this.caller.address);
        //console.log("balanceAfter: ", balanceAfter);
        //console.log("claimHPT:", balanceAfter.sub(balanceBefore).toString());
        expect(pendingHPT).to.be.equal(balanceAfter.sub(balanceBefore));

        pendingHPT = await this.claimLens.pendingHPT(this.caller.address, this.cHPT, true, true);
        //console.log("pendingHPT: in ", this.cHBTC, ":", pendingHPT.toString());
        balanceBefore = await this.erc20HPT.balanceOf(this.caller.address);
        //console.log("balanceBefore: ", balanceBefore);
        tx = await this.comptroller.connect(this.caller).claimAll(this.caller.address, [this.cHPT]);
        tx = await tx.wait();
        //console.dir(tx);
        balanceAfter = await this.erc20HPT.balanceOf(this.caller.address);
        //console.log("balanceAfter: ", balanceAfter);
        //console.log("claimHPT:", balanceAfter.sub(balanceBefore).toString());
        expect(pendingHPT).to.be.equal(balanceAfter.sub(balanceBefore));

        pendingHPT = await this.claimLens.pendingHPT(this.caller.address, this.cHUSD, true, true);
        //console.log("pendingHPT: in ", this.cHBTC, ":", pendingHPT.toString());
        balanceBefore = await this.erc20HPT.balanceOf(this.caller.address);
        //console.log("balanceBefore: ", balanceBefore);
        tx = await this.comptroller.connect(this.caller).claimAll(this.caller.address, [this.cHUSD]);
        tx = await tx.wait();
        //console.dir(tx);
        balanceAfter = await this.erc20HPT.balanceOf(this.caller.address);
        //console.log("balanceAfter: ", balanceAfter);
        //console.log("claimHPT:", balanceAfter.sub(balanceBefore).toString());
        expect(pendingHPT).to.be.equal(balanceAfter.sub(balanceBefore));

        pendingHPT = await this.claimLens.pendingHPT(this.caller.address, this.cUSDT, true, true);
        //console.log("pendingHPT: in ", this.cHBTC, ":", pendingHPT.toString());
        balanceBefore = await this.erc20HPT.balanceOf(this.caller.address);
        //console.log("balanceBefore: ", balanceBefore);
        tx = await this.comptroller.connect(this.caller).claimAll(this.caller.address, [this.cUSDT]);
        tx = await tx.wait();
        //console.dir(tx);
        balanceAfter = await this.erc20HPT.balanceOf(this.caller.address);
        //console.log("balanceAfter: ", balanceAfter);
        //console.log("claimHPT:", balanceAfter.sub(balanceBefore).toString());
        expect(pendingHPT).to.be.equal(balanceAfter.sub(balanceBefore));
        */
    });

    it("ClaimAll", async function() {
        /*
        await ethers.provider.send("evm_increaseTime", [60])
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);

        pendingHPTFromHBTC = await this.claimLens.pendingHPT(this.caller.address, this.cHBTC, true, true);
        pendingHPTFromHETH = await this.claimLens.pendingHPT(this.caller.address, this.cHETH, true, true);
        pendingHPTFromHT = await this.claimLens.pendingHPT(this.caller.address, this.cWHT, true, true);
        pendingHPTFromHPT = await this.claimLens.pendingHPT(this.caller.address, this.cHPT, true, true);
        pendingHPTFromHUSD = await this.claimLens.pendingHPT(this.caller.address, this.cHUSD, true, true);
        pendingHPTFromUSDT = await this.claimLens.pendingHPT(this.caller.address, this.cUSDT, true, true);

        balanceBefore = await this.erc20HPT.balanceOf(this.caller.address);
        tx = await this.comptroller.connect(this.caller).claimAll(this.caller.address, [this.cHBTC, this.cHETH, this.cWHT, this.cHPT, this.cHUSD, this.cUSDT]);
        balanceAfter = await this.erc20HPT.balanceOf(this.caller.address);

        expect(pendingHPTFromHBTC.add(pendingHPTFromHETH).add(pendingHPTFromHT).add(pendingHPTFromHPT).add(pendingHPTFromHUSD).add(pendingHPTFromUSDT)).to.be.equal(balanceAfter.sub(balanceBefore));
        */
    });

    it("addClaimInfo", async function() {
        /*
        let iface = new ethers.utils.Interface(["function claim(uint256)", "function stake(uint256,uint256)"])

        key = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DEPPool(0)'));
        claimBytes = iface.encodeFunctionData("claim", [0]);
        //console.log(this.admin);
        //console.log(key.substring(0, 42));
        //console.log(this.depToken.address, this.depToken.address.length);
        //console.log(claimBytes);
        tx = await this.comptroller.connect(this.admin)._addClaimInfo(key.substring(0, 42), this.depToken.address, this.masterChef.address, claimBytes);
        tx = await tx.wait();
        tx = await this.comptroller.connect(this.admin)._addMarketToClaimInfo(key.substring(0, 42), [this.cHUSD], ['10000'], ['10000']);
        tx = await tx.wait();
        let claimInfo = await this.comptroller.claimInfos(key.substring(0, 42));
        //console.log(claimInfo);
        expect(claimInfo.index).to.be.equal(0);
        expect(claimInfo.token).to.be.equal(this.depToken.address);
        expect(claimInfo.pool).to.be.equal(this.masterChef.address);
        expect(claimInfo.method).to.be.equal(claimBytes);
        expect(claimInfo.totalAllocPoint).to.be.equal('10000');

        key = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DEPPool(1)'));
        claimBytes = iface.encodeFunctionData("claim", [1]);
        //console.log(this.admin);
        //console.log(key.substring(0, 42));
        //console.log(this.depToken.address, this.depToken.address.length);
        //console.log(claimBytes);
        tx = await this.comptroller.connect(this.admin)._addClaimInfo(key.substring(0, 42), this.depToken.address, this.masterChef.address, claimBytes);
        tx = await tx.wait();
        tx = await this.comptroller.connect(this.admin)._addMarketToClaimInfo(key.substring(0, 42), [this.cUSDT], ['10000'], ['10000']);
        tx = await tx.wait();
        claimInfo = await this.comptroller.claimInfos(key.substring(0, 42));
        expect(claimInfo.index).to.be.equal(1);
        expect(claimInfo.token).to.be.equal(this.depToken.address);
        expect(claimInfo.pool).to.be.equal(this.masterChef.address);
        expect(claimInfo.method).to.be.equal(claimBytes);
        expect(claimInfo.totalAllocPoint).to.be.equal('10000');

        tx = await this.claimLens.connect(this.admin).setHPT(this.HPT);
        tx = await tx.wait();
        tx = await this.claimLens.connect(this.admin).setDEP(this.DEP);
        tx = await tx.wait();
        tx = await this.claimLens.connect(this.admin).setMockDEP(this.DEP);
        tx = await tx.wait();
        tx = await this.claimLens.connect(this.admin).setDEPPool(this.masterChef.address);
        tx = await tx.wait();
        tx = await this.claimLens.connect(this.admin).addDEPInfos(this.cHUSD, ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DEPPool(0)')).substring(0, 42), 0, '10000', '10000', '10000');
        tx = await tx.wait();
        tx = await this.claimLens.connect(this.admin).addDEPInfos(this.cUSDT, ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DEPPool(1)')).substring(0, 42), 1, '10000', '10000', '10000');
        tx = await tx.wait();
        */
    });

    it("stake", async function() {
        /*
        let iface = new ethers.utils.Interface(["function claim(uint256)", "function stake(uint256,uint256)"])
        stakeBytes = iface.encodeFunctionData('stake', [0, '1000000000000000000']);
        key = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DEPPool(0)'));
        tx = await this.comptroller.connect(this.admin).stake(key.substring(0, 42), this.mockToken0.address, '1000000000000000000', stakeBytes);
        tx = await tx.wait();

        stakeBytes = iface.encodeFunctionData('stake', [1, '1000000000000000000']);
        key = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('DEPPool(1)'));
        tx = await this.comptroller.connect(this.admin).stake(key.substring(0, 42), this.mockToken1.address, '1000000000000000000', stakeBytes);
        tx = await tx.wait();
        */
    });

    it("claimDEP", async function() {
        /*
        await ethers.provider.send("evm_increaseTime", [60])
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);

        let pendingDEP = await this.claimLens.pendingDEP(this.caller.address, this.cHUSD, true, true);
        //console.log("pendingDEP: in ", this.cHUSD, ":", pendingDEP.toString());
        balanceBefore = await this.depToken.balanceOf(this.caller.address);
        //console.log("balanceBefore: ", balanceBefore.toString());
        tx = await this.comptroller.connect(this.caller).claimAll(this.caller.address, [this.cHUSD]);
        tx = await tx.wait();
        //console.dir(tx);
        balanceAfter = await this.depToken.balanceOf(this.caller.address);
        //console.log("balanceAfter: ", balanceAfter.toString());
        //console.log("claimDEP:", balanceAfter.sub(balanceBefore).toString());
        expect(pendingDEP).to.be.equal(balanceAfter.sub(balanceBefore));

        pending = await this.claimLens.pendingDEP(this.caller.address, this.cUSDT, true, true);
        //console.log("pendingDEP: in ", this.cHUSD, ":", pendingDEP.toString());
        balanceBefore = await this.depToken.balanceOf(this.caller.address);
        //console.log("balanceBefore: ", balanceBefore.toString());
        tx = await this.comptroller.connect(this.caller).claimAll(this.caller.address, [this.cUSDT]);
        tx = await tx.wait();
        //console.dir(tx);
        balanceAfter = await this.depToken.balanceOf(this.caller.address);
        //console.log("balanceAfter: ", balanceAfter.toString());
        //console.log("claimDEP:", balanceAfter.sub(balanceBefore).toString());
        expect(pendingDEP).to.be.equal(balanceAfter.sub(balanceBefore));
        */
    });

    it ("borrowAgain", async function() {
        /*
        balanceBefore = await this.erc20USDT.balanceOf(this.caller.address);
        tx = await this.cErc20USDT.connect(this.caller).borrow('100000000000000000000');
        tx = await tx.wait();
        balanceAfter = await this.erc20USDT.balanceOf(this.caller.address);
        expect(balanceAfter.sub(balanceBefore)).equal('100000000000000000000');
        
        balanceBefore = await this.erc20HUSD.balanceOf(this.caller.address);
        tx = await this.cErc20HUSD.connect(this.caller).borrow('10000000000');
        tx = await tx.wait();
        balanceAfter = await this.erc20HUSD.balanceOf(this.caller.address);
        expect(balanceAfter.sub(balanceBefore)).equal('10000000000');
        */
    });

    it("claimDEPAgain", async function() {
        /*
        await ethers.provider.send("evm_increaseTime", [60])
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);
        await network.provider.send("evm_mine", []);

        let pendingDEPHUSD = await this.claimLens.pendingDEP(this.caller.address, this.cHUSD, true, true);
        //console.log("pendingDEP: in ", this.cHUSD, ":", pendingDEPHUSD.toString());
        balanceBefore = await this.depToken.balanceOf(this.caller.address);
        let pendingDEPUSDT = await this.claimLens.pendingDEP(this.caller.address, this.cUSDT, true, true);
        //console.log("pendingDEP: in ", this.cUSDT, ":", pendingDEPUSDT.toString());
        balanceBefore = await this.depToken.balanceOf(this.caller.address);
        //console.log("balanceBefore: ", balanceBefore.toString());
        tx = await this.comptroller.connect(this.caller).claimAll(this.caller.address, [this.cHUSD, this.cUSDT]);
        tx = await tx.wait();
        //console.dir(tx);
        balanceAfter = await this.depToken.balanceOf(this.caller.address);
        //console.log("balanceAfter: ", balanceAfter.toString());
        //console.log("claimDEP:", balanceAfter.sub(balanceBefore).toString());
        expect(pendingDEPUSDT.add(pendingDEPHUSD)).to.be.equal(balanceAfter.sub(balanceBefore));
        */
    });

    it("apy", async function() {
        /*
        let apyHPT = await this.claimLens.Apy(this.cHUSD, this.HPT, true, false);
        console.log("HPT borrow APY in " + this.cHUSD + " " + apyHPT.toString());
        apyHPT = await this.claimLens.Apy(this.cHUSD, this.HPT, false, true);
        console.log("HPT supply APY in " + this.cHUSD + " " + apyHPT.toString());
        apyHPT = await this.claimLens.Apy(this.cUSDT, this.HPT, true, false);
        console.log("HPT borrow APY in " + this.cUSDT + " " + apyHPT.toString());
        apyHPT = await this.claimLens.Apy(this.cUSDT, this.HPT, false, true);
        console.log("HPT supply APY in " + this.cUSDT + " " + apyHPT.toString());

        let apyDEP = await this.claimLens.Apy(this.cHUSD, this.DEP, true, false);
        console.log("DEP borrow APY in " + this.cHUSD + " " + apyDEP.toString());
        apyDEP = await this.claimLens.Apy(this.cHUSD, this.DEP, false, true);
        console.log("DEP supply APY in " + this.cHUSD + " " + apyDEP.toString());
        apyDEP = await this.claimLens.Apy(this.cUSDT, this.DEP, true, false);
        console.log("DEP borrow APY in " + this.cUSDT + " " + apyDEP.toString());
        apyDEP = await this.claimLens.Apy(this.cUSDT, this.DEP, false, true);
        console.log("DEP supply APY in " + this.cUSDT + " " + apyDEP.toString());
        */
    });

});
