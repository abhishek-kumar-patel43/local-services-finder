import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const SERVICE_TYPES = [
  'Electrician', 'Plumber', 'Carpenter', 'Tutor',
  'Painter', 'Mechanic', 'Cleaner', 'AC Repair'
];

// A single provider card shown in search results
const ProviderCard = ({ provider }) => {
  const navigate = useNavigate();

  const stars = Array.from({ length: 5 }, (_, i) => (
    <span key={i}
      className={i < Math.round(provider.avg_rating)
        ? 'text-yellow-400'
        : 'text-gray-200'}>
      ★
    </span>
  ));

  return (
    <div
      onClick={() => navigate(`/provider/${provider.id}`)}
      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-shadow border border-gray-100"
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
          {provider.provider_name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{provider.provider_name}</h3>
          <p className="text-xs text-gray-500">{provider.service_type}</p>
        </div>
      </div>

      {/* Star rating */}
      <div className="flex items-center gap-1 mb-3">
        <span className="text-sm">{stars}</span>
        <span className="text-xs text-gray-500 ml-1">
          {provider.avg_rating > 0
            ? `${provider.avg_rating} / 5`
            : 'No ratings yet'}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1 text-sm text-gray-600">
        <p>📍 {provider.area}</p>
        <p>📌 Pin: {provider.pin_code}</p>
        {provider.price_range && <p>💰 ₹{provider.price_range}</p>}
      </div>

      <div className="mt-4">
        <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
          View Profile →
        </span>
      </div>
    </div>
  );
};


const SearchPage = () => {
  const [service,  setService]  = useState('');
  const [pinCode,  setPinCode]  = useState('');
  const [results,  setResults]  = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSearched(true);

    try {
      const res = await API.get('/search', {
        params: { service, pin_code: pinCode }
      });
      setResults(res.data.providers);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      {/* Hero text */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          Find Local Services
        </h1>
        <p className="text-gray-500">
          Search for trusted service providers in your area
        </p>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service type
            </label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a service</option>
              {SERVICE_TYPES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pin code
            </label>
            <input
              type="text"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              required
              maxLength={6}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 201301"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-blue-600 text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </form>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {results.length > 0
              ? `Found ${results.length} provider${results.length > 1 ? 's' : ''}`
              : 'No providers found. Try a different service or pin code.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map(provider => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchPage;