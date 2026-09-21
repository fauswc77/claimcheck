from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests


# ======================================================
# CREATE FASTAPI APPLICATION
# ======================================================

app = FastAPI(
    title="ClaimCheck API",
    description="Food marketing claim verification backend",
    version="1.0.0"
)


# ======================================================
# CORS
# ======================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================================================
# ROOT
# ======================================================

@app.get("/")
def root():

    return {
        "message": "ClaimCheck API is running"
    }


# ======================================================
# HEALTH CHECK
# ======================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "service": "ClaimCheck API"
    }


# ======================================================
# GET PRODUCT FROM OPEN FOOD FACTS
# ======================================================

# ======================================================
# GET PRODUCT FROM OPEN FOOD FACTS
# ======================================================

# ======================================================
# GET PRODUCT FROM OPEN FOOD FACTS
# ======================================================

@app.get("/product/{barcode}")
def get_product(barcode: str):

    url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"

    headers = {
        "User-Agent": "ClaimCheck/1.0 (SIH Project)"
    }

    try:
        response = requests.get(
            url,
            headers=headers,
            timeout=15
        )

    except requests.RequestException as error:
        raise HTTPException(
            status_code=503,
            detail=f"Could not connect to Open Food Facts: {error}"
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Open Food Facts returned HTTP {response.status_code}"
        )

    data = response.json()

    if data.get("status") != 1:
        raise HTTPException(
            status_code=404,
            detail=f"No product found for barcode {barcode}."
        )

    product = data.get("product", {})
    nutriments = product.get("nutriments", {})

    result = {
        "barcode": barcode,

        "product_name": (
            product.get("product_name")
            or "Unknown product"
        ),

        "brand": (
            product.get("brands")
            or "Unknown brand"
        ),

        "ingredients": (
            product.get("ingredients_text")
            or "Not available"
        ),

        "labels": (
            product.get("labels")
            or "Not available"
        ),

        "categories": (
            product.get("categories")
            or "Not available"
        ),

        "serving_size": (
            product.get("serving_size")
            or "Not available"
        ),

        "quantity": (
            product.get("quantity")
            or "Not available"
        ),

        "nutrition": {
            "energy_kcal": nutriments.get("energy-kcal_100g"),
            "fat_g": nutriments.get("fat_100g"),
            "saturated_fat_g": nutriments.get("saturated-fat_100g"),
            "carbohydrates_g": nutriments.get("carbohydrates_100g"),
            "sugars_g": nutriments.get("sugars_100g"),
            "fiber_g": nutriments.get("fiber_100g"),
            "proteins_g": nutriments.get("proteins_100g"),
            "salt_g": nutriments.get("salt_100g"),
            "sodium_mg": (
    nutriments.get("sodium_100g") * 1000
    if nutriments.get("sodium_100g") is not None
    else None
)
        },

        "source": {
            "name": "Open Food Facts",
            "url": url
        }
    }

    return result
# ======================================================
# CLAIM VERIFICATION ENGINE
# ======================================================

@app.post("/check")
def check_claim(barcode: str, claim: str):

    # --------------------------------------------------
    # 1. Get product data
    # --------------------------------------------------

    url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"

    headers = {
        "User-Agent": "ClaimCheck/1.0 (SIH Project)"
    }

    try:
        response = requests.get(
            url,
            headers=headers,
            timeout=15
        )

    except requests.RequestException as error:
        raise HTTPException(
            status_code=503,
            detail=f"Could not connect to Open Food Facts: {error}"
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Open Food Facts returned HTTP {response.status_code}"
        )

    data = response.json()

    if data.get("status") != 1:
        raise HTTPException(
            status_code=404,
            detail=f"No product found for barcode {barcode}."
        )

    product = data.get("product", {})
    nutriments = product.get("nutriments", {})

    # --------------------------------------------------
    # 2. Extract product facts
    # --------------------------------------------------

    product_name = (
        product.get("product_name")
        or "Unknown product"
    )

    ingredients = (
        product.get("ingredients_text")
        or ""
    ).lower()

    labels = (
        product.get("labels")
        or ""
    ).lower()

    sugars = nutriments.get("sugars_100g")

    # --------------------------------------------------
    # 3. Normalize claim
    # --------------------------------------------------

    normalized_claim = claim.strip().lower()

    # --------------------------------------------------
    # 4. Default result
    # --------------------------------------------------

    status = "INCONCLUSIVE"
    confidence = 0.50
    evidence = []
    explanation = (
        "ClaimCheck does not have enough validated "
        "evidence to determine this claim."
    )
    category = "unknown"

    # --------------------------------------------------
    # 5. NO ADDED SUGAR RULE
    # --------------------------------------------------

    if (
        "no added sugar" in normalized_claim
        or "no added sugars" in normalized_claim
    ):

        category = "sugar"

        # Sugar explicitly appears in ingredients
        if "sugar" in ingredients:

            status = "CONTRADICTED"
            confidence = 0.95

            evidence = [
                f"Ingredient information contains: sugar",
                f"Sugars: {sugars} g / 100 g"
            ]

            explanation = (
                'The claim "No Added Sugar" conflicts with '
                "the available ingredient information because "
                "sugar is listed as an ingredient."
            )

        else:

            status = "INCONCLUSIVE"
            confidence = 0.60

            evidence = [
                "Sugar was not found in the available "
                "ingredient text.",
                f"Sugars: {sugars} g / 100 g"
            ]

            explanation = (
                "The available ingredient information does "
                "not show sugar, but this alone is not enough "
                "to conclusively validate a No Added Sugar claim."
            )

    # --------------------------------------------------
    # 6. Return verification result
    # --------------------------------------------------

    return {
        "barcode": barcode,
        "product_name": product_name,

        "claim": claim,
        "category": category,

        "status": status,

        "confidence": confidence,

        "evidence": evidence,

        "explanation": explanation,

        "product_facts": {
            "ingredients": product.get("ingredients_text")
                or "Not available",

            "sugars_g_per_100g": sugars,

            "labels": product.get("labels")
                or "Not available"
        }
    }