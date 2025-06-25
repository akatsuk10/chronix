import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { depositAVAX, getUserVaultBalance } from "@/lib/vaultcontract";

export const deposit = createAsyncThunk(
  "lottery/deposit",
  async ({ amountInEth }: { amountInEth: string }) => {
    const txReceipt = await depositAVAX(amountInEth);
    return {
      transactionHash: txReceipt.hash, // ✅ use hash only
      status: txReceipt.status,
    };
  }
);


export const fetchVaultBalance = createAsyncThunk(
  "vault/fetchBalance",
  async (userAddress: string, { rejectWithValue }) => {
    try {
      return await getUserVaultBalance(userAddress);
    } catch (err: any) {
      return rejectWithValue(err?.reason || err?.message || "Balance fetch failed");
    }
  }
);

const vaultSlice = createSlice({
  name: "vault",
  initialState: {
    loading: false,
    error: null as string | null,
    balance: "0",
    lastTxHash: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(deposit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deposit.fulfilled, (state, action) => {
        state.loading = false;
        state.lastTxHash = action.payload.transactionHash;
      })
      .addCase(deposit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchVaultBalance.fulfilled, (state, action) => {
        state.balance = action.payload;
      });
  },
});

export default vaultSlice.reducer;
