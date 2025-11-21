dfx deploy kotomo --argument "(variant {Init = 
  record {
    token_symbol = \"KOTOMO\";
    token_name = \"L-KOTOMO\";
    minting_account = record { owner = principal \"$(dfx identity --identity minter get-principal)\" };
    transfer_fee = 10_000;
    metadata = vec {};
    feature_flags = opt record{icrc2 = true};
    initial_balances = vec { 
      record { 
        record { owner = principal \"$(dfx identity get-principal)\"; }; 
        10_000_000_000; 
      }; 
    };
    archive_options = record {
      num_blocks_to_archive = 1000;
      trigger_threshold = 2000;
      controller_id = principal \"$(dfx identity --identity wande get-principal)\";
    };
  }
})"