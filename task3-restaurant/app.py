from flask import Flask, request, jsonify
from flask_cors import CORS # Run: pip install flask-cors

app = Flask(__name__)
CORS(app) # This allows your HTML file to talk to your Python server

# Mock Database
menu_items = [
    {"id": "1", "name": "Lamb Chops", "price": 250, "category": "Mains", "description": "Grilled to perfection", "prepTime": 25, "available": True},
    {"id": "2", "name": "Spring Rolls", "price": 85, "category": "Starters", "description": "Vegetarian crispy rolls", "prepTime": 10, "available": True}
]
orders = []
tables = [{"id": "T1", "number": 1, "capacity": 4, "status": "available"}]
inventory = [{"name": "Lamb", "quantity": 10, "minLevel": 5, "unit": "kg"}]

# API Routes
@app.route('/api/menu', methods=['GET'])
def get_menu():
    return jsonify(menu_items)

@app.route('/api/tables', methods=['GET'])
def get_tables():
    return jsonify(tables)

@app.route('/api/orders', methods=['GET', 'POST'])
def handle_orders():
    if request.method == 'POST':
        data = request.json
        total = 0
        for item in data['items']:
            menu_item = next((m for m in menu_items if m["id"] == item['menuItemId']), None)
            if menu_item:
                total += menu_item['price'] * item['quantity']
        
        new_order = {
            "id": len(orders) + 1,
            "customerName": data.get('customerName'),
            "total": total,
            "status": "pending",
            "items": data['items'],
            "createdAt": "2026-05-14T12:00:00Z"
        }
        orders.append(new_order)
        return jsonify(new_order), 201
    return jsonify(orders)

@app.route('/api/reports/daily', methods=['GET'])
def get_report():
    return jsonify({
        "revenue": sum(o['total'] for o in orders),
        "ordersCount": len(orders),
        "lowStockItems": [i for i in inventory if i['quantity'] <= i['minLevel']]
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)