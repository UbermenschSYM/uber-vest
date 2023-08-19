# uber-vest
uber-vest is solidity program & typescript SDK for interacting with contract on solana. It allows you to make "vesting accounts" and send tokens, and taker will be able to claim them.
on each vesting state, you are able to set following params:
```
taker - account which will be able to claim tokens
cliff - time after which taker will be able to claim tokens
interval - time interval which should pass for next unlock
amount - amount unlocked in each interval time after cliff
```

```typescript
import { Account, Connection, PublicKey } from "@solana/web3.js";
let account = new Account([YOUR_PRIVATE_KEY]);
let uberVestSDK = await UberVest.init(account, new Connection("https://api.devnet.solana.com"));

// for initializing dataAccount
await uberVestSDK.createDataAccount()

// for creating vesting state
await uberVestSDK.createVestingAccount(
        account.publicKey,                                                 // taker
        new PublicKey("EWdWDWfTEZpyyb2bdrdjZbivscp9nYYM8Wzce4yLrJq"),      // token mint
        new PublicKey("ApGtvgszFDq4HwSrHmZfvfggN57WdP9qkSfV5cykK1AL"),     // user token account
        new PublicKey("B1GG15sCv5LkFYRnageRngaFvq4LVeq1Ei2DPdjv2xCG"),     // pda token account
        1000,                                                              // amount of vested tokens overall
        0,                                                                 // cliff
        50,                                                                // interval
        300,                                                               // amount which will be unlocked in each interval time after cliff
    )

// claiming tokens
await uberVestSDK.claimVestedTokens(
        account.publicKey,                                                 // taker publickey
        new PublicKey("ApGtvgszFDq4HwSrHmZfvfggN57WdP9qkSfV5cykK1AL"),     // taker token account
        new PublicKey("B1GG15sCv5LkFYRnageRngaFvq4LVeq1Ei2DPdjv2xCG"),     // pda token account
        new PublicKey("2vVQ77NTSZQz3xAm86bvyBQRnSZMenDq4Et9sTh9CxfD"),     // pda
        0,                                                                 // id of vest account in dataAccount's vest_accounts array
    )
```

If you want to deploy the solidity program yourself

```bash
solang compile --target solana uber_vest.sol -v 
solana program deploy uber_vest.so
```
