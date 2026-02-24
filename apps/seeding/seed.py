import requests
import time
import psycopg
import os
from psycopg.rows import dict_row
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

DATABASE_URL = os.getenv("DATABASE_URL")

def create_session():
    session = requests.Session()
    retries = Retry(total=5, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504], allowed_methods=["GET"])
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("https://", adapter)
    return session

def create_connection():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)

def fetch_products(session: requests.Session, page: int = 1):
    url = "https://world.openfoodfacts.org/cgi/search.pl"
    params = {}
    params["search_simple"] = 1
    params["action"] = "process"
    params["page_size"] = 50
    params["page"] = page
    params["json"] = 1
    params["fields"] = "code,product_name,brands,categories,energy-kcal_100g,fat_100g,carbohydrates_100g,proteins_100g,salt_100g,image_url"

    response = session.get(url, params=params, timeout=(5, 30))
    response.raise_for_status()
    return response.json()

def normalize_product(data):
    return {
        "barcode": data.get("code"),
        "name": data.get("product_name"),
        "image_url": data.get("image_url"),
        "brand": (data.get("brands") or "").split(",")[0].strip(),
        "category": (data.get("categories") or "").split(",")[0].strip(),
        "energy_kcal": data.get("energy-kcal_100g"),
        "fat": data.get("fat_100g"),
        "carbohydrates": data.get("carbohydrates_100g"),
        "proteins": data.get("proteins_100g"),
        "salt": data.get("salt_100g"),
    }

def upsert_brand(cur, name: str):
    if not name:
        name = "Unknown"

    cur.execute(
        """
        INSERT INTO brands (name)
        VALUES (%s)
        ON CONFLICT (name)
        DO UPDATE SET updated_at = NOW()
        RETURNING id;
        """,
        (name,)
    )
    return cur.fetchone()["id"]

def upsert_category(cur, name: str):
    if not name:
        name = "Unknown"

    cur.execute(
        """
        INSERT INTO categories (name)
        VALUES (%s)
        ON CONFLICT (name)
        DO UPDATE SET updated_at = NOW()
        RETURNING id;
        """,
        (name,)
    )
    return cur.fetchone()["id"]

def upsert_product(cur, product, brand_id, category_id):
    cur.execute(
        """
        INSERT INTO products (
            barcode,
            name,
            image_url,
            brand_id,
            category_id,
            energy_kcal,
            fat,
            carbs,
            protein,
            salt
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (barcode)
        DO UPDATE SET
            name = EXCLUDED.name,
            image_url = EXCLUDED.image_url,
            brand_id = EXCLUDED.brand_id,
            category_id = EXCLUDED.category_id,
            energy_kcal = EXCLUDED.energy_kcal,
            fat = EXCLUDED.fat,
            carbs = EXCLUDED.carbs,
            protein = EXCLUDED.protein,
            salt = EXCLUDED.salt,
            updated_at = NOW();
        """,
        (
            product["barcode"],
            product["name"],
            product["image_url"],
            brand_id,
            category_id,
            product["energy_kcal"],
            product["fat"],
            product["carbohydrates"],
            product["proteins"],
            product["salt"],
        ),
    )

def main():
    session = create_session()

    with create_connection() as conn:
        for i in range(1, 11):
            print("Fetching page", i)
            time.sleep(2)  # Be nice to the API
            data = fetch_products(session, page=i)
            products = [normalize_product(p) for p in data.get("products", [])]
            products = [p for p in products if p["barcode"] and p["name"]]

            with conn.cursor() as cur:
                for product in products:
                    brand_id = upsert_brand(cur, product["brand"])
                    category_id = upsert_category(cur, product["category"])
                    upsert_product(cur, product, brand_id, category_id)
            conn.commit()

            print(f"Imported {len(products)} products")

if __name__ == "__main__":
    main()
