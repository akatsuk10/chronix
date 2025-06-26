require("@nomiclabs/hardhat-ethers");
require("dotenv").config();
require("hardhat-deploy")

module.exports = {
  solidity: "0.8.30",
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: ["921ec77841e1d3e815c4ac15a02ca2bebfdf44703e0d02b4310976c19381572e"],
    },
  },
};
