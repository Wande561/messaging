import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { ArrowLeft, Wallet, Loader2, Send, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AppContext";
import { useKotomo } from "../hooks/useKotomo";
import { Principal } from "@dfinity/principal";

interface WalletPageProps {
  onBack: () => void;
}

export function WalletPage({ onBack }: WalletPageProps) {
  const { identity } = useAuth();
  const {
    tokenInfo,
    balance,
    transactions,
    loading,
    error,
    loadTokenInfo,
    loadBalance,
    loadTransactions,
    sendTokens
  } = useKotomo();

  const [sendAmount, setSendAmount] = React.useState('');
  const [recipientAddress, setRecipientAddress] = React.useState('');
  const [sendLoading, setSendLoading] = React.useState(false);

  useEffect(() => {
    if (identity) {
      loadTokenInfo();
      loadBalance();
      loadTransactions();
    }
  }, [identity, loadTokenInfo, loadBalance, loadTransactions]);

  const handleSend = async () => {
    if (!sendAmount || !recipientAddress) return;

    try {
      setSendLoading(true);
      const recipientPrincipal = Principal.fromText(recipientAddress);
      await sendTokens(recipientPrincipal, BigInt(parseFloat(sendAmount) * Math.pow(10, tokenInfo?.decimals || 8)));
      setSendAmount('');
      setRecipientAddress('');
      // Refresh balance and transactions
      loadBalance();
      loadTransactions();
    } catch (err) {
      console.error('Failed to send tokens:', err);
    } finally {
      setSendLoading(false);
    }
  };

  const handleRefresh = () => {
    loadBalance();
    loadTransactions();
  };

  const formatBalance = (amount: bigint, decimals: number = 8): string => {
    const divisor = BigInt(Math.pow(10, decimals));
    const whole = amount / divisor;
    const fractional = amount % divisor;
    return `${whole.toString()}.${fractional.toString().padStart(decimals, '0').replace(/0+$/, '') || '0'}`;
  };

  const formatTimestamp = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp / BigInt(1000000))); // Convert nanoseconds to milliseconds
    return date.toLocaleString();
  };

  if (!identity) {
    return (
      <div className="min-h-full bg-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Wallet className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-sm text-gray-600">Please log in to access your wallet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">KOTOMO Wallet</h1>
        </div>
        <Button onClick={handleRefresh} disabled={loading} size="sm" variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Token Info */}
      <Card>
        <CardHeader>
          <CardTitle>Token Information</CardTitle>
          <CardDescription>KOTOMO token details</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !tokenInfo ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading token information...</span>
            </div>
          ) : tokenInfo ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {tokenInfo.name}
              </div>
              <div>
                <span className="font-medium">Symbol:</span> {tokenInfo.symbol}
              </div>
              <div>
                <span className="font-medium">Decimals:</span> {tokenInfo.decimals}
              </div>
              <div>
                <span className="font-medium">Fee:</span> {formatBalance(tokenInfo.fee, tokenInfo.decimals)} {tokenInfo.symbol}
              </div>
              <div>
                <span className="font-medium">Total Supply:</span> {formatBalance(tokenInfo.totalSupply, tokenInfo.decimals)} {tokenInfo.symbol}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Your Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && balance === null ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading balance...</span>
            </div>
          ) : balance !== null && tokenInfo ? (
            <div className="text-2xl font-bold">
              {formatBalance(balance, tokenInfo.decimals)} {tokenInfo.symbol}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Send Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Send Tokens</CardTitle>
          <CardDescription>Transfer KOTOMO tokens to another address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="Enter principal ID"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleSend} 
            disabled={!sendAmount || !recipientAddress || sendLoading}
            className="w-full"
          >
            {sendLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Tokens
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent KOTOMO token transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && transactions.length === 0 ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading transactions...</span>
            </div>
          ) : transactions.length > 0 && tokenInfo ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id.toString()} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium capitalize">
                        {tx.kind}
                        {tx.kind === 'transfer' && tx.from && tx.to && (
                          <span className="text-sm text-gray-500 ml-2">
                            {tx.from.toString() === identity?.getPrincipal().toString() ? 'Sent' : 'Received'}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatTimestamp(tx.timestamp)}
                      </div>
                      {tx.from && (
                        <div className="text-xs text-gray-500">
                          From: {tx.from.toString().slice(0, 20)}...
                        </div>
                      )}
                      {tx.to && (
                        <div className="text-xs text-gray-500">
                          To: {tx.to.toString().slice(0, 20)}...
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatBalance(tx.amount, tokenInfo.decimals)} {tokenInfo.symbol}
                      </div>
                      {tx.fee && tx.fee > 0n ? (
                        <div className="text-xs text-gray-500">
                          Fee: {formatBalance(tx.fee, tokenInfo.decimals)} {tokenInfo.symbol}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No transactions found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
