import { ChevronLeft, Calendar, Clock, MapPin, User, CreditCard, CheckCircle, Users as UsersIcon } from 'lucide-react';
import { useState } from 'react';

interface ReservationConfirmProps {
  reservation: any;
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
}

export function ReservationConfirm({ reservation, onNavigate, onBack }: ReservationConfirmProps) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onNavigate('home');
    }, 2000);
  };

  if (confirmed) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8" style={{ backgroundColor: '#FAFCFB' }}>
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#54CE8F' }}>
          <CheckCircle size={56} color="white" />
        </div>
        <h2 className="text-2xl text-gray-900 mb-3">Booking Confirmed!</h2>
        <p className="text-gray-600 text-center mb-2">Your court has been reserved successfully</p>
        <p className="text-sm text-gray-500">Redirecting to home...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Header */}
      <div className="px-6 pt-12 pb-4 bg-white border-b border-gray-100">
        <button onClick={onBack} className="mb-4">
          <ChevronLeft size={24} color="#1F2937" />
        </button>
        <h1 className="text-2xl text-gray-900">Confirm Booking</h1>
      </div>

      {/* Reservation Summary */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Reservation Details</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#B4AEBD' }}>
                <MapPin size={20} color="white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Court</p>
                <p className="text-gray-900">{reservation.court.name} - {reservation.court.surface}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#54CE8F' }}>
                <Calendar size={20} color="white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="text-gray-900">Thursday, December 5, 2024</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#B4AEBD' }}>
                <Clock size={20} color="white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Time</p>
                <p className="text-gray-900">{reservation.time} - 90 minutes</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#54CE8F' }}>
                <User size={20} color="white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Game Type</p>
                <p className="text-gray-900">
                  {reservation.gameType === 'singles' ? 'Tekler (1 vs 1)' : 'Çiftler (2 vs 2)'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Players Info */}
        {reservation.gameType && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="text-lg text-gray-900 mb-4">Players</h3>
            
            {reservation.gameType === 'singles' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: '#54CE8F' }}>
                      EK
                    </div>
                    <div>
                      <p className="text-gray-900">Emre Kaya</p>
                      <p className="text-xs text-gray-500">You</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center text-sm text-gray-500">vs</div>
                
                {reservation.opponents && reservation.opponents[0] && (
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                        style={{ backgroundColor: '#B4AEBD' }}>
                        {reservation.opponents[0].name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-gray-900">{reservation.opponents[0].name}</p>
                        <p className="text-xs text-gray-500">Opponent</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Your Team */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">Your Team</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 py-3 px-4 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                        style={{ backgroundColor: '#54CE8F' }}>
                        EK
                      </div>
                      <div>
                        <p className="text-gray-900">Emre Kaya</p>
                        <p className="text-xs text-gray-500">You</p>
                      </div>
                    </div>
                    
                    {reservation.partner && (
                      <div className="flex items-center gap-3 py-3 px-4 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: '#54CE8F' }}>
                          {reservation.partner.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-gray-900">{reservation.partner.name}</p>
                          <p className="text-xs text-gray-500">Partner</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500">vs</div>

                {/* Opponent Team */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">Opponent Team</p>
                  <div className="space-y-2">
                    {reservation.opponents && reservation.opponents.map((opponent: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gray-50">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: '#B4AEBD' }}>
                          {opponent.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-gray-900">{opponent.name}</p>
                          <p className="text-xs text-gray-500">Opponent {index + 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Method */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Payment Method</h3>
          
          <div className="flex items-center gap-4 p-4 rounded-xl border-2" style={{ borderColor: '#54CE8F' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100">
              <CreditCard size={24} style={{ color: '#B4AEBD' }} />
            </div>
            <div className="flex-1">
              <p className="text-gray-900 mb-1">Member Account</p>
              <p className="text-sm text-gray-500">Pay with member balance</p>
            </div>
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#54CE8F' }}>
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg text-gray-900 mb-4">Price Summary</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">Court Rental (90 min)</p>
              <p className="text-gray-900">₺150</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">Member Discount (20%)</p>
              <p style={{ color: '#54CE8F' }}>-₺30</p>
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-gray-900">Total</p>
              <p className="text-xl" style={{ color: '#54CE8F' }}>₺120</p>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3 mb-6">
          <input 
            type="checkbox" 
            className="mt-1 w-5 h-5 rounded border-gray-300" 
            style={{ accentColor: '#54CE8F' }} 
          />
          <p className="text-sm text-gray-600">
            I agree to the cancellation policy. Free cancellation up to 2 hours before the reservation time.
          </p>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="fixed bottom-20 left-0 right-0 px-6 py-4 bg-white border-t border-gray-100">
        <button
          onClick={handleConfirm}
          className="w-full py-4 rounded-2xl text-white shadow-lg"
          style={{ backgroundColor: '#54CE8F' }}
        >
          Confirm & Pay ₺120
        </button>
      </div>
    </div>
  );
}