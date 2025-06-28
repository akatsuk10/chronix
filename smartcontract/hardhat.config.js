require("@nomiclabs/hardhat-ethers");
require("dotenv").config();
require("hardhat-deploy")

module.exports = {
  solidity: "0.8.30",
  networks: {
    fuji: {
      url: "https://avalanche-fuji.infura.io/v3/bf0eb0299a5b4c12b3a8a7df5ea6c520",
      accounts: ["f96f6fdfc1d18b7d14e8879c0033831885ffec4eab6eda5a0be88615e4fa8465"],
    },
  },
};
