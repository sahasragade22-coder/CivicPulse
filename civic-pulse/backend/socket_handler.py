"""
WebSocket event handlers for CivicPulse real-time updates.
Handles complaint status changes, assignments, and notifications.
"""

from flask import request
from flask_socketio import emit, join_room, leave_room, rooms
from database import get_complaint_by_id, get_user_by_id

# Store active user connections
active_users = {}
complaint_watchers = {}  # complaint_id -> [user_ids watching]

def register_socket_handlers(socketio):
    """Register all WebSocket event handlers"""
    
    @socketio.on('connect')
    def handle_connect():
        """Handle user connection"""
        user_id = request.args.get('user_id')
        user_role = request.args.get('role')
        
        if user_id:
            active_users[request.sid] = {
                'user_id': user_id,
                'role': user_role,
                'sid': request.sid
            }
            
            # User joins their personal room for notifications
            join_room(f"user_{user_id}")
            
            # Officers join the global officer room for updates
            if user_role == 'official':
                join_room("officers")
            
            print(f"User {user_id} connected (SID: {request.sid})")
            
            # Notify user of successful connection
            emit('connection_status', {
                'connected': True,
                'user_id': user_id,
                'message': 'Connected to CivicPulse'
            })
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle user disconnection"""
        if request.sid in active_users:
            user_info = active_users[request.sid]
            user_id = user_info['user_id']
            
            # Remove from watched complaints
            for complaint_id in list(complaint_watchers.keys()):
                if user_id in complaint_watchers[complaint_id]:
                    complaint_watchers[complaint_id].remove(user_id)
            
            del active_users[request.sid]
            print(f"User {user_id} disconnected")
    
    @socketio.on('watch_complaint')
    def handle_watch_complaint(data):
        """User subscribes to updates for a specific complaint"""
        complaint_id = data.get('complaint_id')
        user_id = data.get('user_id')
        
        if complaint_id not in complaint_watchers:
            complaint_watchers[complaint_id] = []
        
        if user_id not in complaint_watchers[complaint_id]:
            complaint_watchers[complaint_id].append(user_id)
            join_room(f"complaint_{complaint_id}")
            
            emit('watch_status', {
                'complaint_id': complaint_id,
                'watching': True,
                'message': f'Now watching complaint #{complaint_id}'
            })
    
    @socketio.on('unwatch_complaint')
    def handle_unwatch_complaint(data):
        """User unsubscribes from updates for a complaint"""
        complaint_id = data.get('complaint_id')
        user_id = data.get('user_id')
        
        if complaint_id in complaint_watchers and user_id in complaint_watchers[complaint_id]:
            complaint_watchers[complaint_id].remove(user_id)
            leave_room(f"complaint_{complaint_id}")
            
            emit('watch_status', {
                'complaint_id': complaint_id,
                'watching': False,
                'message': f'Stopped watching complaint #{complaint_id}'
            })
    
    @socketio.on('get_active_users')
    def handle_get_active_users():
        """Get count of active users"""
        citizen_count = sum(1 for u in active_users.values() if u['role'] != 'official')
        officer_count = sum(1 for u in active_users.values() if u['role'] == 'official')
        
        emit('active_users_count', {
            'total': len(active_users),
            'citizens': citizen_count,
            'officers': officer_count
        })

def notify_complaint_status_change(socketio, complaint_id, new_status, old_status=None, assigned_to=None):
    """Broadcast complaint status change to all watchers and officers"""
    complaint = get_complaint_by_id(complaint_id)
    
    if not complaint:
        return
    
    notification = {
        'event_type': 'complaint_status_changed',
        'complaint_id': complaint_id,
        'complaint_title': complaint.get('title', 'Complaint'),
        'new_status': new_status,
        'old_status': old_status,
        'assigned_to': assigned_to,
        'timestamp': complaint.get('updated_at'),
        'citizen_email': complaint.get('citizen_email'),
        'category': complaint.get('category'),
        'ward': complaint.get('ward'),
        'severity': complaint.get('severity')
    }
    
    # Notify all watchers of this complaint
    socketio.emit('complaint_updated', notification, room=f"complaint_{complaint_id}")
    
    # Notify the citizen who filed the complaint
    socketio.emit('complaint_updated', {
        **notification,
        'message': f"Your {complaint.get('category')} complaint in {complaint.get('ward')} is now {new_status.lower()}"
    }, room=f"user_{complaint.get('citizen_email')}")
    
    # Notify officers if Critical or High severity
    if complaint.get('severity') in ['Critical', 'High']:
        socketio.emit('critical_complaint_alert', notification, room="officers")

def notify_complaint_assigned(socketio, complaint_id, officer_id):
    """Notify when complaint is assigned to an officer"""
    complaint = get_complaint_by_id(complaint_id)
    officer = get_user_by_id(officer_id)
    
    if not complaint or not officer:
        return
    
    notification = {
        'event_type': 'complaint_assigned',
        'complaint_id': complaint_id,
        'complaint_title': complaint.get('title', 'Complaint'),
        'officer_id': officer_id,
        'officer_name': officer.get('name'),
        'category': complaint.get('category'),
        'ward': complaint.get('ward'),
        'severity': complaint.get('severity'),
        'timestamp': complaint.get('updated_at')
    }
    
    # Notify the assigned officer
    socketio.emit('assigned_complaint', notification, room=f"user_{officer_id}")
    
    # Notify all officers
    socketio.emit('new_assignment', notification, room="officers")
    
    # Notify the citizen
    socketio.emit('complaint_assigned', {
        **notification,
        'message': f"Your complaint has been assigned to {officer.get('name')}"
    }, room=f"user_{complaint.get('citizen_email')}")

def notify_new_complaint(socketio, complaint_id, category, ward, severity):
    """Notify officers of new complaint"""
    complaint = get_complaint_by_id(complaint_id)
    
    if not complaint:
        return
    
    notification = {
        'event_type': 'new_complaint',
        'complaint_id': complaint_id,
        'title': complaint.get('title', 'New Complaint'),
        'category': category,
        'ward': ward,
        'severity': severity,
        'text_preview': complaint.get('text', '')[:100],
        'timestamp': complaint.get('created_at')
    }
    
    # Notify all officers
    socketio.emit('new_complaint_alert', notification, room="officers")

def notify_resolution_note_added(socketio, complaint_id, note_summary, officer_id):
    """Notify citizen when officer adds resolution notes"""
    complaint = get_complaint_by_id(complaint_id)
    officer = get_user_by_id(officer_id)
    
    if not complaint or not officer:
        return
    
    notification = {
        'event_type': 'note_added',
        'complaint_id': complaint_id,
        'officer_name': officer.get('name'),
        'note_preview': note_summary[:50],
        'timestamp': complaint.get('updated_at')
    }
    
    # Notify the citizen
    socketio.emit('complaint_updated', {
        **notification,
        'message': f"{officer.get('name')} added an update on your complaint"
    }, room=f"user_{complaint.get('citizen_email')}")

def broadcast_system_alert(socketio, alert_type, message, severity='info'):
    """Broadcast system-wide alert to all connected users"""
    alert = {
        'event_type': 'system_alert',
        'alert_type': alert_type,
        'message': message,
        'severity': severity  # 'info', 'warning', 'error'
    }
    
    socketio.emit('system_alert', alert, broadcast=True)

def get_connected_user_count(role=None):
    """Get count of connected users, optionally filtered by role"""
    if role is None:
        return len(active_users)
    
    return sum(1 for u in active_users.values() if u['role'] == role)
