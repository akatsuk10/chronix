const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserVault & BTCBetting Integration", function () {
  let owner, user, vault, betting;

  beforeEach(async function () {
    [owner, user, ...addrs] = await ethers.getSigners();

    // Deploy BTCBetting
    const Betting = await ethers.getContractFactory("BTCBetting");
    betting = await Betting.deploy();
    await betting.deployed();

    // Deploy UserVault
    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy();
    await vault.deployed();

    // Wire contracts
    await vault.setBettingContract(betting.address);
    await betting.setVault(vault.address);
  });

  it("should allow deposit and place bet", async function () {
    // User deposits AVAX to vault
    await vault.connect(user).depositAVAX({ value: ethers.utils.parseEther("1") });
    expect(await vault.getAVAXBalance(user.address)).to.equal(ethers.utils.parseEther("1"));

    // User places a bet (position 0 = Long)
    await vault.connect(user).placeBetFromVault(ethers.utils.parseEther("0.1"), 0);

    // Check bet is active in betting contract
    const bet = await betting.getBet(user.address);
    expect(bet.amount).to.equal(ethers.utils.parseEther("0.1"));
    expect(bet.position).to.equal(0);
    expect(bet.settled).to.equal(false);
  });

  it("should not allow bet if not enough vault balance", async function () {
    await expect(
      vault.connect(user).placeBetFromVault(ethers.utils.parseEther("1"), 0)
    ).to.be.revertedWith("Insufficient vault balance");
  });

  it("should not allow multiple active bets", async function () {
    await vault.connect(user).depositAVAX({ value: ethers.utils.parseEther("1") });
    await vault.connect(user).placeBetFromVault(ethers.utils.parseEther("0.1"), 0);

    await expect(
      vault.connect(user).placeBetFromVault(ethers.utils.parseEther("0.1"), 1)
    ).to.be.revertedWith("Betting failed");
  });
}); 