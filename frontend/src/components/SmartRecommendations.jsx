import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SmartRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [personalized, setPersonalized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
    fetchTrending();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('http://localhost/Event-yetu/backend/api/ai.php?action=service-recommendations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations.slice(0, 4));
        setPersonalized(data.personalized);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await fetch('http://localhost/Event-yetu/backend/api/ai.php?action=trending-services', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setTrending(data.trending.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 h-48 rounded-xl"></div>
        <div className="animate-pulse bg-gray-200 h-48 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Personalized Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>⭐</span>
              <span>Recommended For You</span>
              {personalized && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                  Personalized
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {personalized ? 'Based on your booking history' : 'Popular services to get you started'}
            </p>
          </div>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {recommendations.map(service => (
              <div 
                key={service.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/service/${service.id}`)}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {service.image_url ? (
                      <img 
                        src={`http://localhost/Event-yetu/${service.image_url}`}
                        alt={service.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🎉</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors truncate">
                      {service.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <span>📁</span>
                      <span>{service.category}</span>
                    </p>
                    <p className="text-lg font-bold text-indigo-600 mt-2">
                      Ksh {parseFloat(service.price).toLocaleString()}
                    </p>
                    {service.recommendation_reason && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <span>💡</span>
                        <span>{service.recommendation_reason}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <span className="text-6xl mb-4 block">🔍</span>
            <p className="text-gray-500">No recommendations available yet</p>
          </div>
        )}
      </div>

      {/* Trending Services */}
      {trending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>📈</span>
              <span>Trending This Month</span>
            </h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full animate-pulse">
              Hot
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {trending.map((service, index) => (
              <div 
                key={service.id}
                className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => navigate(`/service/${service.id}`)}
              >
                {/* Trending Badge */}
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <span>🔥</span>
                  <span>#{index + 1}</span>
                </div>

                <div className="mb-3">
                  {service.image_url ? (
                    <img 
                      src={`http://localhost/Event-yetu/${service.image_url}`}
                      alt={service.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">🎊</span>
                    </div>
                  )}
                </div>

                <h4 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors truncate">
                  {service.name}
                </h4>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500">{service.category}</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {service.recent_bookings} bookings
                  </span>
                </div>

                <p className="text-lg font-bold text-indigo-600 mt-2">
                  Ksh {parseFloat(service.price).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-2">AI-Powered Recommendations</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Our smart recommendation engine analyzes booking patterns, service popularity, and your preferences 
              to suggest the perfect services for your events. The more you book, the better our recommendations become!
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-white px-3 py-1.5 rounded-full text-gray-600 flex items-center gap-1">
                <span>✨</span>
                <span>Personalized suggestions</span>
              </span>
              <span className="text-xs bg-white px-3 py-1.5 rounded-full text-gray-600 flex items-center gap-1">
                <span>📊</span>
                <span>Trend analysis</span>
              </span>
              <span className="text-xs bg-white px-3 py-1.5 rounded-full text-gray-600 flex items-center gap-1">
                <span>🎯</span>
                <span>Smart matching</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartRecommendations;
