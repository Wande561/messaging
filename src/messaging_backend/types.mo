import Time "mo:base/Time";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Principal "mo:base/Principal";
import Int "mo:base/Int";

module Types {

  public type User = {
    version : Int;
    username : Text;
    profilePicture : Text;
    status : Text;
    createdAt : Time.Time;
    lastSeen : Time.Time;
  };

  public type PublicUser = {
    version : Int;
    username : Text;
    profilePicture : Text;
    status : Text;
    createdAt : Time.Time;
    lastSeen : Time.Time;
    online : Bool;
  };

  public type TokenTransfer = {
    version : Int;
    from : Principal;
    to : Principal;
    amount : Nat;
    timestamp : Time.Time;
    description : Text;
  };

  public type Message = {
    version : Int;
    sender : Principal;
    receiver : Principal;
    text : Text;
    timestamp : Time.Time;
  };

};