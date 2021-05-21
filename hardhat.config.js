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

const { API_URL, PRIVATE_KEY } = process.env;
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
            128: '0xA8c2f5E3427a94cd8a0BC8d42DdbA574f890E2b4',
        },
        admin: {
            default: 1,
            128: '0xA8c2f5E3427a94cd8a0BC8d42DdbA574f890E2b4',
        },
        caller: {
            default: 2,
            128: '0xA8c2f5E3427a94cd8a0BC8d42DdbA574f890E2b4',
        },
        worker: {
            default: 3,
            128: '0xA8c2f5E3427a94cd8a0BC8d42DdbA574f890E2b4',
        },
        receiver: {
            default: 4,
            128: '0xA8c2f5E3427a94cd8a0BC8d42DdbA574f890E2b4',
        },
        MDX:{
            default:'0x25D2e80cB6B86881Fd7e07dd263Fb79f4AbE033c'
        },
        MDXChef:{
            default: '0xFB03e11D93632D97a8981158A632Dd5986F5E909'
        },
        USDT:{
            default: '0xa71edc38d189767582c38a3145b5873052c3e47a'
        },
        HBTC:{
            default: '0x66a79d23e58475d2738179ca52cd0b41d73f0bea'
        },
        WHT:{
            default: '0x5545153ccfca01fbd7dd11c0b23ba694d9509a6f'
        },
        Factory:{
            default: '0xb0b670fc1f7724119963018db0bfa86adb22d941'
        },
        Router:{
            default: '0xED7d5F38C79115ca12fe6C0041abb22F0A06C300'
        }
    },
    networks: {
        mainnet: {
            url: `https://http-mainnet-node.huobichain.com`,
            accounts: accounts,
            gasPrice: 1.3 * 1000000000,
            chainId: 128,
        },
        hardhat: {
            host: '0.0.0.0',
            forking: {
                enabled: true,//process.env.FORKING === "true",
                //url: `https://http-mainnet-node.huobichain.com`,
                //url: `https://http-mainnet.hecochain.com`,
                url: `https://http-mainnet.hecochain.com`,
            },
            live: true,
            saveDeployments: true,
            tags: ["test", "local"],
            //chainID: 999,
            timeout: 2000000,
        },
        /*
        hecotest: {
            url: "https://http-testnet.hecochain.com",
            //accounts: [`0xcffee5a02647e57260a4c4641016fa745b1f567b204c97f5a3f73103404aced2`]
            accounts: [PRIVATE_KEY]
        },
        */
    },
    solidity: {
        version: "0.5.16",
        settings: {
            optimizer: {
                enabled: true,
            }
        }
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
    }
};
