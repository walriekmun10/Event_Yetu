import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ReceiptView = () => {
  const { bookingId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  
  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);
  
  const loadBookingDetails = async () => {
    try {
      const response = await axios.get(
        `http://localhost/Event-yetu/backend/api/bookings_enhanced.php?action=booking-details&booking_id=${bookingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setBooking(response.data.booking);
      } else {
        toast.error('Booking not found');
        navigate(-1);
      }
    } catch (error) {
      console.error('Error loading booking:', error);
      toast.error('Failed to load booking details');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };
  
  const downloadReceipt = () => {
    setDownloading(true);
    // Prefer direct receipt URL if server provided one (public uploads), otherwise use generator endpoint
    const url = booking.receipt_url
      ? `${window.location.origin}${booking.receipt_url}`
      : `http://localhost/Event-yetu/backend/api/generate_receipt.php?booking_id=${bookingId}&token=${token}`;
    window.open(url, '_blank');
    
    setTimeout(() => {
      setDownloading(false);
      toast.success('Receipt download started');
    }, 1000);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading receipt...</p>
        </div>
      </div>
    );
  }
  
  if (!booking) {
    return null;
  }
  
  const calculateSubtotal = () => {
    return booking.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </button>
          
          <button
            onClick={downloadReceipt}
            disabled={downloading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {downloading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
        
        {/* Receipt Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Small feedback about emailed receipt */}
          {booking.receipt_url && (
            <div className="p-4 bg-green-50 border-l-4 border-green-400">
              <div className="max-w-4xl mx-auto px-4 mb-4 flex items-center justify-between">
                <div className="text-sm text-green-800">
                  A receipt was emailed to you and is available for download.
                </div>
                <div>
                  <a href={booking.receipt_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-indigo-600 hover:underline">Open Receipt</a>
                </div>
              </div>
            </div>
          )}
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎉</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Event Yetu</h1>
              <p className="text-indigo-100">Professional Event Management Services</p>
            </div>
          </div>
          
          {/* Receipt Title */}
          <div className="bg-gray-50 px-8 py-6 border-b-2 border-indigo-600">
            <h2 className="text-2xl font-bold text-center text-gray-800">BOOKING RECEIPT</h2>
          </div>
          
          {/* Receipt Content */}
          <div className="px-8 py-6 space-y-8">
            {/* Booking Information */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Booking Information</h3>
              <div className="bg-gray-50 rounded-lg p-6 grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Booking Number</p>
                  <p className="font-semibold text-gray-800">{booking.booking_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date Issued</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(booking.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Event Date</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(booking.event_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status.toUpperCase()}
                  </span>
                </div>
                {booking.event_time && (
                  <div>
                    <p className="text-sm text-gray-500">Event Time</p>
                    <p className="font-semibold text-gray-800">{booking.event_time}</p>
                  </div>
                )}
                {booking.venue && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Venue</p>
                    <p className="font-semibold text-gray-800">{booking.venue}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Client Information */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Client Information</h3>
              <div className="bg-gray-50 rounded-lg p-6 grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-semibold text-gray-800">{booking.user_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-gray-800">{booking.user_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-semibold text-gray-800 capitalize">{booking.user_role}</p>
                </div>
              </div>
            </div>
            
            {/* Booked Services */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Booked Services</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-indigo-600 text-white">
                      <th className="px-4 py-3 text-left">Service Name</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Provider</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Amount (KSh)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.items.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-3 font-medium text-gray-800">{item.service_name}</td>
                        <td className="px-4 py-3 text-gray-600">{item.service_category}</td>
                        <td className="px-4 py-3 text-gray-600">{item.provider_name}</td>
                        <td className="px-4 py-3 text-center text-gray-800">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                          {parseFloat(item.subtotal).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Total */}
            <div className="border-t-2 border-gray-200 pt-6">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-800">
                      KSh {calculateSubtotal().toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-indigo-600 pt-2 border-t">
                    <span>TOTAL AMOUNT:</span>
                    <span>
                      KSh {parseFloat(booking.total_amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Information */}
            {booking.payment ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>✓</span>
                  <span>Payment Information</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Receipt Number</p>
                    <p className="font-semibold text-gray-800">{booking.payment.receipt_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      booking.payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      booking.payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.payment.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-semibold text-gray-800 uppercase">{booking.payment.payment_method}</p>
                  </div>
                  {booking.payment.mpesa_reference && (
                    <div>
                      <p className="text-sm text-gray-500">M-Pesa Reference</p>
                      <p className="font-semibold text-gray-800">{booking.payment.mpesa_reference}</p>
                    </div>
                  )}
                  {booking.payment.paid_at && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Paid On</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(booking.payment.paid_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Payment Status: PENDING</span>
                </h3>
                <p className="text-gray-700">
                  Please complete payment to confirm your booking.
                </p>
              </div>
            )}
            
            {/* Notes */}
            {booking.notes && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Additional Notes</h3>
                <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{booking.notes}</p>
              </div>
            )}
            
            {/* Terms */}
            <div className="text-center text-sm text-gray-500 italic border-t pt-6">
              <p>
                Terms & Conditions: This receipt is valid for the services listed above. 
                Cancellations must be made 48 hours before the event date. 
                For any queries, please contact our support team.
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 text-center border-t">
            <p className="text-gray-600 mb-2">Thank you for choosing Event Yetu!</p>
            <p className="text-sm text-gray-500">
              For support: support@eventyetu.com | Visit: www.eventyetu.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptView;
