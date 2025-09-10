import Types "types";
import Map "mo:base/HashMap";
import CoreTypes "../types/coreTypes";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Hash "mo:base/Hash";

module StateManager {

    type User = Types.User;
    type Message = Types.Message;
    type PublicUser = Types.PublicUser;

    public type UserId = Text;
    public type MessageId = Text;
    public type PublicUserId = Text;
    public type ConnectingRecordId = Nat;
    public type ConnectingRecord = CoreTypes.ConnectingRecord;

    public type Map<K, V> = Map.HashMap<K, V>;

    public type Users = Map.HashMap<UserId, User>;
    public type Messages = Map.HashMap<MessageId, Message>;
    public type PublicUsers = Map.HashMap<PublicUserId, PublicUser>;
    public type ConnectingRecords = Map.HashMap<ConnectingRecordId, ConnectingRecord>;

    public type UsersState = { users : Users };
    public func users_new() : UsersState = {
        users = Map.HashMap<UserId, User>(0, Text.equal, Text.hash);
    };

    public type MessagesState = { messages : Messages };
    public func messages_new() : MessagesState = {
        messages = Map.HashMap<MessageId, Message>(0, Text.equal, Text.hash);
    };

    public type PublicUsersState = { publicusers : PublicUsers };
    public func publicusers_new() : PublicUsersState = {
        publicusers = Map.HashMap<PublicUserId, PublicUser>(0, Text.equal, Text.hash);
    };

    public type ConnectingRecordsState = { connectingrecords : ConnectingRecords };
    public func connectingrecords_new() : ConnectingRecordsState = {
        connectingrecords = Map.HashMap<ConnectingRecordId, ConnectingRecord>(0, Nat.equal, func(n: Nat) : Hash.Hash { Nat32.fromNat(n % (2**32)) });
    };
};