import { useState, useEffect } from 'react';
import API from '../api/axios';

const SERVICE_TYPES = [
  'Electrician', 'Plumber', 'Carpenter', 'Tutor',
  'Painter', 'Mechanic', 'Cleaner', 'AC Repair'
];

const Dashboard = () => {
  const [formData, setFormData] = useState({
    service_type: '', area: '', pin_code: '',
    price_range: '', bio: '', contact: ''
  });
  const [existing, setExisting] = useState(false);
  const [message,  setMessage]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  // Check if this provider already registered a service
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/providers/my/profile');
        const p   = res.data.provider;
        setExisting(true);
        setFormData({
          service_type: p.service_type || '',
          area:         p.area         || '',
          pin_code:     p.pin_code     || '',
          price_range:  p.price_range  || '',
          bio:          p.bio          || '',
          contact:      p.contact      || '',
        });
      } catch (err) {
        // 404 = not registered yet, which is fine
        if (err.response?.status !== 404) {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await API.post('/providers/register', formData);
      setMessage('Service registered! Customers can now find you.');
      setExisting(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="text-center mt-20 text-gray-400">Loading...</div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Provider dashboard
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        {existing
          ? 'Your service is live. Customers can find you in search.'
          : 'Fill in your details so customers can find you.'}
      </p>

      {/* Status badge */}
      {existing && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <span>✓</span>
          <span>Your service is registered and visible in search results.</span>
        </div>
      )}

      {message && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service type
          </label>
          <select name="service_type" value={formData.service_type}
            onChange={handleChange} required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select your service</option>
            {SERVICE_TYPES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Area / locality
          </label>
          <input type="text" name="area" value={formData.area}
            onChange={handleChange} required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Sector 15, Noida" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pin code
          </label>
          <input type="text" name="pin_code" value={formData.pin_code}
            onChange={handleChange} required maxLength={6}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="201301" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price range (₹)
          </label>
          <input type="text" name="price_range" value={formData.price_range}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 200-800" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact number
          </label>
          <input type="text" name="contact" value={formData.contact}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="9876543210" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea name="bio" value={formData.bio}
            onChange={handleChange} rows={3}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell customers about your experience and skills..." />
        </div>

        <button type="submit" disabled={saving || existing}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving...' : existing ? 'Already registered' : 'Register service'}
        </button>
      </form>
    </div>
  );
};

export default Dashboard;