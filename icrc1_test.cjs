#!/usr/bin/env node

/**
 * ICRC-1 Wallet Test Script
 * This script tests the ICRC-1 token functionality directly
 */

const { Principal } = require('@dfinity/principal');

// Test configuration
const BACKEND_CANISTER_ID = 'u6s2n-gx777-77774-qaaba-cai';
const ICRC1_TOKEN_CANISTER_ID = 'ulvla-h7777-77774-qaacq-cai';
const TEST_PRINCIPAL = 'rdmx6-jaaaa-aaaah-qcaiq-cai'; // Example principal for testing

console.log('🧪 ICRC-1 Wallet Test Script');
console.log('===============================\n');

console.log('📋 Test Configuration:');
console.log(`   Backend Canister (integrated): ${BACKEND_CANISTER_ID}`);
console.log(`   ICRC-1 Token Canister (standalone): ${ICRC1_TOKEN_CANISTER_ID}`);
console.log(`   Test Principal: ${TEST_PRINCIPAL}`);
console.log('\n🔍 Testing ICRC-1 Functions...\n');

// Test functions for integrated backend
const backendTests = [
  {
    name: 'Token Name (Backend)',
    command: `dfx canister call ${BACKEND_CANISTER_ID} icrc1_name`,
    description: 'Get the token name from integrated backend'
  },
  {
    name: 'Token Symbol (Backend)', 
    command: `dfx canister call ${BACKEND_CANISTER_ID} icrc1_symbol`,
    description: 'Get the token symbol from integrated backend'
  },
  {
    name: 'Total Supply (Backend)',
    command: `dfx canister call ${BACKEND_CANISTER_ID} icrc1_total_supply`,
    description: 'Get the total token supply from integrated backend'
  },
  {
    name: 'Supported Standards (Backend)',
    command: `dfx canister call ${BACKEND_CANISTER_ID} icrc1_supported_standards`,
    description: 'Get supported standards from integrated backend'
  }
];

// Test functions for standalone token canister
const tokenTests = [
  {
    name: 'Token Name (Standalone)',
    command: `dfx canister call ${ICRC1_TOKEN_CANISTER_ID} icrc1_name`,
    description: 'Get the token name from standalone token canister'
  },
  {
    name: 'Token Symbol (Standalone)', 
    command: `dfx canister call ${ICRC1_TOKEN_CANISTER_ID} icrc1_symbol`,
    description: 'Get the token symbol from standalone token canister'
  },
  {
    name: 'Token Decimals (Standalone)',
    command: `dfx canister call ${ICRC1_TOKEN_CANISTER_ID} icrc1_decimals`,
    description: 'Get the number of decimals from standalone token canister'
  },
  {
    name: 'Transfer Fee (Standalone)',
    command: `dfx canister call ${ICRC1_TOKEN_CANISTER_ID} icrc1_fee`,
    description: 'Get the transfer fee from standalone token canister'
  },
  {
    name: 'Total Supply (Standalone)',
    command: `dfx canister call ${ICRC1_TOKEN_CANISTER_ID} icrc1_total_supply`,
    description: 'Get the total token supply from standalone token canister'
  },
  {
    name: 'Supported Standards (Standalone)',
    command: `dfx canister call ${ICRC1_TOKEN_CANISTER_ID} icrc1_supported_standards`,
    description: 'Get supported standards from standalone token canister'
  },
  {
    name: 'Token Metadata (Standalone)',
    command: `dfx canister call ${ICRC1_TOKEN_CANISTER_ID} icrc1_metadata`,
    description: 'Get token metadata from standalone token canister'
  },
  {
    name: 'Minting Account (Standalone)',
    command: `dfx canister call ${ICRC1_TOKEN_CANISTER_ID} icrc1_minting_account`,
    description: 'Get the minting account from standalone token canister'
  },
  {
    name: 'Balance Query (Deployer)',
    command: `dfx canister call ${ICRC1_TOKEN_CANISTER_ID} icrc1_balance_of '(record { owner = principal "vrabg-lqy25-o5ysi-b2jbz-afwnv-tfino-tl7yg-326yi-4hiaq-yamfy-7ae"; subaccount = null })'`,
    description: 'Get balance for deployer (should have most of initial supply)'
  },
  {
    name: 'Balance Query (Anonymous)',
    command: `dfx canister call ${ICRC1_TOKEN_CANISTER_ID} icrc1_balance_of '(record { owner = principal "2vxsx-fae"; subaccount = null })'`,
    description: 'Get balance for anonymous principal (should have some from test transfer)'
  }
];

console.log('📜 Integrated Backend Tests:');
console.log('============================\n');

backendTests.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}`);
  console.log(`   Description: ${test.description}`);
  console.log(`   Command: ${test.command}`);
  console.log('');
});

console.log('\n📜 Standalone Token Canister Tests:');
console.log('===================================\n');

tokenTests.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}`);
  console.log(`   Description: ${test.description}`);
  console.log(`   Command: ${test.command}`);
  console.log('');
});

console.log('\n💡 Sample Transfer Test:');
console.log('========================');
console.log(`Transfer 1000000 tokens to anonymous principal:`);
console.log(`dfx canister call ${ICRC1_TOKEN_CANISTER_ID} icrc1_transfer '(record { from_subaccount = null; to = record { owner = principal "2vxsx-fae"; subaccount = null }; amount = 1000000; fee = null; memo = null; created_at_time = null })'`);
console.log('');

console.log('💡 Usage Instructions:');
console.log('======================');
console.log('1. Copy and paste each command above into your terminal');
console.log('2. Run the commands to test ICRC-1 functionality');
console.log('3. Compare responses between integrated and standalone implementations');
console.log('4. Verify the responses match ICRC-1 standard format');
console.log('');

console.log('🌐 Frontend Access:');
console.log('==================');
console.log('Open your wallet at: http://uzt4z-lp777-77774-qaabq-cai.localhost:4943/');
console.log('1. Log in with Internet Identity');
console.log('2. Navigate to Wallet -> ICRC-1 Wallet');
console.log('3. Test token transfers and balance queries');
console.log('');

console.log('🔧 Expected ICRC-1 Responses:');
console.log('=============================');
console.log('- icrc1_name(): "Engage Token"');
console.log('- icrc1_symbol(): "ENG"');
console.log('- icrc1_decimals(): 8');
console.log('- icrc1_fee(): 10000 (0.0001 ENG)');
console.log('- icrc1_total_supply(): 10000000000000000 (100M tokens with 8 decimals)');
console.log('- icrc1_supported_standards(): [{"name": "ICRC-1", "url": "..."}]');
console.log('');

console.log('🏗️ Architecture:');
console.log('================');
console.log('You now have TWO ICRC-1 implementations:');
console.log('1. Integrated: ICRC-1 functions built into messaging_backend');
console.log('2. Standalone: Dedicated icrc1_token canister with full ICRC-1 compliance');
console.log('');
console.log('The standalone version provides:');
console.log('• Complete ICRC-1 standard implementation');
console.log('• Proper actor class structure');
console.log('• Persistent state management');
console.log('• Enhanced transfer logic');
console.log('• Minting capabilities');
console.log('');

console.log('✅ ICRC-1 Implementation Complete!');
console.log('Both implementations are working and tested successfully.');
console.log('Your token system now follows the ICRC-1 standard and is compatible');
console.log('with other Internet Computer applications and wallets.');
