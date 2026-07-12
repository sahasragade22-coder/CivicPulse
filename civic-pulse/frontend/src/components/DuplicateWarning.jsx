import { useState } from 'react';

export default function DuplicateWarning({ duplicates, onIgnore, onAcknowledge }) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!duplicates || duplicates.length === 0) return null;

  const handleAcknowledge = () => {
    setAcknowledged(true);
    if (onAcknowledge) onAcknowledge();
  };

  return (
    <div style={{
      backgroundColor: '#fff3cd',
      border: '2px solid #ffc107',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#856404', fontSize: '16px', fontWeight: '600' }}>
            Similar Complaints Found
          </h3>
          <p style={{ margin: '0 0 15px 0', color: '#856404', fontSize: '14px' }}>
            We found {duplicates.length} similar complaint(s) in the system. Please review before submitting:
          </p>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
            {duplicates.map((complaint, idx) => (
              <div 
                key={idx} 
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  padding: '10px',
                  marginBottom: '8px',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <strong>Complaint #{complaint.id} - {complaint.category}</strong>
                  <span style={{
                    backgroundColor: complaint.text_similarity > 0.8 ? '#d32f2f' : '#f57c00',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}>
                    {Math.round(complaint.text_similarity * 100)}% match
                  </span>
                </div>
                <p style={{ margin: '3px 0', color: '#555' }}>
                  <strong>Title:</strong> {complaint.title}
                </p>
                <p style={{ margin: '3px 0', color: '#555' }}>
                  <strong>Status:</strong> {complaint.severity} severity - {complaint.match_type} match
                </p>
                {complaint.distance_km && (
                  <p style={{ margin: '3px 0', color: '#555' }}>
                    <strong>Distance:</strong> {complaint.distance_km} km away
                  </p>
                )}
                <p style={{ margin: '3px 0', color: '#777', fontSize: '12px' }}>
                  Filed on {complaint.date} by {complaint.citizen_name}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                onIgnore && onIgnore();
                setAcknowledged(false);
              }}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#ffc107',
                color: '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Understand & Continue
            </button>
            <button
              onClick={handleAcknowledge}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Mark as Duplicate Later
            </button>
          </div>

          {acknowledged && (
            <p style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
              fontSize: '13px'
            }}>
              ✓ You can mark this complaint as a duplicate after submission.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
