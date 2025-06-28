const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  // Chainlink feed addresses (Fuji)
  const BTC_FEED = "0x2779D32d5166BAaa2B2b658333bA7e6Ec0C65743";
  const AVAX_USD = "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD";
  const EMCH_FEED = "0x0d2807dc7FA52d3B38be564B64a2b37753C49AdD";

  // 1. Deploy Vault
  const Vault = await hre.ethers.getContractFactory("Vault");
  const vault = await Vault.deploy();
  await vault.deployed();
  console.log("Vault deployed at:", vault.address);

  // 2. Deploy CarbonCredit
  const CarbonCredit = await hre.ethers.getContractFactory("CarbonCredit");
  const carbon = await CarbonCredit.deploy(AVAX_USD, EMCH_FEED, true);
  await carbon.deployed();
  console.log("CarbonCredit deployed at:", carbon.address);

  // 3. Deploy BTCBetting
  const BTCBetting = await hre.ethers.getContractFactory("BTCBetting");
  const betting = await BTCBetting.deploy();
  await betting.deployed();
  console.log("BTCBetting deployed at:", betting.address);

  // 4. Deploy Lottery
  const subscriptionId = 123; // <-- replace with your uint64 Chainlink sub ID
  const WEEK_IN_SECONDS = 7 * 24 * 60 * 60;
  const VRF_COORDINATOR = "0x5c210ef41cd1a72de73bf76ec39637bb0d3d7bee";
  const KEY_HASH =
    "0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61";

  const Lottery = await hre.ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(
    subscriptionId,
    WEEK_IN_SECONDS,
    VRF_COORDINATOR,
    KEY_HASH
  );
  await lottery.deployed();
  console.log("Lottery deployed at:", lottery.address);

  // === Wire contracts ===
  await carbon.setBettingContract(betting.address);
  await betting.setLotteryContract(lottery.address);
  await betting.setCarbonContract(carbon.address);
  await betting.setVault(vault.address);
  await lottery.setBettingContract(betting.address);

  console.log("\n✅ Deployment and wiring complete!");
  console.log("Vault:", vault.address);
  console.log("CarbonCredit:", carbon.address);
  console.log("BTCBetting:", betting.address);
  console.log("Lottery:", lottery.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

