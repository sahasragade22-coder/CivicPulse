import { useEffect, useState } from 'react';
import '../styles/NotificationPanel.css';

export default function NotificationPanel({ socket }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for complaint updates
    socket.on('complaint_updated', (data) => {
      addNotification({
        type: 'info',
        title: `Complaint #${data.complaint_id} Updated`,
        message: data.message || `Status changed to ${data.new_status}`,
        icon: '📋'
      });
    });

    // Listen for assignments
    socket.on('assigned_complaint', (data) => {
      addNotification({
        type: 'success',
        title: 'Complaint Assigned',
        message: data.message || `Assigned to ${data.officer_name}`,
        icon: '👤'
      });
    });

    // Listen for critical alerts
    socket.on('critical_complaint_alert', (data) => {
      addNotification({
        type: 'alert',
        title: `🚨 Critical: ${data.complaint_title}`,
        message: `${data.category} in ${data.ward} (ID: #${data.complaint_id})`,
        icon: '⚠️'
      });
    });

    // Listen for system alerts
    socket.on('system_alert', (data) => {
      addNotification({
        type: data.severity === 'error' ? 'error' : 'info',
        title: data.alert_type,
        message: data.message,
        icon: data.severity === 'error' ? '❌' : 'ℹ️'
      });
    });

    return () => {
      socket.off('complaint_updated');
      socket.off('assigned_complaint');
      socket.off('critical_complaint_alert');
      socket.off('system_alert');
    };
  }, [socket]);

  const addNotification = (notification) => {
    const id = Date.now();
    const notifWithId = { ...notification, id };
    
    setNotifications(prev => [...prev, notifWithId]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="notification-panel">
      {notifications.map(notif => (
        <div key={notif.id} className={`notification notification-${notif.type}`}>
          <span className="notif-icon">{notif.icon}</span>
          <div className="notif-content">
            <h4 className="notif-title">{notif.title}</h4>
            <p className="notif-message">{notif.message}</p>
          </div>
          <button 
            className="notif-close" 
            onClick={() => removeNotification(notif.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
