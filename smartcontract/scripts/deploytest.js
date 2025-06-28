const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

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
  const subscriptionId =hre.ethers.BigNumber.from("101394378300481048569531429903084182062350173979824139452347975085728304527293"); // <-- replace with your uint64 Chainlink sub ID
  const WEEK_IN_SECONDS = 7 * 24 * 60 * 60;
  const VRF_COORDINATOR = "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE";
  const KEY_HASH =
    "0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887";

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
  await vault.setBettingContract(betting.address);

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
