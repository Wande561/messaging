import { useState } from 'react';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, Wallet, Send, History, RefreshCw, Copy, ExternalLink, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useWallet } from "../context/WalletContext";

interface WalletPageProps {
  onBack: () => void;
}

export function WalletPage({ onBack }: WalletPageProps) {
  const {
    balance,
    transactions,
    isLoading,
    error,
    refreshBalance,
    sendICP,
    formatICP,
    formatUSD,
    validateAddress
  } = useWallet();

  const [sendForm, setSendForm] = useState({
    recipient: '',
    amount: '',
    memo: ''
  });
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendLoading(true);
    setSendError(null);

    const amount = parseFloat(sendForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setSendError('Please enter a valid amount');
      setSendLoading(false);
      return;
    }

    // Convert ICP to e8s
    const amountInE8s = Math.floor(amount * 100000000);

    const success = await sendICP(sendForm.recipient, amountInE8s, sendForm.memo || undefined);
    
    if (success) {
      setSendForm({ recipient: '', amount: '', memo: '' });
      alert('Transaction sent successfully!');
    } else {
      setSendError('Failed to send transaction');
    }

    setSendLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'receive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'fee':
        return <DollarSign className="h-4 w-4 text-gray-500" />;
      default:
        return <History className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-full bg-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-200 p-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 text-blue-900 hover:text-blue-700 hover:bg-blue-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-blue-900">Wallet</h1>
            <p className="text-sm text-blue-600">Manage your ICP tokens</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto pb-8">
        {/* Balance Overview */}
        <Card className="bg-white border-blue-200 shadow-sm mb-6">
          <CardHeader className="border-b border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-900" />
                <CardTitle className="text-blue-900">Balance</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshBalance}
                disabled={isLoading}
                className="text-blue-900 border-blue-300 hover:bg-blue-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 mb-2">ICP Balance</p>
                <p className="text-3xl font-bold text-blue-900">
                  {isLoading ? 'Loading...' : formatICP(balance.icp)}
                </p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 mb-2">USD Value</p>
                <p className="text-3xl font-bold text-green-900">
                  {isLoading ? 'Loading...' : formatUSD(balance.usd)}
                </p>
              </div>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet Tabs */}
        <Tabs defaultValue="send" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-white border-blue-200">
            <TabsTrigger value="send" className="flex items-center gap-2 text-blue-900 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Send className="h-4 w-4" />
              Send ICP
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 text-blue-900 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <History className="h-4 w-4" />
              Transaction History
            </TabsTrigger>
          </TabsList>

          {/* Send ICP Tab */}
          <TabsContent value="send">
            <Card className="bg-white border-blue-200 shadow-sm">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="text-blue-900">Send ICP</CardTitle>
                <CardDescription className="text-blue-600">
                  Transfer ICP tokens to another address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <form onSubmit={handleSendSubmit} className="space-y-4">
                  {/* Recipient */}
                  <div className="space-y-2">
                    <Label htmlFor="recipient" className="text-blue-900 font-medium">Recipient Address</Label>
                    <Input
                      id="recipient"
                      value={sendForm.recipient}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSendForm(prev => ({ ...prev, recipient: e.target.value }))}
                      placeholder="Enter Principal ID or Account Identifier"
                      className="border-blue-200 focus:border-blue-500 text-blue-900"
                      required
                    />
                    {sendForm.recipient && !validateAddress(sendForm.recipient) && (
                      <p className="text-red-600 text-sm">Invalid address format</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-blue-900 font-medium">Amount (ICP)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.00000001"
                      min="0.00000001"
                      value={sendForm.amount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSendForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00000000"
                      className="border-blue-200 focus:border-blue-500 text-blue-900"
                      required
                    />
                    <p className="text-xs text-blue-600">
                      Available: {formatICP(balance.icp)}
                    </p>
                  </div>

                  {/* Memo */}
                  <div className="space-y-2">
                    <Label htmlFor="memo" className="text-blue-900 font-medium">Memo (Optional)</Label>
                    <Textarea
                      id="memo"
                      value={sendForm.memo}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSendForm(prev => ({ ...prev, memo: e.target.value }))}
                      placeholder="Add a note for this transaction..."
                      rows={3}
                      className="border-blue-200 focus:border-blue-500 text-blue-900 resize-none"
                    />
                  </div>

                  {/* Transaction Fee Notice */}
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      <strong>Transaction Fee:</strong> 0.0001 ICP will be deducted as network fee
                    </p>
                  </div>

                  {sendError && (
                    <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{sendError}</p>
                    </div>
                  )}

                  {/* Send Button */}
                  <Button
                    type="submit"
                    disabled={sendLoading || !sendForm.recipient || !sendForm.amount || !validateAddress(sendForm.recipient)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {sendLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send ICP
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transaction History Tab */}
          <TabsContent value="history">
            <Card className="bg-white border-blue-200 shadow-sm">
              <CardHeader className="border-b border-blue-100">
                <CardTitle className="text-blue-900">Transaction History</CardTitle>
                <CardDescription className="text-blue-600">
                  Your recent ICP transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                    <p className="text-blue-600 mb-2">No transactions yet</p>
                    <p className="text-sm text-blue-500">Your transaction history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(tx.type)}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-blue-900 capitalize">{tx.type}</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                                tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {tx.status}
                              </span>
                            </div>
                            <p className="text-sm text-blue-600">{formatDate(tx.timestamp)}</p>
                            {tx.memo && (
                              <p className="text-xs text-blue-500 mt-1">{tx.memo}</p>
                            )}
                            {(tx.to || tx.from) && (
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-blue-500 font-mono">
                                  {tx.to ? `To: ${tx.to.slice(0, 20)}...` : `From: ${tx.from?.slice(0, 20)}...`}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(tx.to || tx.from || '')}
                                  className="h-4 w-4 p-0 text-blue-500 hover:text-blue-700"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            tx.type === 'send' || tx.type === 'fee' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {tx.type === 'send' || tx.type === 'fee' ? '-' : '+'}
                            {formatICP(tx.amount)}
                          </p>
                          {tx.blockHeight && (
                            <p className="text-xs text-blue-500">Block #{tx.blockHeight}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
