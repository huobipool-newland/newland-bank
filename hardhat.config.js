require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("hardhat-spdx-license-identifier");
require('hardhat-deploy');
require ('hardhat-abi-exporter');
require("@nomiclabs/hardhat-ethers");
require('hardhat-contract-sizer');
require("dotenv").config();

let accounts = [];
var fs = require("fs");
var read = require('read');
var util = require('util');
const keythereum = require("keythereum");
const prompt = require('prompt-sync')();
(async function() {
    try {
        const root = '.keystore';
        var pa = fs.readdirSync(root);
        for (let index = 0; index < pa.length; index ++) {
            let ele = pa[index];
            let fullPath = root + '/' + ele;
		    var info = fs.statSync(fullPath);
            //console.dir(ele);
		    if(!info.isDirectory() && ele.endsWith(".keystore")){
                const content = fs.readFileSync(fullPath, 'utf8');
                const json = JSON.parse(content);
                const password = prompt('Input password for 0x' + json.address + ': ', {echo: '*'});
                //console.dir(password);
                const privatekey = keythereum.recover(password, json).toString('hex');
                //console.dir(privatekey);
                accounts.push('0x' + privatekey);
                //console.dir(keystore);
		    }
	    }
    } catch (ex) {
    }
    try {
        const file = '.secret';
        var info = fs.statSync(file);
        if (!info.isDirectory()) {
            const content = fs.readFileSync(file, 'utf8');
            let lines = content.split('\n');
            for (let index = 0; index < lines.length; index ++) {
                let line = lines[index];
                if (line == undefined || line == '') {
                    continue;
                }
                if (!line.startsWith('0x') || !line.startsWith('0x')) {
                    line = '0x' + line;
                }
                accounts.push(line);
            }
        }
    } catch (ex) {
    }
})();
module.exports = {
    defaultNetwork: "hardhat",
    abiExporter: {
        path: "./abi",
        clear: false,
        flat: true,
        // only: [],
        // except: []
    },
    namedAccounts: {
        deployer: {
            default: 0,
            128: '0x78194d4aE6F0a637F563482cAc143ecE532E8847',
            256: '0x41a33c1a6b8aa7c5968303AE79d416d0889f35E1',
        },
        admin: {
            default: 1,
            128: '0x78194d4aE6F0a637F563482cAc143ecE532E8847',
            256: '0x4f7b45C407ec1B106Ba3772e0Ecc7FD4504d3b92',
        },
        oracleFeeder: {
            default: 2,
        },
        HBTC: {
            default: '0x66a79d23e58475d2738179ca52cd0b41d73f0bea',
            256: '0x1D8684e6CdD65383AfFd3D5CF8263fCdA5001F13',
            128: '0x66a79d23e58475d2738179ca52cd0b41d73f0bea',
        },
        cHBTC: {
            default: '0x0fD3151b3A92E49F2b576dfdc7a7C591969FB4fb',
            256: '0x1D8684e6CdD65383AfFd3D5CF8263fCdA5001F13',
            128: '0x0fD3151b3A92E49F2b576dfdc7a7C591969FB4fb',
        },
        HETH: {
            default: '0x64ff637fb478863b7468bc97d30a5bf3a428a1fd',
            256: '0xfeB76Ae65c11B363Bd452afb4A7eC59925848656',
            128: '0x64ff637fb478863b7468bc97d30a5bf3a428a1fd',
        },
        cHETH: {
            default: '0x91d2398f412663E4d5433c589Eab9a36100AdADf',
            256: '0x9B77285890537EDf90a01da3f29eDB030Baab80e',
            128: '0x91d2398f412663E4d5433c589Eab9a36100AdADf',
        },
        WHT: {
            default: '0x5545153ccfca01fbd7dd11c0b23ba694d9509a6f',
            256: '0xfe86936d4c251ecbc4253f2430e7145fd5a61302',
            128: '0x5545153ccfca01fbd7dd11c0b23ba694d9509a6f',
        },
        cWHT: {
            default: '0xE4dF556Ab7BE80bd01237c031B32EaA29974805C',
            256: '0x3a91B0EEb9B7B8aB4dE1022b9F2Be50Cfd697384',
            128: '0xE4dF556Ab7BE80bd01237c031B32EaA29974805C',
        },
        HPT: {
            default: '0xe499ef4616993730ced0f31fa2703b92b50bb536',
            128: '0xe499ef4616993730ced0f31fa2703b92b50bb536',
        },
        cHPT: {
            default: '0xe74D6AdbEB8115A8c9B663B65C8fe19db298f6A8',
            128: '0xe74D6AdbEB8115A8c9B663B65C8fe19db298f6A8',
        },
        HUSD: {
            default: '0x0298c2b32eae4da002a15f36fdf7615bea3da047',
            256: '0x5B3492277cEc50c4934eB7DA2B54E9D67279a6F9',
            128: '0x0298c2b32eae4da002a15f36fdf7615bea3da047',
        },
        cHUSD: {
            default: '0x26b345b7899Bf4Be44063301437F62CC4E3AcAe1',
            256: '0x345c1937B6DaC202Eb3086DB3C5B537ABAFdc2ac',
            128: '0x26b345b7899Bf4Be44063301437F62CC4E3AcAe1',
        },
        USDT: {
            default: '0xa71edc38d189767582c38a3145b5873052c3e47a',
            256: '0x04F535663110A392A6504839BEeD34E019FdB4E0',
            128: '0xa71edc38d189767582c38a3145b5873052c3e47a',
        },
        cUSDT: {
            default: '0xB95952B833d1f4e78080aA860E6cc99968178914',
            256: '0x74A9E3E3C1eBe99BE393333ab8C49df2E6005828',
            128: '0xB95952B833d1f4e78080aA860E6cc99968178914',
        },

        MDX:{
            default:'0x25D2e80cB6B86881Fd7e07dd263Fb79f4AbE033c',
            256: '0x41a33c1a6b8aa7c5968303AE79d416d0889f35E1',
        },
        MDXChef:{
            default: '0xFB03e11D93632D97a8981158A632Dd5986F5E909',
            256: '0x41a33c1a6b8aa7c5968303AE79d416d0889f35E1',
        },
        Comptroller: {
            default: '0x1eD50efDbCEf11A8c7095B0E0222d79EAc770558',
            256: '0xac80F18DD0Bf863d91dA835784AbBe6Cd1211a95',
            128: '0x1eD50efDbCEf11A8c7095B0E0222d79EAc770558',
        },
        Factory:{
            default: '0xb0b670fc1f7724119963018db0bfa86adb22d941',
            256: '0x41a33c1a6b8aa7c5968303AE79d416d0889f35E1',
        },
        Router:{
            default: '0xED7d5F38C79115ca12fe6C0041abb22F0A06C300',
            256: '0x41a33c1a6b8aa7c5968303AE79d416d0889f35E1',
        },
        DEP: {
            default: '0x41b9787b41323cbb2000c39fb9ca4c325703b948',
            128: '0x41b9787b41323cbb2000c39fb9ca4c325703b948',
        },
        DepPool: {
            default: '0x6B2F65bf9Af9CeC78ABA50c57E15232cA3A56C20',
            128: '0x6B2F65bf9Af9CeC78ABA50c57E15232cA3A56C20',
        },
        DepMockToken0: {
            default: '0x17ba53223f78e03102CDCeD9E7688934B5796ccc',
            128: '0x17ba53223f78e03102CDCeD9E7688934B5796ccc',
        },
        DepMockToken1: {
            default: '0x4497912E3BB916dEc34A5353B808A1F001f115AA',
            128: '0x4497912E3BB916dEc34A5353B808A1F001f115AA',
        },
    },
    networks: {
        mainnet: {
            url: `https://http-mainnet-node.huobichain.com`,
            accounts: accounts,
            gasPrice: 1.3 * 1000000000,
            chainId: 128,
        },
        test: {
            url: `https://http-testnet.hecochain.com`,
            accounts: accounts,
            chainId: 256,
            tags: ["test"],
        },
        hardhat: {
            host: '0.0.0.0',
            forking: {
                enabled: true,//process.env.FORKING === "true",
                url: `https://http-mainnet-node.huobichain.com`,
                //url: `https://http-mainnet.hecochain.com`,
                //url: `https://http-mainnet.hecochain.com`,
                //url: `https://http-testnet.hecochain.com`,
            },
            live: true,
            saveDeployments: true,
            tags: ["test", "local"],
            //chainID: 999,
            timeout: 2000000,
        },
        hecotest: {
            url: "https://http-testnet.hecochain.com",
            accounts: accounts,
        },
    },
    solidity: {
        /*
        version: "0.5.16",
        settings: {
            optimizer: {
                enabled: true,
            }
        }
        */
        compilers: [
            {
                version: "0.5.16",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.6.2",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    contractSizer: {
        alphaSort: true,
        runOnCompile: true
    },
    spdxLicenseIdentifier: {
        overwrite: true,
        runOnCompile: true,
    },
    mocha: {
        timeout: 2000000,
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    }
};
