import "./spl_token.sol";
import { try_find_program_address, create_program_address } from 'solana';
import 'solana';

@program_id("AH2R8PggZ6cXqFA1gdKxpeYHKcKLuXkNAK9N24bvcND4")
contract uber_vest {

    struct vestData {
        address token_mint;
        address taker;
        uint64 amount_of_tokens;
        uint64 cliff;
        uint64 interval;
        uint64 last_claimed;
        uint64 amount_per_claim;
        uint64 creation_time;
    }

    vestData[5] public vest_data_list;
    uint64 public num = 0;

    @payer(payer)
    @space(10000)
    constructor() {
        
    }
    
    event msgAdr(address a);

    // function create_pda_token_account(
    //     address pda,
    //     address pda_token_account
    // ) public {

    // }

    function create_pda_token_account(
        address payer,
        address token_mint
    ) public {
        bytes1 bump;
        (, bump) = find_pda();
        
    }

    function add_vest(
        address taker,
        address token_mint,
        address user,
        address user_token_account,
        address pda_token_account,   // should check that owner of this account is pda
        address pda,                 // should check that this is pda account
        uint64 amount_of_tokens,
        uint64 cliff,
        uint64 interval,
        uint64 amount_per_claim
    ) public {
        if(num >= 5) {
            revert();
        }

        SplToken.TokenAccountData token_data = SplToken.get_token_account_data(pda_token_account);

        if(token_data.owner != pda) {
            revert();
        }

        address correct_pda;
        (correct_pda,) = find_pda();

        emit msgAdr(correct_pda);
        emit msgAdr(pda);

        if(correct_pda != pda) {
            revert();
        }

        vestData storage newVestData = vest_data_list[num];
        newVestData.token_mint = token_mint;
        newVestData.taker = taker;
        newVestData.amount_of_tokens = amount_of_tokens;
        newVestData.cliff = cliff;
        newVestData.interval = interval;
        newVestData.last_claimed = block.timestamp;
        newVestData.amount_per_claim = amount_per_claim;
        newVestData.creation_time = block.timestamp;
        vest_data_list[num] = newVestData;
        
        num += 1;
        
        SplToken.transfer(user_token_account, pda_token_account, user, amount_of_tokens);
    }

    function find_pda() public pure returns (address, bytes1) {
        return try_find_program_address(["uber-vest"], address"AH2R8PggZ6cXqFA1gdKxpeYHKcKLuXkNAK9N24bvcND4");
    }

    function claim_tokens(
        // address taker,
        address taker_token_account,
        address pda_token_account,
        address pda,
        uint64 vest_id
    ) public {
        // check if taker == vest_data_list[vest_id].taker
        // check that taker_token_account's mint is vest_data_list[vest_id].token_mint
        // check that pda_token_account's mint is vest_data_list[vest_id].token_mint
        // check that owner of pda_token_account is pda
        // check that pda really belongs to this program
        vestData storage data = vest_data_list[vest_id];
        uint64 current_time = block.timestamp;
        // if(taker != data.taker) {
        //     emit LogMessage(taker, data.taker, data.cliff);
        //     revert();
        // }

        if(data.creation_time + data.cliff > current_time) {
            revert();
        }

        if(data.last_claimed + data.interval > current_time) {
            revert();
        }

        data.last_claimed = current_time;

        vest_data_list[vest_id].last_claimed = current_time;

        uint64 transfer_amount = data.amount_per_claim;

        if(data.amount_of_tokens < transfer_amount) {
            transfer_amount = data.amount_of_tokens;
        }
        bytes1 bump;
        (, bump) = find_pda();

        bytes bum = new bytes(1);
        bum[0] = bump[0];

        SplToken.transfer_pda(pda_token_account, taker_token_account, pda, transfer_amount, bum);
    }
}