import os
import json
from flask import Flask, render_template, request, redirect, url_for, jsonify, flash, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from openai import OpenAI
from extension import db
class Base(DeclarativeBase):
    pass


# create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "travel-planner-secret-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = 'postgresql://user1:1234@localhost/travel_planner'

app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# initialize the app with the extension
db.init_app(app)

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'info'

# OpenAI setup
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "default-key")
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY != "default-key" else None

# Import models after db initialization
from models import Trip, BlogPost, User
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

with app.app_context():
    db.create_all()

def generate_itinerary(destination, travelers, duration, budget):
    """Generate travel itinerary using OpenAI"""
    if not openai_client:
        return "AI service is currently unavailable. Please configure OpenAI API key."
    
    try:
        prompt = f"""Create a detailed travel itinerary for {travelers} travelers visiting {destination} for {duration} days with a budget of ${budget}. 
        
        Please include:
        - Daily activities and attractions
        - Recommended restaurants and local cuisine
        - Transportation suggestions
        - Budget breakdown
        - Tips for the destination
        
        Format the response as a well-structured itinerary."""
        
        # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
        # do not change this unless explicitly requested by the user
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a professional travel planner with extensive knowledge of destinations worldwide."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error generating itinerary: {str(e)}"

@app.route('/')
def index():
    """Home page with destination carousel"""
    return render_template('index.html')

@app.route('/blog')
def blog():
    """Blog page"""
    posts = BlogPost.query.order_by(BlogPost.created_at.desc()).all()
    return render_template('blog.html', posts=posts)

@app.route('/blog/create', methods=['POST'])
@login_required
def create_blog_post():
    """Create a new blog post"""
    title = request.form.get('title')
    content = request.form.get('content')
    
    if title and content:
        post = BlogPost(title=title, content=content, user_id=current_user.id)
        db.session.add(post)
        db.session.commit()
        flash('Blog post created successfully!', 'success')
    else:
        flash('Title and content are required!', 'error')
    
    return redirect(url_for('blog'))

@app.route('/planner')
def planner():
    """Trip planner page"""
    return render_template('details_page.html')

@app.route('/generate-itinerary', methods=['POST'])
@login_required
def generate_itinerary_route():
    """Generate trip itinerary"""
    destination = request.form.get('destination')
    travelers = request.form.get('travelers')
    duration = request.form.get('duration')
    budget = request.form.get('budget')
    
    if not all([destination, travelers, duration, budget]):
        flash('All fields are required!', 'error')
        return redirect(url_for('planner'))
    
    try:
        travelers_int = int(travelers)
        duration_int = int(duration)
        budget_int = int(budget)
    except ValueError:
        flash('Please enter valid numbers for travelers, duration, and budget!', 'error')
        return redirect(url_for('planner'))
    
    # Save trip to database
    trip = Trip(
        destination=destination,
        travelers=travelers_int,
        duration=duration_int,
        budget=budget_int,
        user_id=current_user.id
    )
    db.session.add(trip)
    db.session.commit()
    
    # Generate itinerary
    itinerary = generate_itinerary(destination, travelers_int, duration_int, budget_int)
    
    return render_template('details_page.html', 
                         itinerary=itinerary,
                         destination=destination,
                         travelers=travelers_int,
                         duration=duration_int,
                         budget=budget_int)

# Authentication Routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            flash('Username and password are required!', 'error')
            return render_template('auth/login.html')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            flash(f'Welcome back, {user.username}!', 'success')
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('index'))
        else:
            flash('Invalid username or password!', 'error')
    
    return render_template('auth/login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    """User registration"""
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if not all([username, email, password, confirm_password]):
            flash('All fields are required!', 'error')
            return render_template('auth/signup.html')
        
        if password != confirm_password:
            flash('Passwords do not match!', 'error')
            return render_template('auth/signup.html')
        
        if len(password) < 6:
            flash('Password must be at least 6 characters long!', 'error')
            return render_template('auth/signup.html')
        
        # Check if username or email already exists
        if User.query.filter_by(username=username).first():
            flash('Username already exists!', 'error')
            return render_template('auth/signup.html')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered!', 'error')
            return render_template('auth/signup.html')
        
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        flash('Account created successfully! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('auth/signup.html')

@app.route('/logout')
@login_required
def logout():
    """User logout"""
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
