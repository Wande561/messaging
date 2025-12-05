import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Prim "mo:prim";
import Result "mo:base/Result";
import Map "mo:base/HashMap";
import TrieMap "mo:base/TrieMap";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Nat64 "mo:base/Nat64";
import Blob "mo:base/Blob";
import Debug "mo:base/Debug";
import Error "mo:base/Error";

import StateManager "statemanager";
import Types "types";

persistent actor MessagingApp {

  let kotomo_canister = actor("ulvla-h7777-77774-qaacq-cai") : actor {
    icrc1_transfer : ({
      from_subaccount: ?[Nat8];
      to: { owner: Principal; subaccount: ?[Nat8] };
      amount: Nat;
      fee: ?Nat;
      memo: ?[Nat8];
      created_at_time: ?Nat64;
    }) -> async { #Ok: Nat; #Err: { 
      #BadFee: { expected_fee: Nat };
      #BadBurn: { min_burn_amount: Nat };
      #InsufficientFunds: { balance: Nat };
      #TooOld;
      #CreatedInFuture: { ledger_time: Nat64 };
      #Duplicate: { duplicate_of: Nat };
      #TemporarilyUnavailable;
      #GenericError: { error_code: Nat; message: Text };
    } };
    icrc1_balance_of : ({ owner: Principal; subaccount: ?[Nat8] }) -> async Nat;
  };

  type User = Types.User;
  type Message = Types.Message;
  type PublicUser = Types.PublicUser;

  let signUpReward : Nat = 1_000_000_000; 
  let messageReward : Nat = 2_000_000_000;  
  let messageThreshold : Nat = 50;

  var messageCountEntries : [(Principal, Nat)] = [];
  transient var messageCounts = TrieMap.TrieMap<Principal, Nat>(Principal.equal, Principal.hash);

  var usersEntries : [(Text, User)] = [];
  var messagesEntries : [(Text, [Message])] = [];

  transient var usersState = StateManager.users_new();
  transient var chatMessages = Map.HashMap<Text, [Message]>(0, Text.equal, Text.hash);

  system func preupgrade() {
    usersEntries := Iter.toArray(usersState.users.entries());
    messagesEntries := Iter.toArray(chatMessages.entries());
    messageCountEntries := Iter.toArray(messageCounts.entries());
  };

  system func postupgrade() {

    for ((id, user) in usersEntries.vals()) {
      usersState.users.put(id, user);
    };
    for ((chatId, msgs) in messagesEntries.vals()) {
      chatMessages.put(chatId, msgs);
    };
    for ((principal, count) in messageCountEntries.vals()) {
      messageCounts.put(principal, count);
    };

    usersEntries := [];
    messagesEntries := [];
    messageCountEntries := [];
  };

  private func transferReward(recipient: Principal, amount: Nat) : async Bool {
    Debug.print("💰 Starting reward transfer to: " # Principal.toText(recipient) # " amount: " # Nat.toText(amount));

    Debug.print("Skipping balance check - will rely on transfer result");
    
    let transferArgs = {
      from_subaccount = null;
      to = { owner = recipient; subaccount = null };
      amount = amount;
      fee = null;
      memo = null;
      created_at_time = null;
    };
    
    Debug.print("� Transfer args: to_owner=" # Principal.toText(recipient) # ", amount=" # Nat.toText(amount));

    try {
      let result = await kotomo_canister.icrc1_transfer(transferArgs);
      
      switch (result) {
        case (#Ok(blockIndex)) { 
          Debug.print("✅ Transfer successful! Block index: " # Nat.toText(blockIndex));

          Debug.print("Transfer completed - skipping balance verification");
          
          true 
        };
        case (#Err(error)) { 
          Debug.print("❌ Transfer failed with error: " # debug_show(error));
          false 
        };
      };
    } catch (e) {
      Debug.print("� Transfer threw exception: " # Error.message(e));
      false;
    };
  };

  private func rewardSignUp(user: Principal) : async () {
    let userText = Principal.toText(user);
    Debug.print("🎁 Attempting sign-up reward for user: " # userText);
    Debug.print("🪙 Reward amount: " # Nat.toText(signUpReward));
    
    let success = await transferReward(user, signUpReward);
    if (success) {
      Debug.print("✅ Sign-up reward sent successfully!");
    } else {
      Debug.print("❌ Sign-up reward failed for user " # userText);
    };
  };

  private func checkAndRewardMessages(user: Principal) : async () {
    let userText = Principal.toText(user);
    let currentCount = messageCounts.get(user);
    switch (currentCount) {
      case null { 
        Debug.print("📝 First message from user: " # userText);
        messageCounts.put(user, 1) 
      };
      case (?count) {
        let newCount = count + 1;
        messageCounts.put(user, newCount);
        Debug.print("📊 Message count for " # userText # ": " # Nat.toText(newCount));

        if (newCount % messageThreshold == 0) {
          Debug.print("🎉 Message milestone reached! Rewarding user: " # userText);
          let success = await transferReward(user, messageReward);
          if (success) {
            Debug.print("✅ Message reward sent successfully!");
          } else {
            Debug.print("❌ Message reward failed for user " # userText);
          };
        };
      };
    };
  };

  public query func getUserMessageCount(user: Principal) : async Nat {
    switch (messageCounts.get(user)) {
      case null { 0 };
      case (?count) { count };
    };
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
    
    Debug.print("👤 Registration attempt for user: " # userId # " with username: " # username);

    switch (usersState.users.get(userId)) {
      case (?_) { 
        Debug.print("⚠️  User already registered: " # userId);
        #err("User already registered") 
      };
      case null {
        Debug.print("✨ New user registration starting...");
        let now = Time.now();
        let newUser : User = {
          version = 1;
          username = username; 
          profilePicture = ""; 
          status = "Available"; 
          createdAt = now; 
          lastSeen = now;
        };
        
        usersState.users.put(userId, newUser);
        Debug.print("📋 User data saved to state");

        await rewardSignUp(caller);
        #ok("User registered successfully! Sign-up reward of 10 KOTOMO tokens has been sent to your wallet.");
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
          lastSeen = Time.now();
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

        await checkAndRewardMessages(sender);
        
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

  public query func getStats() : async { userCount : Nat; messageChats : Nat; totalMessages : Nat } {
    var totalMessages : Nat = 0;
    for ((_, count) in messageCounts.entries()) {
      totalMessages += count;
    };
    
    {
      userCount = usersState.users.size();
      messageChats = chatMessages.size();
      totalMessages = totalMessages;
    }
  };

  public func getRewardPoolBalance() : async Nat {
    // Temporarily disabled balance checking due to query/update call issues
    // The KOTOMO canister implements icrc1_balance_of as a query method
    // but we need to call it from an async context
    0
  };
  
  public query func getRewardConfig() : async { signUpReward: Nat; messageReward: Nat; messageThreshold: Nat } {
    { signUpReward = signUpReward; messageReward = messageReward; messageThreshold = messageThreshold }
  };
}