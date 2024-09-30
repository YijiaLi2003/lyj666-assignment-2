from flask import Flask, render_template, jsonify, request
import numpy as np

app = Flask(__name__)

dataset = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_data')
def get_data():
    global dataset
    if dataset is None:
        np.random.seed(42)  
        x = np.random.rand(100) * 10
        y = np.random.rand(100) * 10
        data = list(zip(x.tolist(), y.tolist()))
        dataset = data
    else:
        data = dataset
    return jsonify({'data': data})

@app.route('/new_data')
def new_data():
    global dataset
    np.random.seed()  
    x = np.random.rand(100) * 10
    y = np.random.rand(100) * 10
    data = list(zip(x.tolist(), y.tolist()))
    dataset = data
    return jsonify({'data': data})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)

