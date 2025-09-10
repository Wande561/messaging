import Time "mo:base/Time";

module CoreTypes {

    public type AddConnectingTableRecordArgs = {
        ledger_id : Text;
        record_id : Text;
    };

    public type ConnectingRecord = {
        id : Nat;
        record_id : Text;
        ledger_record_id : Text;
        created_at : Time.Time;
    };

    public type CanisterInitArgs = {
        env : EnvType;
    };

    public type EnvType = {
        #local;
        #staging;
        #production;
    };
};