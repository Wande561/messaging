import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Prim "mo:prim";
import Result "mo:base/Result";
import Map "mo:base/HashMap";

import StateManager "statemanager";
import Types "types";

persistent actor MessagingApp {

  type User = Types.User;
  type Message = Types.Message;
  type PublicUser = Types.PublicUser;

  var usersEntries : [(Text, User)] = [];
  var messagesEntries : [(Text, [Message])] = [];

  transient var usersState = StateManager.users_new();
  transient var chatMessages = Map.HashMap<Text, [Message]>(0, Text.equal, Text.hash);

  system func preupgrade() {
    usersEntries := Iter.toArray(usersState.users.entries());
    messagesEntries := Iter.toArray(chatMessages.entries());
  };

  system func postupgrade() {

    for ((id, user) in usersEntries.vals()) {
      usersState.users.put(id, user);
    };
    for ((chatId, msgs) in messagesEntries.vals()) {
      chatMessages.put(chatId, msgs);
    };

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
    let userId = Principal.toText(who);
    switch (usersState.users.get(userId)) {
      case (?u) {
        usersState.users.put(userId, { 
          version = u.version;
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
      version = u.version;
      username = u.username;
      profilePicture = u.profilePicture;
      status = u.status;
      createdAt = u.createdAt;
      lastSeen = u.lastSeen;
      online = online;
    }
  };

  public shared(msg) func registerUser(username : Text) : async Result.Result<Text, Text> {
    let caller = msg.caller;
    let userId = Principal.toText(caller);

    switch (usersState.users.get(userId)) {
      case (?_) { #err("User already registered") };
      case null {
        let now = Time.now();
        let newUser : User = {
          version = 1;
          username = username; 
          profilePicture = ""; 
          status = "Available"; 
          createdAt = now; 
          lastSeen = now 
        };
        usersState.users.put(userId, newUser);
        #ok(userId)
      };
    };
  };

  public shared(msg) func updateProfile(newUsername : Text, newProfilePicture : Text, newStatus : Text) : async Result.Result<(), Text> {
    let caller = msg.caller;
    let userId = Principal.toText(caller);
    
    switch (usersState.users.get(userId)) {
      case null { #err("User not found") };
      case (?user) {
        let updatedUser : User = {
          version = user.version;
          username = newUsername; 
          profilePicture = newProfilePicture; 
          status = newStatus; 
          createdAt = user.createdAt; 
          lastSeen = Time.now() 
        };
        usersState.users.put(userId, updatedUser);
        #ok(())
      };
    };
  };

  public query func searchUsers(keyword : Text) : async [(Principal, PublicUser)] {
    let lowerKey = Text.map(keyword, Prim.charToLower);
    var results : [(Principal, PublicUser)] = [];
    
    for ((userId, user) in usersState.users.entries()) {
      let lowerName = Text.map(user.username, Prim.charToLower);
      if (Text.contains(lowerName, #text lowerKey)) {
        let principal = Principal.fromText(userId);
        results := Array.append(results, [(principal, makePublicUser(user))]);
      };
    };
    results
  };

  public shared(msg) func sendMessage(receiver : Principal, text : Text) : async Result.Result<(), Text> {
    let sender = msg.caller;
    let senderId = Principal.toText(sender);
    let receiverId = Principal.toText(receiver);

    switch (usersState.users.get(senderId), usersState.users.get(receiverId)) {
      case (?_, ?_) {
        touchUser(sender);
        let chatId = getChatId(sender, receiver);
        let newMsg : Message = {
          version = 1;
          sender = sender;
          receiver = receiver;
          text = text;
          timestamp = Time.now();
        };
        
        let oldMsgs = switch (chatMessages.get(chatId)) {
          case null { [] };
          case (?arr) { arr };
        };
        chatMessages.put(chatId, Array.append(oldMsgs, [newMsg]));
        #ok(())
      };
      case (null, _) { #err("Sender not found") };
      case (_, null) { #err("Receiver not found") };
    };
  };

  public query func getMessages(caller : Principal, other : Principal) : async [Message] {
    let chatId = getChatId(caller, other);
    switch (chatMessages.get(chatId)) {
      case null { [] };
      case (?arr) { arr };
    }
  };

  public query func getUserMessages(caller : Principal) : async [(Principal, [Message])] {
    var userMessages : [(Principal, [Message])] = [];
    
    for ((chatId, msgs) in chatMessages.entries()) {
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
    let userId = Principal.toText(p);
    switch (usersState.users.get(userId)) {
      case null { null };
      case (?u) { ?makePublicUser(u) };
    }
  };

  public query func getStats() : async { userCount : Nat; messageChats : Nat } {
    {
      userCount = usersState.users.size();
      messageChats = chatMessages.size();
    }
  };
}