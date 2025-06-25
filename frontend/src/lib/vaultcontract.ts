import { BrowserProvider, Contract, parseEther, formatEther, Eip1193Provider } from "ethers";
import Vault from "../../../smartcontract/artifacts/contracts/UserVault.sol/Vault.json";

const CONTRACT_ADDRESS = "0xF0a7E9D9Ce8A30233cb0aC1b8726A2B327F019F2";
const ABI = Vault.abi;

function getEthereum(): Eip1193Provider {
  if (typeof window === "undefined") throw new Error("Must run in browser");
  const { ethereum } = window as typeof window & { ethereum?: unknown };
  if (!ethereum || typeof (ethereum as any).request !== "function") {
    throw new Error("Ethereum wallet not found. Please install MetaMask.");
  }
  return ethereum as unknown as Eip1193Provider;
}

export const getVaultContract = async (): Promise<Contract> => {
  const provider = new BrowserProvider(getEthereum());
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, ABI, signer);
};

export const depositAVAX = async (amountInEth: string) => {
  const contract = await getVaultContract();
  const tx = await contract.depositAVAX({ value: parseEther(amountInEth) });
  return await tx.wait();
};

export const getUserVaultBalance = async (userAddress: string): Promise<string> => {
  const provider = new BrowserProvider(getEthereum());
  const contract = new Contract(CONTRACT_ADDRESS, ABI, provider);
  const balance = await contract.getAVAXBalance(userAddress);
  return formatEther(balance);
};
