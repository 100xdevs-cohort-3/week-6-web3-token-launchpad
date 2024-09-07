import React, { useState } from 'react';
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { MINT_SIZE, TOKEN_2022_PROGRAM_ID, createMintToInstruction, createAssociatedTokenAccountInstruction, getMintLen, createInitializeMetadataPointerInstruction, createInitializeMintInstruction, TYPE_SIZE, LENGTH_SIZE, ExtensionType, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { PublicKey } from '@solana/web3.js';

export function TokenLaunchpad() {
    const { connection } = useConnection();
    const wallet = useWallet();
    
    // State for token creation
    const [tokenName, setTokenName] = useState('');
    const [tokenSymbol, setTokenSymbol] = useState('');
    const [tokenImage, setTokenImage] = useState('');
    const [initialSupply, setInitialSupply] = useState(0);
    
    // State for liquidity management
    const [liquidityAmount, setLiquidityAmount] = useState({
        base: 0,
        quote: 0,
    });

    async function createToken() {
        const mintKeypair = Keypair.generate();
        const metadata = {
            mint: mintKeypair.publicKey,
            name: tokenName,
            symbol: tokenSymbol,
            uri: tokenImage,
            additionalMetadata: [],
        };

        const mintLen = getMintLen([ExtensionType.MetadataPointer]);
        const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

        const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                newAccountPubkey: mintKeypair.publicKey,
                space: mintLen,
                lamports,
                programId: TOKEN_2022_PROGRAM_ID,
            }),
            createInitializeMetadataPointerInstruction(mintKeypair.publicKey, wallet.publicKey, mintKeypair.publicKey, TOKEN_2022_PROGRAM_ID),
            createInitializeMintInstruction(mintKeypair.publicKey, 9, wallet.publicKey, null, TOKEN_2022_PROGRAM_ID),
            createInitializeInstruction({
                programId: TOKEN_2022_PROGRAM_ID,
                mint: mintKeypair.publicKey,
                metadata: mintKeypair.publicKey,
                name: metadata.name,
                symbol: metadata.symbol,
                uri: metadata.uri,
                mintAuthority: wallet.publicKey,
                updateAuthority: wallet.publicKey,
            }),
        );

        transaction.feePayer = wallet.publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.partialSign(mintKeypair);

        await wallet.sendTransaction(transaction, connection);

        console.log(`Token mint created at ${mintKeypair.publicKey.toBase58()}`);
        const associatedToken = getAssociatedTokenAddressSync(
            mintKeypair.publicKey,
            wallet.publicKey,
            false,
            TOKEN_2022_PROGRAM_ID,
        );

        const transaction2 = new Transaction().add(
            createAssociatedTokenAccountInstruction(
                wallet.publicKey,
                associatedToken,
                wallet.publicKey,
                mintKeypair.publicKey,
                TOKEN_2022_PROGRAM_ID,
            ),
        );

        await wallet.sendTransaction(transaction2, connection);

        const transaction3 = new Transaction().add(
            createMintToInstruction(mintKeypair.publicKey, associatedToken, wallet.publicKey, initialSupply * 10 ** 9, [], TOKEN_2022_PROGRAM_ID)
        );

        await wallet.sendTransaction(transaction3, connection);

        console.log("Minted!");
    }

    const addLiquidity = async () => {
        // Placeholder for adding liquidity logic
        console.log("Adding liquidity...");
        // Implement the actual liquidity addition logic here
    };

    const removeLiquidity = async () => {
        // Placeholder for removing liquidity logic
        console.log("Removing liquidity...");
        // Implement the actual liquidity removal logic here
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            padding: '20px',
            boxSizing: 'border-box',
        }}>
            <h1>Solana Token Launchpad</h1>
            <input
                className='inputText'
                type='text'
                placeholder='Token Name'
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
            /> <br />
            <input
                className='inputText'
                type='text'
                placeholder='Token Symbol'
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
            /> <br />
            <input
                className='inputText'
                type='text'
                placeholder='Image URL'
                value={tokenImage}
                onChange={(e) => setTokenImage(e.target.value)}
            /> <br />
            <input
                className='inputText'
                type='number'
                placeholder='Initial Supply'
                value={initialSupply}
                onChange={(e) => setInitialSupply(e.target.value)}
            /> <br />
            <button onClick={createToken} className='btn'>Create a Token</button>

            {/* Liquidity Management Section */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <h3>Manage Liquidity</h3>
                <input
                    type="number"
                    placeholder="Base Amount (Your Token)"
                    value={liquidityAmount.base}
                    onChange={(e) => setLiquidityAmount({ ...liquidityAmount, base: parseFloat(e.target.value) })}
                />
                <input
                    type="number"
                    placeholder="Quote Amount (e.g., USDC)"
                    value={liquidityAmount.quote}
                    onChange={(e) => setLiquidityAmount({ ...liquidityAmount, quote: parseFloat(e.target.value) })}
                />
                <div>
                    <button onClick={addLiquidity}>Add Liquidity</button>
                    <button onClick={removeLiquidity}>Remove Liquidity</button>
                </div>
            </div>
        </div>
    );
}