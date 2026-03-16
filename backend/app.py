from flask import Flask
from config import Config
from extensions import db, migrate, jwt, cors

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}}, supports_credentials=True)

    # Register Blueprints test
    from models.user import User
    from blueprints.auth import auth_bp
    from models.child import Child
    from models.notification import Notification
    from models.recording import Recording
    from models.session import Session
    from models.researcher_log import ResearcherLog
    from blueprints.users import users_bp
    from blueprints.children import children_bp
    from blueprints.recordings import recordings_bp
    from blueprints.stats import stats_bp
    from blueprints.sessions import sessions_bp
    
    from blueprints.researcher import researcher_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(users_bp, url_prefix='/users')
    app.register_blueprint(children_bp, url_prefix='/children')
    app.register_blueprint(recordings_bp, url_prefix='/recordings')
    app.register_blueprint(stats_bp, url_prefix='/stats')
    app.register_blueprint(sessions_bp, url_prefix='/sessions')

    app.register_blueprint(researcher_bp, url_prefix='/researcher')
    
    from models.bilan import Bilan
    from blueprints.bilan import bilan_bp
    app.register_blueprint(bilan_bp, url_prefix='')

    
    from blueprints.training import training_bp
    app.register_blueprint(training_bp, url_prefix='/training')
    
    from blueprints.evaluation import evaluation_bp
    from blueprints.evaluation import evaluation_bp
    app.register_blueprint(evaluation_bp, url_prefix='/evaluation')

    from blueprints.notifications import notifications_bp
    app.register_blueprint(notifications_bp, url_prefix='/notifications')
    
    @app.route('/')
    def hello():
        return {"message": "Orthophonic Backend Running"}

    @app.cli.command("create-admin")
    def create_admin():
        """Creates a default admin user."""
        from models.user import User
        import click
        
        email = "admin@orthodata.com"
        username = "Admin"
        password = "AdminPassword123!"
        
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(email=email, username=username, role='admin', is_active=True)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            click.echo(f"Admin created: {email} / {password}")
        else:
            user.role = 'admin'
            user.is_active = True
            user.set_password(password) # Force update password to ensure it matches
            db.session.commit()
            click.echo(f"Admin updated: Role=admin, Active=True, Password reset.")
            
    @app.cli.command("clean-data")
    def clean_data():
        """Deletes all data except the admin account."""
        from models.user import User
        from models.child import Child
        from models.session import Session
        from models.recording import Recording
        from models.researcher_log import ResearcherLog
        import click
        
        click.confirm('Are you sure you want to delete ALL data except Admin?', abort=True)
        
        try:
            # Delete in order of dependencies (Child depends on nothing, but Session depends on Child?)
            # Usually: Children -> Sessions -> Recordings.
            # But FK references might restrict deletion.
            # Let's delete from bottom up: Recordings -> Sessions -> Children
            
            num_logs = ResearcherLog.query.delete()
            num_recs = Recording.query.delete()
            num_sess = Session.query.delete()
            num_child = Child.query.delete()
            
            # Delete all users except admin
            admin_email = "admin@orthodata.com"
            num_users = User.query.filter(User.email != admin_email).delete()
            
            db.session.commit()
            click.echo(f"Deleted: {num_logs} Logs, {num_recs} Recordings, {num_sess} Sessions, {num_child} Children, {num_users} Users.")
            click.echo("Admin account preserved.")
            
        except Exception as e:
            db.session.rollback()
            click.echo(f"Error cleaning data: {e}")

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000)
