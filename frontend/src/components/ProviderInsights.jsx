import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ProviderInsights = () => {
  const [insights, setInsights] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [marketDemand, setMarketDemand] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch('http://localhost/Event-yetu/backend/api/ai.php?action=provider-insights', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setInsights(data.insights || []);
        setPerformance(data.performance || []);
        setMarketDemand(data.marketDemand || []);
      } else {
        toast.error('Failed to load insights');
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast.error('Error loading insights');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-32 rounded-xl"></div>
        <div className="animate-pulse bg-gray-200 h-48 rounded-xl"></div>
      </div>
    );
  }

  const getInsightColor = (type) => {
    switch(type) {
      case 'opportunity': return 'from-green-50 to-emerald-50 border-green-200';
      case 'performance': return 'from-blue-50 to-indigo-50 border-blue-200';
      case 'pricing': return 'from-purple-50 to-pink-50 border-purple-200';
      case 'seasonal': return 'from-orange-50 to-yellow-50 border-orange-200';
      default: return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
            <p className="text-indigo-100 text-sm">Data-driven recommendations for your business</p>
          </div>
        </div>
      </div>

      {/* Key Insights Cards */}
      {insights.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <div 
              key={index}
              className={`bg-gradient-to-br ${getInsightColor(insight.type)} border rounded-xl p-5 hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">{insight.icon}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1">{insight.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{insight.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <span className="text-4xl mb-3 block">📊</span>
          <p className="text-gray-500">Create more bookings to unlock insights</p>
        </div>
      )}

      {/* Performance by Category */}
      {performance.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📈</span>
            <span>Your Performance by Category</span>
          </h3>
          <div className="space-y-3">
            {performance.map((cat, index) => {
              const confirmationRate = cat.total_bookings > 0 
                ? Math.round((cat.confirmed_bookings / cat.total_bookings) * 100) 
                : 0;
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{cat.category}</p>
                    <p className="text-sm text-gray-500">
                      {cat.total_bookings} booking{cat.total_bookings !== 1 ? 's' : ''} • 
                      Avg Ksh {parseFloat(cat.avg_price || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${confirmationRate >= 70 ? 'text-green-600' : confirmationRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {confirmationRate}%
                    </div>
                    <p className="text-xs text-gray-500">confirmed</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Market Demand Analysis */}
      {marketDemand.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🎯</span>
            <span>Market Demand (Last 60 Days)</span>
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {marketDemand.slice(0, 6).map((market, index) => {
              const maxDemand = Math.max(...marketDemand.map(m => m.demand));
              const demandPercent = (market.demand / maxDemand) * 100;
              
              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-800 text-sm">{market.category}</p>
                    <span className="text-xl">
                      {index === 0 ? '🔥' : index === 1 ? '⭐' : index === 2 ? '✨' : '📍'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-600 mb-1">{market.demand}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${demandPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">bookings</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <span>💡</span>
          <span>AI Tips for Growing Your Business</span>
        </h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <p className="text-sm text-gray-700">
              <strong>Optimize Pricing:</strong> Services priced within 20% of market average get 3x more bookings
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <p className="text-sm text-gray-700">
              <strong>Add Photos:</strong> Services with high-quality images receive 5x more views
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <p className="text-sm text-gray-700">
              <strong>Fast Response:</strong> Confirming bookings within 24 hours increases client retention by 60%
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <p className="text-sm text-gray-700">
              <strong>Seasonal Planning:</strong> Update your services 2 months before peak seasons (holidays, weddings)
            </p>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchInsights}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Insights</span>
        </button>
      </div>
    </div>
  );
};

export default ProviderInsights;
