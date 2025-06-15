const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault Contract", () => {
  let vault, usdt;
  let owner, user;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();

    // Deploy Vault
    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy();
    await vault.waitForDeployment();

    console.log("Vault address:", vault.target);
    console.log("MockUSDT address:", usdt.target);

    // Transfer some USDT to user
    await usdt.transfer(user.address, ethers.parseUnits("1000", 6));
  });

  it("should deposit and withdraw AVAX", async () => {
    const depositAmount = ethers.parseEther("1.0");
    const withdrawAmount = ethers.parseEther("0.5");

    // Deposit 1 AVAX
    await vault.connect(user).depositAVAX({ value: depositAmount });

    const balance = await vault.getAVAXBalance(user.address);
    console.log(
      "balance before withdrawal:",
      ethers.formatEther(balance),
      "AVAX"
    );
    expect(balance).to.equal(depositAmount);

    // Withdraw 0.5 AVAX
    await vault.connect(user).withdrawAVAX(withdrawAmount);

    const balanceAfter = await vault.getAVAXBalance(user.address);
    console.log(
      "balance after withdrawal:",
      ethers.formatEther(balanceAfter),
      "AVAX"
    );
    expect(balanceAfter).to.equal(ethers.parseEther("0.5"));
  });

  it("should deposit and withdraw USDT token", async () => {
    const amount = ethers.parseUnits("500", 6); // 500 USDT

    await usdt.connect(user).approve(vault.target, amount);
    await vault.connect(user).depositToken(usdt.target, amount);

    const tokenBalance = await vault.getTokenBalance(
      usdt.target,
      user.address
    );
    console.log(`Token balance after deposit: ${tokenBalance.toString()} USDT`);
    expect(tokenBalance).to.equal(amount);

    await vault.connect(user).withdrawToken(usdt.target, amount);

    const tokenBalanceAfter = await vault.getTokenBalance(
      usdt.target,
      user.address
    );
    console.log(
      `Token balance after withdrawal: ${tokenBalanceAfter.toString()} USDT`
    );
    expect(tokenBalanceAfter).to.equal(0);
  });
});
