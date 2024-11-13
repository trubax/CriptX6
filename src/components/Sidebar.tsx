import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();

  // ... codice esistente ...

  return (
    <div>
      {/* ... altri elementi della sidebar ... */}
      <button
        onClick={() => navigate('/profile')}
        className="existing-button-classes"
      >
        Profilo
      </button>
      {/* ... altri elementi della sidebar ... */}
    </div>
  );
} 