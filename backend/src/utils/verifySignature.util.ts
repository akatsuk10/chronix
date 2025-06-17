import { ethers } from "ethers";

export function verifySignature(message: string, signature: string, expectedAddress: string): boolean {
  const recoveredAddress = ethers.verifyMessage(message, signature);
  return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
}
