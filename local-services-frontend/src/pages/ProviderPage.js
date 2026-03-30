import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const ProviderPage = () => {
  const { id }       = useParams();
  const { user }     = useAuth();
  const [provider,   setProvider]   = useState(null);
  const [reviews,    setReviews]    = useState([]);
  const [rating,     setRating]     = useState(5);
  const [comment,    setComment]    = useState('');
  const [reviewMsg,  setReviewMsg]  = useState('');
  const [reviewErr,  setReviewErr]  = useState('');
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load provider and reviews together when page opens
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [provRes, revRes] = await Promise.all([
          API.get(`/providers/${id}`),
          API.get(`/reviews/${id}`),
        ]);
        setProvider(provRes.data.provider);
        setReviews(revRes.data.reviews);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewMsg('');
    setReviewErr('');
    setSubmitting(true);

    try {
      await API.post(`/reviews/${id}`, { rating, comment });
      setReviewMsg('Review submitted!');
      setComment('');
      setRating(5);
      // Refresh reviews list
      const revRes = await API.get(`/reviews/${id}`);
      setReviews(revRes.data.reviews);
    } catch (err) {
      setReviewErr(err.response?.data?.message || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="text-center mt-20 text-gray-400">Loading...</div>
  );

  if (!provider) return (
    <div className="text-center mt-20 text-gray-400">Provider not found</div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Provider info card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl">
            {provider.provider_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {provider.provider_name}
            </h1>
            <p className="text-blue-600 font-medium">{provider.service_type}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
          <p>📍 {provider.area}</p>
          <p>📌 Pin code: {provider.pin_code}</p>
          <p>📞 {provider.contact}</p>
          {provider.price_range && <p>💰 ₹{provider.price_range}</p>}
        </div>

        {provider.bio && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
            {provider.bio}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2">
          <span className="text-yellow-400 text-xl">★</span>
          <span className="font-semibold text-gray-800">
            {provider.avg_rating > 0 ? provider.avg_rating : 'No ratings yet'}
          </span>
          <span className="text-gray-400 text-sm">
            ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
          </span>
        </div>
      </div>

      {/* Review form — only visible to logged-in customers */}
      {user && user.role === 'customer' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Leave a review
          </h2>

          {reviewMsg && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
              {reviewMsg}
            </div>
          )}
          {reviewErr && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              {reviewErr}
            </div>
          )}

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            {/* Star picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-200'
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-sm text-gray-500 ml-2 self-center">
                  {rating} / 5
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Share your experience..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>
          </form>
        </div>
      )}

      {/* All reviews */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Reviews ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review.id}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800 text-sm">
                    {review.customer_name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="text-yellow-400 text-sm mb-1">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderPage;