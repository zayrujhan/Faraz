"""
End-to-end order flow test for the Faraz marketplace.

Creates a new customer, places an order, and verifies the seller sees it.
Also tests the invalid-quantity (stock exceeded) path.
"""
import httpx
import random
import string
import sys

BASE = "http://127.0.0.1:8000"


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
    me = client.get("/me").json()
    return me


def register_customer(client, email, password):
    r = client.post(
        "/signup",
        json={"name": "Test Customer", "email": email, "password": password, "role": "customer"},
    )
    r.raise_for_status()
    return r.json()


def add_address(client):
    r = client.post(
        "/addresses/",
        json={
            "street": "123 Test Lane",
            "city": "Dhaka",
            "state": "Dhaka",
            "country": "Bangladesh",
            "postal_code": "1200",
        },
    )
    r.raise_for_status()
    return r.json()


def find_product(client, min_stock=2):
    r = client.get("/products/", params={"limit": 100})
    r.raise_for_status()
    for p in r.json():
        if p.get("stock", 0) >= min_stock and p.get("is_active"):
            return p
    raise RuntimeError("No product with enough stock found")


def main():
    customer_email = f"test_{''.join(random.choices(string.ascii_lowercase, k=8))}@example.com"
    customer_password = "password123"

    print(f"\n1. Registering new customer: {customer_email}")
    with make_client() as c:
        register_customer(c, customer_email, customer_password)
        print("   OK - registered")

    print("\n2. Logging in as customer")
    with make_client() as c:
        me = login(c, customer_email, customer_password)
        print(f"   OK - logged in as {me['role']} {me['email']}")

        print("\n3. Adding shipping address")
        add_address(c)
        print("   OK - address saved")

        product = find_product(c)
        print(f"\n4. Selected product #{product['id']} ({product['name']}) stock={product['stock']} seller={product['seller']['email']}")

        print("\n5. Trying to add quantity exceeding stock (should fail)")
        bad_qty = product["stock"] + 100
        r = c.post(
            "/cart/items",
            json={"product_id": product["id"], "quantity": bad_qty},
        )
        if r.status_code == 400:
            print(f"   OK - got expected 400: {r.json().get('detail')}")
        else:
            print(f"   FAIL - expected 400, got {r.status_code}: {r.text}")
            sys.exit(1)

        print("\n6. Adding valid quantity to cart")
        r = c.post(
            "/cart/items",
            json={"product_id": product["id"], "quantity": 1},
        )
        r.raise_for_status()
        print(f"   OK - cart item {r.json()['id']}")

        print("\n7. Checking out")
        r = c.post("/orders/")
        r.raise_for_status()
        order = r.json()
        print(f"   OK - created order #{order['id']} total={order['total_amount']}")

        print("\n8. Fetching customer order history")
        r = c.get("/orders/")
        r.raise_for_status()
        orders = r.json()
        if any(o["id"] == order["id"] for o in orders):
            print("   OK - order appears in customer history")
        else:
            print("   FAIL - order missing from customer history")
            sys.exit(1)

    seller_email = product["seller"]["email"]
    print(f"\n9. Logging in as seller: {seller_email}")
    with make_client() as c:
        login(c, seller_email, customer_password)
        print("   OK - seller logged in")

        print("\n10. Fetching seller orders")
        r = c.get("/seller/orders")
        r.raise_for_status()
        seller_orders = r.json()
        matching = [o for o in seller_orders if o["id"] == order["id"]]
        if matching:
            print(f"   OK - seller sees order #{order['id']}")
        else:
            print(f"   FAIL - seller does not see order #{order['id']}")
            sys.exit(1)

        print("\n11. Updating order item status to Processing")
        item_id = matching[0]["items"][0]["id"]
        r = c.patch(
            f"/seller/orders/{order['id']}/items/{item_id}",
            json={"status": "Processing"},
        )
        r.raise_for_status()
        updated = r.json()
        print(f"   OK - item status is now {updated['status']}")

    print("\n=== ORDER FLOW TEST PASSED ===\n")


if __name__ == "__main__":
    main()
