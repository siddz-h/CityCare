import React, { useState } from 'react';
import { CreditCard, Smartphone, Building, CheckCircle, Shield, AlertCircle, RefreshCw, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  amount: number;
  doctorName: string;
  hospitalName: string;
  onSuccess: (paymentDetails: { txnId: string; method: string }) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  amount,
  doctorName,
  hospitalName,
  onSuccess,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('demo.patient@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8829');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('742');
  const [selectedBank, setSelectedBank] = useState('State Bank of India');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [generatedTxnId, setGeneratedTxnId] = useState('');

  const triggerPayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const txn = `TXN-DEMO-${Math.floor(100000 + Math.random() * 900000)}`;
      setGeneratedTxnId(txn);
      setIsProcessing(false);
      setPaymentSuccess(true);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore if not loaded
      }

      setTimeout(() => {
        let methodDesc = 'Demo Online Payment';
        if (activeTab === 'upi') methodDesc = `UPI (${upiId})`;
        else if (activeTab === 'card') methodDesc = `Credit Card (ending 8829)`;
        else methodDesc = `Net Banking (${selectedBank})`;

        onSuccess({ txnId: txn, method: methodDesc });
      }, 1500);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#070D19]/95 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-white/15 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B1528] via-[#0F1F38] to-[#0B1528] px-5 py-4 text-white relative border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#A3E635]/15 border border-[#A3E635]/40 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-[#A3E635]" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A3E635]">
                CityCare Secure Gateway
              </span>
              <span className="bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                🎓 Demo Sandbox
              </span>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-bold flex items-center justify-center cursor-pointer disabled:opacity-30 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 block">Consultation Fee Payable</span>
              <div className="text-xs text-slate-300 font-medium truncate mt-0.5">
                {doctorName} • <span className="text-slate-400">{hospitalName}</span>
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-[#A3E635] shrink-0">
              ₹{amount}
            </div>
          </div>
        </div>

        {paymentSuccess ? (
          <div className="p-6 text-center space-y-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#A3E635]/15 border border-[#A3E635]/40 text-[#A3E635] flex items-center justify-center mx-auto shadow-lg shadow-[#A3E635]/10">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Payment Authorized!</h3>
            <p className="text-xs text-slate-400">
              Transaction verified. Generating your confirmed OPD Token Slip...
            </p>
            <div className="p-3 bg-white/[0.04] rounded-xl border border-white/10 text-xs font-mono text-slate-300">
              Transaction ID: <span className="font-bold text-[#A3E635]">{generatedTxnId}</span>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('upi')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'upi'
                    ? 'bg-[#A3E635] text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI / QR</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'card'
                    ? 'bg-[#A3E635] text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('netbanking')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'netbanking'
                    ? 'bg-[#A3E635] text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>NetBanking</span>
              </button>
            </div>

            {/* UPI Tab */}
            {activeTab === 'upi' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Virtual Payment Address (VPA / UPI ID)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white/[0.04] border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#A3E635]/30 focus:border-[#A3E635] font-mono"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'].map((app, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-[10px] font-semibold bg-white/[0.04] rounded-lg text-slate-300 border border-white/10"
                    >
                      {app}
                    </span>
                  ))}
                </div>

                <div className="p-3 bg-[#A3E635]/10 rounded-xl border border-[#A3E635]/25 flex items-center gap-3 text-xs">
                  <div className="w-11 h-11 bg-[#070D19] rounded-lg border border-[#A3E635]/40 flex items-center justify-center font-mono font-bold text-[9px] text-[#A3E635] shrink-0">
                    [QR PAY]
                  </div>
                  <div>
                    <span className="font-bold text-white block">Instant UPI QR Simulation</span>
                    <span className="text-[11px] text-slate-300">Zero-wait OPD token verification enabled</span>
                  </div>
                </div>
              </div>
            )}

            {/* Card Tab */}
            {activeTab === 'card' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Card Number (Demo Test Card)
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white/[0.04] border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#A3E635] font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white/[0.04] border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#A3E635] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      maxLength={3}
                      className="w-full px-3.5 py-2 text-xs bg-white/[0.04] border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#A3E635] font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* NetBanking Tab */}
            {activeTab === 'netbanking' && (
              <div className="space-y-2.5">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Select Popular Bank
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'].map((bank, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`p-2.5 text-xs rounded-xl border text-left font-medium transition-all cursor-pointer ${
                        selectedBank === bank
                          ? 'border-[#A3E635] bg-[#A3E635]/15 text-[#A3E635] font-bold'
                          : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={triggerPayment}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-[#A3E635] hover:bg-[#bef264] text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-[#A3E635]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authorizing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Authorize Payment of ₹{amount}</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-500 mt-2.5 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3 text-slate-500" />
                <span>Simulated Sandbox • No real bank deduction occurs</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
