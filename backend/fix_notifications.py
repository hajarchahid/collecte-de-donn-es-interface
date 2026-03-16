from app import app
from extensions import db
from models.notification import Notification

with app.app_context():
    # Find notifications with the bad link
    bad_link = "/dashboard/orthophoniste/notifications"
    notifications = Notification.query.filter_by(link=bad_link).all()
    
    count = 0
    for notif in notifications:
        print(f"Fixing notification {notif.id}: {notif.title}")
        notif.link = None
        count += 1
    
    if count > 0:
        db.session.commit()
        print(f"Fixed {count} notifications.")
    else:
        print("No notifications to fix.")
