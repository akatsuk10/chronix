const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying contracts from:", deployer.address);

  // Chainlink Feed addresses on Fuji
  const BTC_FEED = "0x2779D32d5166BAaa2B2b658333bA7e6Ec0C65743"; // BTC/USD
  const AVAX_USD = "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD"; // AVAX/USD
  const EMCH_FEED = "0x0d2807dc7FA52d3B38be564B64a2b37753C49AdD"; // EMCH/USD

  // 1. Deploy VaultBetting (Merged Contract)
  const VaultBetting = await hre.ethers.getContractFactory("VaultBetting");
  const betting = await VaultBetting.deploy(BTC_FEED);
  await betting.deployed();
  console.log("✅ VaultBetting deployed at:", betting.address);

  // 2. Deploy CarbonCredit
  const CarbonCredit = await hre.ethers.getContractFactory("CarbonCredit");
  const carbon = await CarbonCredit.deploy(AVAX_USD, EMCH_FEED);
  await carbon.deployed();
  console.log("✅ CarbonCredit deployed at:", carbon.address);

  // 3. Deploy Lottery with Chainlink VRF configs
  const subscriptionId = hre.ethers.BigNumber.from("101394378300481048569531429903084182062350173979824139452347975085728304527293"); // Replace with your actual VRF subscription ID
  const WEEK_IN_SECONDS = 7 * 24 * 60 * 60;
  const VRF_COORDINATOR = "0x5c210ef41cd1a72de73bf76ec39637bb0d3d7bee";
  const KEY_HASH = "0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61";

  const Lottery = await hre.ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(
    subscriptionId,
    WEEK_IN_SECONDS,
    VRF_COORDINATOR,
    KEY_HASH
  );
  await lottery.deployed();
  console.log("✅ Lottery deployed at:", lottery.address);

  // === Contract Wiring ===
  await betting.setCarbonContract(carbon.address);
  console.log("🔗 VaultBetting: CarbonCredit connected");

  await betting.setLotteryContract(lottery.address);
  console.log("🔗 VaultBetting: Lottery connected");

  await lottery.setBettingContract(betting.address);
  console.log("🔗 Lottery: VaultBetting connected");

  // ✅ Final Summary
  console.log("\n🎯 Deployment Complete:");
  console.log("VaultBetting:", betting.address);
  console.log("CarbonCredit:", carbon.address);
  console.log("Lottery:", lottery.address);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
