import Result "mo:base/Result";
import Nat8 "mo:base/Nat8";
import LedgerInterface "../interfaces/protocol_ledger";
import Random "mo:base/Random";
import Nat "mo:base/Nat";
import This "../interfaces/this";

module {

    let ProtocolLedgerActor = LedgerInterface.ProtocolLedgerActor;

    public type AddToLedgerArgs = {
        record_type : Text;
        data : Blob;
        action : Text;
        function_name : Text;
        canister_name : Text;
        created_by : Principal;
        record_id : Text;
        version : Nat;
        canister_id : Text;
    };

    public func addToLedger(args : AddToLedgerArgs) : async Result.Result<Text, Text> {
        let ledgerObject : LedgerInterface.LedgerRecordPayloadV2 = {
            record_type = args.record_type;
            data = args.data;
            canister_id = args.canister_id;
            canister_name = args.canister_name;
            action = args.action;
            function_name = args.function_name;
            created_by = args.created_by;
            record_id = args.record_id;
            record_version = Nat8.fromNat(args.version);
        };
        switch (await ProtocolLedgerActor.add_record_v2(ledgerObject)) {
            case (#ok(id)) {
                let ThisActor : This.Self = actor (args.canister_id);
                await ThisActor.addConnectingTableRecord({
                    ledger_id = id;
                    record_id = args.record_id;
                });
                #ok(id);
            };
            case (#err(err)) { #err(err) };
        };
    };

    public func uuid() : async Text {
        let entropy = await Random.blob();
        let seed = Random.Finite(entropy);
        switch (seed.range(255)) {
            case (?n) { Nat.toText(n) };
            case null { "0" };
        };
    };
};