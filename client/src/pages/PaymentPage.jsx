import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { bookingService, paymentService } from '../services/authService';
import Loader from '../components/common/Loader';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [processing, setProcessing] = useState(false);
  const [method, setMethod]         = useState('cash');

  useEffect(() => {
    bookingService.getById(bookingId)
      .then(({ data }) => { if (data.success) setBooking(data.data); })
      .catch(() => toast.error('Booking लोड होऊ शकली नाही'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleCashPayment = async () => {
    if (!window.confirm(`₹${parseInt(booking?.totalAmount).toLocaleString()} रोख पेमेंट confirm करायचे आहे का?`)) return;
    setProcessing(true);
    try {
      const { data } = await paymentService.confirmCash(parseInt(bookingId));
      if (data.success) {
        toast.success('✅ रोख पेमेंट confirm झाले!');
        navigate(`/rate/${bookingId}`);
      }
    } catch { toast.error('Payment confirm होऊ शकली नाही'); }
    finally { setProcessing(false); }
  };

  const handleOnlinePayment = async () => {
    setProcessing(true);
    try {
      const { data } = await paymentService.createOrder(parseInt(bookingId));
      if (!data.success) { toast.error('Order create होऊ शकला नाही'); setProcessing(false); return; }

      const loadRazorpay = () => new Promise((resolve) => {
        if (window.Razorpay) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        document.head.appendChild(script);
      });

      await loadRazorpay();

      const options = {
        key: data.data.key,
        amount: data.data.amount,
        currency: data.data.currency,
        name: 'Digital Kaam Naka',
        description: `Booking #${bookingId} Payment`,
        order_id: data.data.orderId,
        handler: async (response) => {
          try {
            const verRes = await paymentService.verify({
              bookingId: parseInt(bookingId),
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (verRes.data.success) {
              toast.success('💰 Online पेमेंट यशस्वी!');
              navigate(`/rate/${bookingId}`);
            }
          } catch { toast.error('Payment verify होऊ शकले नाही'); }
        },
        prefill: { contact: '' },
        theme: { color: '#F97316' },
        modal: { ondismiss: () => setProcessing(false) },
      };

      new window.Razorpay(options).open();
    } catch { toast.error('Payment सुरू करता आले नाही'); setProcessing(false); }
  };

  if (loading) return <div className="container section-sm"><Loader fullPage /></div>;
  if (!booking) return <div className="container section-sm"><p>Booking सापडली नाही</p></div>;

  const platformFee = booking.totalAmount * 0.05;
  const workerGets  = booking.totalAmount - platformFee;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 20, marginBottom: 24 }}>💰 Payment</h1>

      <div className="card card-body" style={{ marginBottom: 20 }}>
        {[
          ['काम रक्कम', `₹${parseInt(booking.totalAmount).toLocaleString()}`],
          ['सेवा शुल्क (5%)', `₹${parseInt(platformFee).toLocaleString()}`],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            <span>{label}</span><span>{val}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '2px solid var(--color-border)', fontWeight: 700, fontSize: 18 }}>
          <span>कामगाराला मिळते</span>
          <span style={{ color: 'var(--color-success)' }}>₹{parseInt(workerGets).toLocaleString()}</span>
        </div>
      </div>

      <div className="card card-body" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 16 }}>पेमेंट पद्धत निवडा</h3>
        {[
          { value: 'cash',   label: '💵 रोख रक्कम',              desc: 'थेट कामगाराला रोख द्या' },
          { value: 'online', label: '📱 UPI / Card / Net Banking', desc: 'Razorpay द्वारे online payment' },
        ].map(opt => (
          <button key={opt.value} type="button" onClick={() => setMethod(opt.value)}
            style={{
              padding: '14px 16px', border: '2px solid', borderRadius: 10, cursor: 'pointer',
              textAlign: 'left', fontFamily: 'var(--font-family)', width: '100%', marginBottom: 8,
              background: method === opt.value ? 'var(--color-primary-light)' : 'white',
              borderColor: method === opt.value ? 'var(--color-primary)' : 'var(--color-border)',
            }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: method === opt.value ? 'var(--color-primary)' : 'var(--color-text)' }}>{opt.label}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>{opt.desc}</div>
          </button>
        ))}
      </div>

      <button
        className="btn btn-success btn-block btn-lg"
        disabled={processing}
        onClick={method === 'cash' ? handleCashPayment : handleOnlinePayment}
      >
        {processing ? <Loader text="Processing..." /> : method === 'cash' ? '✅ रोख Payment Confirm' : '💳 Online Payment करा'}
      </button>
    </div>
  );
};

export default PaymentPage;
