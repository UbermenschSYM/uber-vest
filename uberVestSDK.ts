import { AnchorProvider, Program } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { token } from "@coral-xyz/anchor/dist/cjs/utils";
import { Account, Connection, Keypair, PublicKey } from "@solana/web3.js"
import { BN } from "bn.js";
import { readFileSync } from "fs";
import * as anchor from "@coral-xyz/anchor";
import { createAssociatedTokenAccount } from "@solana/spl-token";

const IDL = JSON.parse(readFileSync('./uber_vest.json', 'utf8'));

export class UberVest {
    private wallet: Account;
    private connection: Connection;
    private program: Program<typeof IDL>;
    private dataAccount: PublicKey;
    constructor(wallet: Account, connection: Connection, program: Program<typeof IDL>) {
        this.wallet = wallet;
        this.connection = connection;
        this.program = program;
        this.dataAccount = new PublicKey("Cw2wyxbtv4cy69VWi71RMMhspwRw9LTZBUvLF2qcwGk8");
    }

    static async init(wallet: Account, connection: Connection){
        let programId = new PublicKey(IDL.metadata.address);
        
        const provider = new AnchorProvider(
            connection,
            new NodeWallet(new Keypair({
                publicKey: wallet.publicKey.toBuffer(),
                secretKey: wallet.secretKey,
            })),
            { commitment: "confirmed", preflightCommitment: "confirmed"}
        );

        let program = new Program(IDL, programId, provider);

        return new UberVest(wallet, connection, program);
    }

    public async createDataAccount() {
        let dataAccount = Keypair.generate();
        let txx = await this.program.methods.new()
        .accounts({ dataAccount: dataAccount.publicKey })
        .signers([dataAccount]).rpc();
        this.dataAccount = dataAccount.publicKey;
        return txx;
    }

    public async createVestingAccount(
        taker: PublicKey,
        tokenMint: PublicKey,
        userTokenAccount: PublicKey,
        pdaTokenAccount: PublicKey,
        amountOfTokens: number,
        cliff: number,
        interval: number,
        amountPerClaim: number,
    ) {
        let [pdaAccount, _] = PublicKey.findProgramAddressSync(
            [
                anchor.utils.bytes.utf8.encode("uber-vest"),
            ],
            new PublicKey(IDL.metadata.address),
        );
        let tx = await this.program.methods.addVest(
            taker,
            tokenMint,
            this.wallet.publicKey,
            userTokenAccount,
            pdaTokenAccount,
            pdaAccount,
            new BN(amountOfTokens),
            new BN(cliff),
            new BN(interval),
            new BN(amountPerClaim),
        ).accounts({
            dataAccount: new PublicKey("Cw2wyxbtv4cy69VWi71RMMhspwRw9LTZBUvLF2qcwGk8"),
        }).remainingAccounts([
            {pubkey: taker, isWritable: false, isSigner: false},
            {pubkey: tokenMint, isWritable: false, isSigner: false},
            {pubkey: this.wallet.publicKey, isWritable: true, isSigner: true},
            {pubkey: userTokenAccount, isWritable: true, isSigner: false},
            {pubkey: pdaTokenAccount, isWritable: true, isSigner: false},
            {pubkey: pdaAccount, isWritable: false, isSigner: false},
        ]).signers([this.wallet]).rpc();

        // create pda_token_account if it doesn't exist

        // let tx = await this.program.methods.check(
        //     this.wallet.publicKey,
        //     userTokenAccount,
        // ).accounts({
        //     dataAccount: new PublicKey("H2CEmrQ5kCamyxcxf1bP1kxcB5B3PAFFFtQcQAs6yhEc"),
        // }).remainingAccounts([
        //     {pubkey: this.wallet.publicKey, isWritable: false, isSigner: false},
        //     {pubkey: userTokenAccount, isWritable: false, isSigner: false},
        // ]).rpc();
        console.log(tx);
        // let res = await createTokenAccount(this.connection, this.wallet, tokenMint, pdaAccount);
        console.log(pdaAccount.toBase58());

        // return res;
    }

    public async claimVestedTokens(
        taker: PublicKey,
        takerTokenAccount: PublicKey,
        pdaTokenAccount: PublicKey,
        pda: PublicKey,
        vestId: number,
    ) {
        let tx = await this.program.methods.claimTokens(
            // taker,
            takerTokenAccount,
            pdaTokenAccount,
            pda,
            new BN(vestId),
        ).accounts({
            dataAccount: this.dataAccount,
        }).remainingAccounts([
            // {pubkey: this.wallet.publicKey, isWritable: true, isSigner: true},
            {pubkey: takerTokenAccount, isWritable: true, isSigner: false},
            {pubkey: pdaTokenAccount, isWritable: true, isSigner: false},
            {pubkey: pda, isWritable: true, isSigner: false},
        ]).signers([this.wallet]).rpc();
        return tx;
    }
}
