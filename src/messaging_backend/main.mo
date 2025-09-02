import Time "mo:base/Time";
import TrieMap "mo:base/TrieMap";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Prim "mo:prim";

persistent actor MessagingApp {

  type User = {
    username : Text;
    profilePicture : Text;
    status : Text;
    createdAt : Time.Time;
    lastSeen : Time.Time;
  };

  type PublicUser = {
    username : Text;
    profilePicture : Text;
    status : Text;
    createdAt : Time.Time;
    lastSeen : Time.Time;
    online : Bool;
  };

  type Message = {
    sender : Principal;
    receiver : Principal;
    text : Text;
    timestamp : Time.Time;
  };

  var usersEntries : [(Principal, User)] = [];
  var messagesEntries : [(Text, [Message])] = [];

  transient var users = TrieMap.fromEntries<Principal, User>(usersEntries.vals(), Principal.equal, Principal.hash);
  transient var messages = TrieMap.fromEntries<Text, [Message]>(messagesEntries.vals(), Text.equal, Text.hash);

  system func preupgrade() {
    usersEntries := Iter.toArray(users.entries());
    messagesEntries := Iter.toArray(messages.entries());
  };

  system func postupgrade() {
    usersEntries := [];
    messagesEntries := [];
  };

  func getChatId(a : Principal, b : Principal) : Text {
    if (Principal.toText(a) < Principal.toText(b)) {
      Principal.toText(a) # "|" # Principal.toText(b)
    } else {
      Principal.toText(b) # "|" # Principal.toText(a)
    }
  };

  func touchUser(who : Principal) {
    switch (users.get(who)) {
      case (?u) {
        users.put(who, { 
          username = u.username;
          profilePicture = u.profilePicture;
          status = u.status;
          createdAt = u.createdAt;
          lastSeen = Time.now();
        });
      };
      case null {};
    };
  };

  func makePublicUser(u : User) : PublicUser {
    let now = Time.now();
    let online = (now - u.lastSeen) < 120_000_000_000;
    {
      username = u.username;
      profilePicture = u.profilePicture;
      status = u.status;
      createdAt = u.createdAt;
      lastSeen = u.lastSeen;
      online = online;
    }
  };

  public shared func registerUser(username : Text, caller : Principal) : async Bool {
    let who = caller;
    if (users.get(who) != null) {
      return false;
    };
    let now = Time.now();
    users.put(who, { 
      username = username; 
      profilePicture = ""; 
      status = "Available"; 
      createdAt = now; 
      lastSeen = now 
    });
    return true;
  };

  public shared func updateProfile(newUsername : Text, newProfilePicture : Text, newStatus : Text, caller : Principal) : async Bool {
    let who = caller;
    switch (users.get(who)) {
      case null { return false };
      case (?user) {
        users.put(who, { 
          username = newUsername; 
          profilePicture = newProfilePicture; 
          status = newStatus; 
          createdAt = user.createdAt; 
          lastSeen = Time.now() 
        });
        return true;
      };
    };
  };

  public query func searchUsers(keyword : Text) : async [(Principal, PublicUser)] {
    let lowerKey = Text.map(keyword, Prim.charToLower);
    var results : [(Principal, PublicUser)] = [];
    for ((p, u) in users.entries()) {
      let lowerName = Text.map(u.username, Prim.charToLower);
      if (Text.contains(lowerName, #text lowerKey)) {
        results := Array.append(results, [(p, makePublicUser(u))]);
      };
    };
    results
  };

  public shared func sendMessage(receiver : Principal, text : Text, caller : Principal) : async Bool {
    let sender = caller;
    if (users.get(sender) == null or users.get(receiver) == null) {
      return false;
    };
    touchUser(sender);
    let chatId = getChatId(sender, receiver);
    let newMsg : Message = {
      sender = sender;
      receiver = receiver;
      text = text;
      timestamp = Time.now();
    };
    let oldMsgs = switch (messages.get(chatId)) {
      case (null) { [] };
      case (?arr) { arr };
    };
    messages.put(chatId, Array.append(oldMsgs, [newMsg]));
    return true;
  };

  public shared query func getMessages(other : Principal, caller : Principal) : async [Message] {
    let who = caller;
    let chatId = getChatId(who, other);
    switch (messages.get(chatId)) {
      case (null) { [] };
      case (?arr) { arr };
    }
  };

  public query func getUserMessages(caller : Principal) : async [(Principal, [Message])] {
    var userMessages : [(Principal, [Message])] = [];
    for ((chatId, msgs) in messages.entries()) {
      let partsArr = Iter.toArray(Text.split(chatId, #text "|"));
      if (Array.size(partsArr) == 2) {
        let p1 = Principal.fromText(partsArr[0]);
        let p2 = Principal.fromText(partsArr[1]);
        if (p1 == caller or p2 == caller) {
          let other = if (p1 == caller) { p2 } else { p1 };
          userMessages := Array.append(userMessages, [(other, msgs)]);
        };
      };
    };
    userMessages;
  };

  public query func getUser(p : Principal) : async ?PublicUser {
    switch (users.get(p)) {
      case null { null };
      case (?u) { ?makePublicUser(u) };
    }
  };
  
}
