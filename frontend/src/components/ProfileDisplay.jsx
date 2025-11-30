import React from 'react';
import { User } from 'lucide-react';

const ProfileDisplay = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32'
  };

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
    '2xl': 64
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizes[size] || iconSizes.md;

  if (!user) {
    return (
      <div className={`${sizeClass} rounded-full bg-gray-200 flex items-center justify-center`}>
        <User size={iconSize / 2} className="text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-white shadow-md`}>
      {user.profile_image ? (
        <img
          src={`http://localhost/Event-yetu/${user.profile_image}`}
          alt={user.name || 'Profile'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      {/* Fallback to initials */}
      <div
        className="w-full h-full flex items-center justify-center text-white font-semibold"
        style={{ display: user.profile_image ? 'none' : 'flex', fontSize: `${iconSize / 2}px` }}
      >
        {user.name ? user.name.charAt(0).toUpperCase() : <User size={iconSize / 2} />}
      </div>
    </div>
  );
};

export default ProfileDisplay;
