import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getMintLen,
  createInitializeMintInstruction,
  ExtensionType,
  mintTo,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { createInitializeRaydiumPoolInstruction } from "raydium-sdk"; // Import from Raydium SDK
import {useState} from "react";

export function TokenLaunchpadWithPool() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [tokenMintAddress, setTokenMintAddress] = useState(null);
  const [poolAddress, setPoolAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function createToken() {
    setLoading(true);
    setErrorMessage("");
    try {
    const mintKeypair = Keypair.generate();
    const metadata = {
      mint: mintKeypair.publicKey,
      name: "100x-TOKEN",
      symbol: "100x",
      uri: "https://100xtokenlaunchpad.com/metadata.json",
    };

    const mintLen = getMintLen([ExtensionType.MetadataPointer]);

    const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        9,
        wallet.publicKey,
        null,
        TOKEN_2022_PROGRAM_ID
      )
    );

    const signature = await wallet.sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature, "confirmed");

    console.log("Token created:", mintKeypair.publicKey.toString());

    await createLiquidityPool(mintKeypair.publicKey);
  }
  catch (error) {
    console.error("Error creating token:", error);
    setErrorMessage(error.message);
  }
  finally {
    setLoading(false);
  }
}

  async function createLiquidityPool(tokenMint) {
    const poolKeypair = Keypair.generate();
    const liquidityAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.publicKey,
      tokenMint,
      wallet.publicKey
    );

    const transaction = new Transaction().add(
      createInitializeRaydiumPoolInstruction({
        poolMint: tokenMint,
        baseMint: liquidityAccount.address, // token to be paired with the new token
        quoteMint: "USDt", // Assume pair with USDT 
        poolKeypair: poolKeypair.publicKey,
        userAccount: wallet.publicKey,
      })
    );

    const signature = await wallet.sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature, "confirmed");

    console.log("Liquidity pool created:", poolKeypair.publicKey.toString());
  }

  return (
    <div>
      <h1>Token Launchpad with Liquidity Pool</h1>
      <button onClick={createToken} disabled={loading}>
        {loading ? "Processing..." : "Create Token and Pool"}
      </button>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      {tokenMintAddress && (
        <div>
          <p>Token Mint Address: {tokenMintAddress}</p>
        </div>
      )}
      {poolAddress && (
        <div>
          <p>Liquidity Pool Address: {poolAddress}</p>
        </div>
      )}
    </div>
  );
}
