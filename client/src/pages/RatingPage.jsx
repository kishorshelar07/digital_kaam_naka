import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { ratingService } from '../services/authService';
import { RatingStars } from '../components/rating/RatingStars';
import Loader from '../components/common/Loader';

const STAR_LABELS = {
  1: 'खूपच खराब 😞',
  2: 'खराब 😕',
  3: 'ठीक आहे 😐',
  4: 'चांगले 😊',
  5: 'उत्कृष्ट! 🤩'
};

const RatingPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [score, setScore]         = useState(0);
  const [review, setReview]       = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!score) { toast.error('कृपया Rating द्या'); return; }
    setLoading(true);
    try {
      const { data } = await ratingService.submit({
        bookingId: parseInt(bookingId),
        score,
        review,
      });
      if (data.success) {
        setSubmitted(true);
        toast.success('⭐ Rating दिल्याबद्दल धन्यवाद!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rating देता आली नाही');
    } finally { setLoading(false); }
  };

  if (submitted) return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>🎉</div>
      <h2 style={{ marginBottom: 8 }}>{t('rating.thankYou')}</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
        तुमच्या अभिप्रायामुळे platform अधिक चांगले होते!
      </p>
      <button className="btn btn-primary btn-block" onClick={() => navigate('/bookings')}>
        माझ्या Bookings पाहा
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>⭐ {t('rating.title')}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 28 }}>Booking #{bookingId}</p>

      <form onSubmit={handleSubmit}>
        <div className="card card-body">
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, textAlign: 'center' }}>
            {t('rating.howWasWork')}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <RatingStars value={score} onChange={setScore} size={48} />
          </div>

          {score > 0 && (
            <p style={{ textAlign: 'center', fontSize: 16, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 20 }}>
              {STAR_LABELS[score]}
            </p>
          )}

          <div className="form-group">
            <label className="form-label">{t('rating.writeReview')}</label>
            <textarea className="form-control"
              placeholder={t('rating.reviewPlaceholder')}
              value={review}
              onChange={e => setReview(e.target.value)}
              rows={4} maxLength={1000}
              style={{ resize: 'vertical' }} />
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              {review.length}/1000
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg"
            disabled={loading || !score}>
            {loading ? <Loader text="सादर होत आहे..." /> : `⭐ ${t('rating.submit')}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RatingPage;
