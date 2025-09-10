module {

    public type AddConnectingTableRecordArgs = {
        ledger_id : Text;
        record_id : Text;
    };

    public type Self = actor {
        addConnectingTableRecord : shared AddConnectingTableRecordArgs -> async ();
    };
};