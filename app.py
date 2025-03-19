from flask import Flask, render_template, redirect, url_for

app = Flask(__name__)

@app.route('/')
def home():
    return redirect(url_for('login'))

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/profile')
def profile():
    return render_template('profileAdmin.html')

@app.route('/manageUsers')
def manageUsers():
    return render_template('manageUsers.html')

@app.route('/messages')
def messages():
    return render_template('messages.html')

@app.route('/mobile/messages')
def mobile_messages():
    return render_template('mobile/messages.html')

if __name__ == '__main__':
    app.run(debug=True)