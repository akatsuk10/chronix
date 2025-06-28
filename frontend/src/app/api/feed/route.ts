import { api } from "@/lib/datastrems/datastream";
import { ethers } from "ethers";
import { NextResponse } from "next/server";
import { getUnixTime } from "date-fns";
import { formatUnits } from "viem";
import CONTRACT_ABI from "@/abis/Verify.json"

const rpcUrl = "https://avalanche-fuji.infura.io/v3/bf0eb0299a5b4c12b3a8a7df5ea6c520"
const privateKey = "f96f6fdfc1d18b7d14e8879c0033831885ffec4eab6eda5a0be88615e4fa8465"
// pages/api/feed/route.ts (or similar path)
function bigIntToString(obj: any): any {
    if (typeof obj === "bigint") return obj.toString();
    if (Array.isArray(obj)) return obj.map(bigIntToString);
    if (typeof obj === "object" && obj !== null) {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, bigIntToString(v)])
      );
    }
    return obj;
  }
  
  export async function GET(request: Request) {
    const feedId = "0x00037da06d56d083fe599397a4769a042d63aa73dc4ef57709d31e9971a5b439";
    const timestamp = getUnixTime(new Date());
    const contractAddress = "0xc326E9F2530EB264c32CDd61e98A8844A061BF31";
    
    try {
      const report = await api.fetchFeed({
        timestamp,
        feed: feedId,
      });
  
      const safeReport = bigIntToString(report);
      
    //   const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    //   const wallet = new ethers.Wallet(privateKey,provider);
    //   const contract = new ethers.Contract(contractAddress,CONTRACT_ABI,wallet)

    //   const tx = await contract.verifyReport(safeReport.rawReport)
    //   await tx.wait();

    //   const price = await contract.lastDecodedPrice()

      return NextResponse.json([
        {
          feedId,
          report: safeReport,
          
        },
      ]);
    } catch (error: any) {
      console.error("Error fetching feed:", error);
      return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
    }
  }