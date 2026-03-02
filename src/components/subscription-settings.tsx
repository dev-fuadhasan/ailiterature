'use client';

import { useState } from 'react';
import { Settings, X, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';

interface SubscriptionSettingsProps {
  userId: string;
  email: string;
  subscriptionStartDate: Date | string | null;
  subscriptionId: string | null;
  planPeriod: 'MONTHLY' | 'YEARLY' | null;
  isPremium: boolean;
  paymentMethodId: string | null;
  cardLast4: string | null;
  cardType: string | null;
  cardExpiryMonth: number | null;
  cardExpiryYear: number | null;
  autoRenewal: boolean;
}

export function SubscriptionSettings({
  userId,
  email,
  subscriptionStartDate,
  subscriptionId,
  planPeriod,
  isPremium,
  paymentMethodId,
  cardLast4,
  cardType,
  cardExpiryMonth,
  cardExpiryYear,
  autoRenewal: initialAutoRenewal,
}: SubscriptionSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoRenewal, setAutoRenewal] = useState(initialAutoRenewal);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if within 7 days of subscription start
  const canCancel = () => {
    if (!subscriptionStartDate || !isPremium) return false;
    
    const startDate = new Date(subscriptionStartDate);
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceStart <= 7;
  };

  const handleCancelSubscription = async () => {
    if (!canCancel()) {
      setMessage({
        type: 'error',
        text: 'Cancellation is only available within 7 days of subscription start.',
      });
      return;
    }

    if (!confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscriptionId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Subscription cancelled successfully. Your account will be downgraded to Free plan.',
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to cancel subscription. Please contact support.',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again or contact support.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoRenewal = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/subscription/auto-renewal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, autoRenewal: !autoRenewal }),
      });

      const data = await response.json();

      if (response.ok) {
        setAutoRenewal(!autoRenewal);
        setMessage({
          type: 'success',
          text: `Auto-renewal ${!autoRenewal ? 'enabled' : 'disabled'} successfully.`,
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to update auto-renewal.',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePaymentMethod = async () => {
    if (autoRenewal) {
      setMessage({
        type: 'error',
        text: 'Please disable auto-renewal before removing payment method.',
      });
      return;
    }

    if (!confirm('Are you sure you want to remove your payment method?')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/subscription/payment-method', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Payment method removed successfully.',
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to remove payment method.',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return null; // Don't show settings for free users
  }

  return (
    <>
      {/* Settings Button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        onClick={() => setIsOpen(true)}
      >
        <Settings className="h-4 w-4" />
        Settings
      </Button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Subscription Settings</h2>
              <p className="text-sm text-gray-600">
                Manage your {planPeriod?.toLowerCase()} subscription
              </p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Subscription Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-gray-900 text-sm">Subscription Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900 truncate ml-2">{email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium text-gray-900">Premium {planPeriod}</span>
                    </div>
                    {subscriptionStartDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Started:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(subscriptionStartDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method Section */}
                {paymentMethodId && cardLast4 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 text-gray-900 text-sm">Payment Method</h3>
                    <div className="flex items-center gap-3 mb-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {cardType || 'Card'} •••• {cardLast4}
                        </p>
                        {cardExpiryMonth && cardExpiryYear && (
                          <p className="text-xs text-gray-500">
                            Expires {String(cardExpiryMonth).padStart(2, '0')}/{cardExpiryYear}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="text-sm text-gray-700">Auto-renewal</span>
                      <Switch 
                        checked={autoRenewal} 
                        onCheckedChange={handleToggleAutoRenewal}
                        disabled={loading}
                      />
                    </div>
                    {!autoRenewal && (
                      <Button 
                        variant="outline" 
                        onClick={handleRemovePaymentMethod}
                        disabled={loading}
                        className="w-full mt-3 border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
                      >
                        {loading ? 'Removing...' : 'Remove Payment Method'}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div>
                {/* Cancel Subscription Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">Cancel Subscription</h3>
                  
                  {canCancel() ? (
                    <>
                      <p className="text-sm text-gray-600 mb-4">
                        You can cancel your subscription within 7 days of upgrading for a full refund.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-sm"
                        onClick={handleCancelSubscription}
                        disabled={loading}
                      >
                        {loading ? 'Cancelling...' : 'Cancel Subscription'}
                      </Button>
                    </>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <AlertCircle className="h-4 w-4 inline mr-2" />
                        Cancellation with refund is only available within 7 days of upgrading to Premium.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
