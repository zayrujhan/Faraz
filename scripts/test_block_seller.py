import httpx

BASE = "http://127.0.0.1:8000"
ADMIN = {"username": "admin@example.com", "password": "password123"}


def login(client, email, password):
    r = client.post(
        "/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    r.raise_for_status()
    client.headers["Authorization"] = f"Bearer {r.json()['access_token']}"


def main():
    with httpx.Client(base_url=BASE) as c:
        login(c, ADMIN["username"], ADMIN["password"])
        sellers = [u for u in c.get("/users/").json() if u["role"] == "seller"]
        seller = sellers[0]
        print(f"Seller {seller['email']} active={seller['is_active']}")

        c.put(f"/users/{seller['id']}", json={"is_active": False})
        print(f"Blocked seller {seller['id']}")

        r = c.post(
            "/login",
            data={"username": seller["email"], "password": ADMIN["password"]},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        print(f"Blocked login: {r.status_code} {r.text}")
        assert r.status_code == 403, "Blocked seller should get 403"

        c.put(f"/users/{seller['id']}", json={"is_active": True})
        r = c.post(
            "/login",
            data={"username": seller["email"], "password": ADMIN["password"]},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        print(f"Unblocked login: {r.status_code}")
        r.raise_for_status()

    print("Block/unblock test passed.")


if __name__ == "__main__":
    main()
