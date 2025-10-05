from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Por ahora NO cargar modelo - tu equipo lo agregará después
# import joblib
# model = joblib.load('models/air_quality_model.pkl')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'OK',
        'model': 'Air Quality Prediction Model v1.0',
        'ready': False,
        'note': 'Model training in progress'
    })

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    
    # Mock prediction mientras tu equipo termina el modelo
    return jsonify({
        'date': data['date'],
        'city': data['city'],
        'parameter': data.get('parameter', 'pm25'),
        'predictedValue': 32.5,
        'confidence': 85.3,
        'unit': 'µg/m³',
        'model': 'Mock - awaiting real model',
        'historical': {
            'average': 28.1,
            'min': 15.2,
            'max': 45.8
        }
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)