import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Plus, 
  ShieldCheck, 
  Loader2, 
  CreditCard
} from 'lucide-react';
import { PaymentRecord, RentalLease } from '../types';
import { Language, TRANSLATIONS } from '../i18n/translations';
import { api } from '../api/client';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  leases: RentalLease[];
  language: Language;
}

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({
  isOpen,
  onClose,
  leases,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>(leases[0]?.id || '');
  const [amount, setAmount] = useState<number>(leases[0]?.monthlyRent || 1100);
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      loadPayments();
    }
  }, [isOpen]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await api.payments.getPayments();
      setPayments(res.payments || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaseId || !amount) return;

    try {
      const res = await api.payments.addPayment({
        leaseId: selectedLeaseId,
        amount: Number(amount),
        dueDate,
        paidDate: dueDate,
        status: 'paid_on_time',
      });
      setPayments((prev) => [res.payment, ...prev]);
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to add payment:', err);
    }
  };

  if (!isOpen) return null;

  const totalPaid = payments.filter((p) => p.status === 'paid_on_time').reduce((sum, p) => sum + p.amount, 0);
  const onTimePercentage = payments.length > 0 
    ? Math.round((payments.filter((p) => p.status === 'paid_on_time').length / payments.length) * 100)
    : 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-[#0FA3A3]/20 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          id="btn-close-payment-modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF9F6] text-[#0FA3A3] text-xs font-bold mb-1">
            <CreditCard className="w-3.5 h-3.5" />
            <span>{t.ledgerBadge}</span>
          </div>
          <h2 className="text-lg font-bold text-[#1C3B3A]">
            {t.paymentsModalTitle}
          </h2>
          <p className="text-xs text-[#5C7B79]">
            {t.paymentsModalSubtitle}
          </p>
        </div>

        {/* Summary metric card */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-[#F7FBFA] border border-gray-200">
            <span className="text-[11px] text-[#5C7B79] block">{t.realPunctuality}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-[#2EC4A6]" />
              <span className="text-lg font-extrabold text-[#1C3B3A]">{onTimePercentage}%</span>
            </div>
            <span className="text-[10px] text-[#2EC4A6] font-bold">{t.onTimeBadge}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#F7FBFA] border border-gray-200">
            <span className="text-[11px] text-[#5C7B79] block">{t.totalCertifiedRent}</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-lg font-extrabold text-[#0FA3A3]">{totalPaid.toLocaleString()} €</span>
            </div>
            <span className="text-[10px] text-[#5C7B79]">{t.noBankIncident}</span>
          </div>
        </div>

        {/* Add Payment Action */}
        {!isAdding ? (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full mb-4 py-2 px-3 rounded-xl bg-[#F7FBFA] border border-dashed border-[#0FA3A3] text-[#0FA3A3] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#E6F7F6] transition-colors"
            id="btn-open-add-payment-form"
          >
            <Plus className="w-4 h-4" />
            <span>{t.recordPaymentBtn}</span>
          </button>
        ) : (
          <form onSubmit={handleAddPayment} className="mb-4 p-3 rounded-xl bg-[#E6F7F6] border border-[#0FA3A3]/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1C3B3A]">
                {t.newPaymentTitle}
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-[11px] text-gray-500 hover:text-gray-700"
              >
                {t.cancelBtn}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#1C3B3A] mb-0.5">{t.associatedLease}</label>
                <select
                  value={selectedLeaseId}
                  onChange={(e) => setSelectedLeaseId(e.target.value)}
                  className="w-full p-2 rounded-lg bg-white border border-gray-200 text-xs text-[#1C3B3A]"
                >
                  {leases.map((l, idx) => (
                    <option key={`${l.id}-${idx}`} value={l.id}>
                      {l.address.split(',')[0]} ({l.monthlyRent}€)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#1C3B3A] mb-0.5">{t.rentAmountLabel} (€)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-white border border-gray-200 text-xs text-[#1C3B3A]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#1C3B3A] mb-0.5">{t.dueDateLabel}</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-white border border-gray-200 text-xs text-[#1C3B3A]"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-3 rounded-lg bg-[#0FA3A3] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#0C8282]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t.savePaymentBtn}</span>
            </button>
          </form>
        )}

        {/* Payments List */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#1C3B3A] block">
            {t.receiptHistoryTitle} ({payments.length})
          </span>

          {loading ? (
            <div className="py-6 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-[#0FA3A3] animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="p-4 rounded-xl bg-gray-50 text-center text-xs text-[#5C7B79]">
              {t.noPaymentsRecorded}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {payments.map((payment, idx) => (
                <div
                  key={`${payment.id}-${idx}`}
                  className="p-2.5 rounded-xl border border-gray-200 bg-white flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#EBF9F6] text-[#2EC4A6] flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-[#1C3B3A] block">
                        {payment.amount} {payment.currency || '€'}
                      </span>
                      <span className="text-[10px] text-[#5C7B79]">
                        {payment.dueDate}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EBF9F6] text-[#2EC4A6] text-[10px] font-bold border border-[#2EC4A6]/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t.onTimeCertifiedBadge}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
