import Constants "../lib/constants";
import Result "mo:base/Result";

module {

    public type LedgerRecordPayloadV2 = {
        record_type : Text;
        data : Blob;
        canister_id : Text;
        canister_name : Text;
        action : Text;
        function_name : Text;
        created_by : Principal;
        record_id : Text;
        record_version : Nat8;
    };

    public type ProtocolLedgerInterface = actor {
        add_record_v2 : shared LedgerRecordPayloadV2 -> async Result.Result<Text, Text>;
    };

    public let ProtocolLedgerActor : ProtocolLedgerInterface = actor (Constants.PROTOCOL_PROTOCOL_CANISTER_ID);
};