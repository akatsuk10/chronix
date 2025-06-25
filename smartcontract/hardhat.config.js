require("@nomiclabs/hardhat-ethers");
require("dotenv").config();
require("hardhat-deploy")

module.exports = {
  solidity: "0.8.30",
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [process.env.FUJI_KEY],
    },
  },
};
