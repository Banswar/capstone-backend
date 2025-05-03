// Helper function to get expiry time based on user role
export const getExpiryTimeByRole = (role) => {
    switch (role) {
        case 'admin':
            return '60m'; // 1 day for admins
        case 'department_head':
            return '45m'; // 12 hours for managers
        case 'employee':
            return '30m';
        case 'guest':
            return '15'; // 4 hours for regular users
        default:
            return '15m'; 
    }
};

// Helper function to calculate expiry timestamp based on JWT expiry string
export const calculateExpiryTimestamp = (expiryString) => {
    // Parse the JWT expiry string (e.g., '1h', '1d', '7d')
    const unit = expiryString.slice(-1);
    const value = parseInt(expiryString.slice(0, -1));
    
    const now = new Date();
    
    switch(unit) {
    case 's': // seconds
        return new Date(now.getTime() + (value * 1000)).getTime();
    case 'm': // minutes
        return new Date(now.getTime() + (value * 60 * 1000)).getTime();
    case 'h': // hours
        return new Date(now.getTime() + (value * 60 * 60 * 1000)).getTime();
    case 'd': // days
        return new Date(now.getTime() + (value * 24 * 60 * 60 * 1000)).getTime();
    default:
        return new Date(now.getTime() + (15 * 60 * 1000)).getTime(); // Default 15 minutes
    }
};