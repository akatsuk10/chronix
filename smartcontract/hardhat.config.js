require("@nomiclabs/hardhat-ethers");
require("dotenv").config();
require("hardhat-deploy")

module.exports = {
  solidity: "0.8.30",
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: ["f96f6fdfc1d18b7d14e8879c0033831885ffec4eab6eda5a0be88615e4fa8465"],
    },
  },
};
