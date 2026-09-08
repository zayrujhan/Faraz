"""
End-to-end workflow test for the Faraz frontend branch.

Tests:
- Customer register, login, cart, checkout (with stock validation)
- Order history for customer
- Seller sees the order
- Chatbot rate limit and relevance guard
- Admin user/block/fraud-report endpoints
"""
import httpx
import random
import string
import sys

BASE = "http://127.0.0.1:8000"
ADMIN_EMAIL = "admin@example.com"
PASSWORD = "password123"


def make_client():
    return httpx.Client(base_url=BASE)


def login(client, email, password):
    r = client.post(
        "/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    r.raise_for_status()
    token = r.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client.get("/me").json()


def register_customer(client, email, password):
    r = client.post(
        "/signup",
        json={"name": "Test Customer", "email": email, "password": password, "role": "customer"},
    )
    r.raise_for_status()
    return r.json()


def main():
    customer_email = f"test_{''.join(random.choices(string.ascii_lowercase, k=8))}@example.com"
    customer_password = "password123"

    print("\n=== WORKFLOW TEST ===\n")

    with make_client() as c:
        print(f"1. Register customer {customer_email}")
        register_customer(c, customer_email, customer_password)
        print("   OK")

    print("\n2. Customer login + address + shipping method")
    with make_client() as c:
        me = login(c, customer_email, customer_password)
        print(f"   OK logged in as {me['role']}")

        shipping_methods = c.get("/shipping-methods/").json()
        payment_methods = c.get("/payment-methods/").json()
        assert shipping_methods, "No shipping methods"
        assert payment_methods, "No payment methods"

        c.post(
            "/addresses/",
            json={
                "street": "123 Test Lane",
                "city": "Dhaka",
                "state": "Dhaka",
                "country": "Bangladesh",
                "postal_code": "1200",
                "shipping_method_id": shipping_methods[0]["id"],
            },
        ).raise_for_status()
        print("   OK address with shipping method saved")

        products = c.get("/products/", params={"limit": 100}).json()
        product = next((p for p in products if p.get("stock", 0) >= 5), None)
        if not product:
            print("   FAIL: no product with enough stock")
            sys.exit(1)
        print(f"   Selected product #{product['id']} stock={product['stock']}")

        print("\n3. Invalid quantity (exceeds stock) should fail")
        r = c.post("/cart/items", json={"product_id": product["id"], "quantity": product["stock"] + 100})
        if r.status_code == 400:
            print(f"   OK 400: {r.json().get('detail')}")
        else:
            print(f"   FAIL expected 400, got {r.status_code}")
            sys.exit(1)

        print("\n4. Add to cart + checkout")
        c.post("/cart/items", json={"product_id": product["id"], "quantity": 2}).raise_for_status()
        checkout = c.post(
            "/checkout/",
            json={"payment_method_id": payment_methods[0]["id"]},
        ).json()
        order = checkout["order"]
        print(f"   OK order #{order['id']} total={order['total_amount']}")

        print("\n5. Customer order history")
        orders = c.get("/orders/").json()
        if any(o["id"] == order["id"] for o in orders):
            print("   OK order appears in customer history")
        else:
            print("   FAIL order not in history")
            sys.exit(1)

    seller_email = product["seller"]["email"]
    print(f"\n6. Seller login ({seller_email})")
    with make_client() as c:
        login(c, seller_email, customer_password)
        seller_orders = c.get("/seller/orders").json()
        matching = [o for o in seller_orders if o["id"] == order["id"]]
        if matching:
            print("   OK seller sees the order")
        else:
            print("   FAIL seller does not see the order")
            sys.exit(1)

    print("\n7. Admin endpoints")
    with make_client() as c:
        login(c, ADMIN_EMAIL, PASSWORD)
        users = c.get("/users/").json()
        print(f"   OK /users/ -> {len(users)} users")
        fraud = c.get("/admin/fraud-report").json()
        print(f"   OK /admin/fraud-report -> {len(fraud)} sellers")

    print("\n8. Chatbot (authenticated, 5-message limit)")
    with make_client() as c:
        login(c, customer_email, customer_password)
        r = c.post("/chat", json={"message": "Show me some products"}, timeout=60)
        r.raise_for_status()
        data = r.json()
        print(f"   OK reply length={len(data['reply'])} remaining={data['remaining_messages']}")
        assert data["remaining_messages"] <= 4

        r2 = c.post("/chat", json={"message": "What is the weather today?"})
        r2.raise_for_status()
        data2 = r2.json()
        print(f"   OK off-topic reply: {data2['reply'][:80]}...")
        # Every question counts toward the 5-message window, including off-topic ones.
        assert data2["remaining_messages"] == data["remaining_messages"] - 1

    print("\n=== ALL WORKFLOW TESTS PASSED ===\n")


if __name__ == "__main__":
    main()
