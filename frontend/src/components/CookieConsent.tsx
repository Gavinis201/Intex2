// components/CookieConsent.tsx
import { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookiesAccepted');
    if (!accepted) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '20px', left: '20px', right: '20px',
      background: '#222', color: '#fff', padding: '15px',
      borderRadius: '8px', textAlign: 'center', zIndex: 9999
    }}>
      🍪 We use cookies to improve your experience.
      <button onClick={handleAccept} style={{
        marginLeft: '15px', padding: '5px 12px',
        backgroundColor: '#4CAF50', border: 'none',
        color: 'white', borderRadius: '5px', cursor: 'pointer'
      }}>
        Accept
      </button>
    </div>
  );
}
