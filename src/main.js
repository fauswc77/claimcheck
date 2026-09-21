import './style.css';

const app = document.querySelector('#app');


// ======================================================
// DEMO PRODUCT DATA
// ======================================================

const demoProduct = {
    name: "Mixed Berry Juice",
    brand: "ClaimCheck Demo",
    serving: "100 ml",

    nutrition: {
        sugar: "18 g",
        fat: "0.2 g",
        sodium: "12 mg",
        protein: "0.4 g"
    },

    claims: [
        {
            claim: "No Added Sugar",
            category: "Sugar",
            status: "CONTRADICTED",
            confidence: 91,

            evidence: [
                "Sugar: 18 g / 100 ml",
                "Available ingredient information indicates added sweetener"
            ],

            explanation:
                'The available product information conflicts with the "No Added Sugar" claim.'
        },

        {
            claim: "Natural",
            category: "Naturalness",
            status: "INCONCLUSIVE",
            confidence: 64,

            evidence: [
                "No validated criterion available for this claim"
            ],

            explanation:
                'ClaimCheck could not find enough validated evidence to determine whether this claim is supported.'
        }
    ]
};


// ======================================================
// INITIAL PAGE
// ======================================================

app.innerHTML = `

    <main class="app">

        <!-- NAVIGATION -->

        <nav class="navbar">

            <div class="logo">

                <span class="logo-mark">
                    C
                </span>

                <span class="logo-text">
                    ClaimCheck
                </span>

            </div>


            <div class="nav-links">

                <a href="#how-it-works">
                    How it works
                </a>

                <a href="#about">
                    About
                </a>

            </div>

        </nav>


        <!-- HERO -->

        <section class="hero">

            <div class="hero-content">

                <div class="hero-badge">
                    CLAIM ≠ FACT
                </div>


                <h1>

                    Does the claim

                    <span>
                        match the facts?
                    </span>

                </h1>


                <p class="hero-description">

                    ClaimCheck compares what food packaging claims
                    with the product data available behind the label.

                </p>


                <div class="hero-actions">

                    <button
                        id="scan-btn"
                        class="primary-btn"
                    >
                        Scan Product
                    </button>


                    <button
                        id="demo-btn"
                        class="secondary-btn"
                    >
                        Try Demo
                    </button>

                </div>

            </div>

        </section>


        <!-- REPORT -->

        <section
            class="demo-section"
            id="demo"
        >

            <div class="section-heading">

                <p class="eyebrow">
                    CLAIMCHECK ANALYSIS
                </p>

                <h2>
                    Product verification
                </h2>

            </div>


            <div id="report-container">

                <div class="product-card">

                    <div class="result-area">

                        <p class="claim-label">
                            READY
                        </p>

                        <h3>
                            Try the demo
                        </h3>

                        <p class="product-meta">
                            ClaimCheck will analyze an example
                            product and show you how verification works.
                        </p>

                    </div>

                </div>

            </div>

        </section>


        <!-- HOW IT WORKS -->

        <section
            class="how-section"
            id="how-it-works"
        >

            <div class="section-heading">

                <p class="eyebrow">
                    HOW IT WORKS
                </p>

                <h2>
                    Claim → Evidence → Explanation
                </h2>

            </div>


            <div class="steps">

                <div class="step">

                    <span>
                        01
                    </span>

                    <h3>
                        Extract
                    </h3>

                    <p>
                        Identify marketing claims and product
                        facts from available product information.
                    </p>

                </div>


                <div class="step">

                    <span>
                        02
                    </span>

                    <h3>
                        Verify
                    </h3>

                    <p>
                        Compare the claim with nutrition,
                        ingredients and applicable rules.
                    </p>

                </div>


                <div class="step">

                    <span>
                        03
                    </span>

                    <h3>
                        Explain
                    </h3>

                    <p>
                        Show the evidence and reasoning behind
                        the result instead of giving a black-box score.
                    </p>

                </div>

            </div>

        </section>


        <!-- FOOTER -->

        <footer id="about">

            <div class="logo">

                <span class="logo-mark">
                    C
                </span>

                <span class="logo-text">
                    ClaimCheck
                </span>

            </div>


            <p>
                The front of the pack sells.
                The back of the pack tells.
            </p>

        </footer>

    </main>

`;


// ======================================================
// GET ELEMENTS
// ======================================================

const demoButton = document.querySelector('#demo-btn');

const scanButton = document.querySelector('#scan-btn');

const reportContainer =
    document.querySelector('#report-container');


// ======================================================
// TRY DEMO
// ======================================================

demoButton.addEventListener('click', () => {

    // Scroll to report
    reportContainer.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });


    // Show loading state

    reportContainer.innerHTML = `

        <div class="product-card">

            <div class="result-area">

                <p class="claim-label">
                    ANALYZING
                </p>

                <h3>
                    Checking product claims...
                </h3>

                <p class="product-meta">
                    Extracting claims and comparing available evidence.
                </p>

            </div>

        </div>

    `;


    // Simulate analysis

    setTimeout(() => {

        renderReport(demoProduct);

    }, 1200);

});


// ======================================================
// SCAN BUTTON
// ======================================================

scanButton.addEventListener('click', async () => {

    // Ask the user for a barcode
    const barcode = prompt(
        'Enter the product barcode:'
    );

    // User pressed Cancel
    if (!barcode) {
        return;
    }

    // Remove accidental spaces
    const cleanBarcode = barcode.trim();

    // Basic barcode validation
    if (!/^\d{8,14}$/.test(cleanBarcode)) {
        alert('Please enter a valid barcode (8–14 digits).');
        return;
    }

    // Show loading state
    reportContainer.innerHTML = `
        <div class="analyzing-state">
            <p>Fetching product information...</p>
        </div>
    `;

    reportContainer.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });

    try {

        // Call our FastAPI backend
        const response = await fetch(
            `http://localhost:8000/product/${cleanBarcode}`
        );

        const data = await response.json();

        // Backend returned an error
        if (!response.ok) {
            throw new Error(
                data.detail || 'Product could not be found.'
            );
        }

        // Convert API data into the format
        // our existing report UI expects

        // Verify a real marketing claim
        const claimResponse = await fetch(
            `http://localhost:8000/check?barcode=${cleanBarcode}&claim=${encodeURIComponent("No Added Sugar")}`,
            {
                method: "POST"
            }
        );

        const claimData = await claimResponse.json();

        if (!claimResponse.ok) {
            throw new Error(
                claimData.detail || "Claim verification failed."
            );
        }

        // Prepare claim result for the frontend
        const claims = [
            {
                claim: claimData.claim,
                category: claimData.category,
                status: claimData.status,
                confidence: Math.round(
                    claimData.confidence * 100
                ),
                evidence: claimData.evidence,
                explanation: claimData.explanation
            }
        ];

        // Build the final product object
        const product = {

            name: data.product_name,

            brand: data.brand,

            serving: data.serving_size,

            nutrition: {

                sugar: data.nutrition.sugars_g != null
                    ? `${data.nutrition.sugars_g} g`
                    : 'N/A',

                fat: data.nutrition.fat_g != null
                    ? `${data.nutrition.fat_g} g`
                    : 'N/A',

                sodium: data.nutrition.sodium_mg != null
                    ? `${data.nutrition.sodium_mg} mg`
                    : 'N/A',

                protein: data.nutrition.proteins_g != null
                    ? `${data.nutrition.proteins_g} g`
                    : 'N/A'
            },

            claims: claims
        };
        // Display the real product
        renderReport(product);

    } catch (error) {

        console.error('ClaimCheck error:', error);

        reportContainer.innerHTML = `
            <div class="analyzing-state">
                <p>Could not retrieve this product.</p>
                <p>${error.message}</p>
            </div>
        `;
    }

});


// ======================================================
// RENDER REPORT
// ======================================================

function renderReport(product) {

    const claimsHTML = product.claims
        .map(claim => createClaimCard(claim))
        .join('');


    reportContainer.innerHTML = `

        <div class="product-card">

            <!-- PRODUCT HEADER -->

            <div class="product-info">

                <div class="product-image">
                    FOOD
                </div>


                <div>

                    <p class="product-label">
                        PRODUCT
                    </p>

                    <h3>
                        ${product.name}
                    </h3>

                    <p class="product-meta">
                        ${product.brand} · ${product.serving}
                    </p>

                </div>

            </div>


            <!-- NUTRITION -->

            <div class="result-area">

                <p class="claim-label">
                    NUTRITION CONTEXT
                </p>


                <div class="evidence-grid">

                    <div>

                        <span>
                            Sugar
                        </span>

                        <strong>
                            ${product.nutrition.sugar}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Fat
                        </span>

                        <strong>
                            ${product.nutrition.fat}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Sodium
                        </span>

                        <strong>
                            ${product.nutrition.sodium}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Protein
                        </span>

                        <strong>
                            ${product.nutrition.protein}
                        </strong>

                    </div>

                </div>

            </div>


            <!-- CLAIMS -->

            <div class="result-area">

                <p class="claim-label">
                    CLAIMS CHECKED
                </p>


                <div class="claims-list">

                    ${claimsHTML}

                </div>

            </div>

        </div>

    `;

}


// ======================================================
// CREATE CLAIM CARD
// ======================================================

function createClaimCard(claim) {

    const statusClass =
        claim.status.toLowerCase();


    const evidenceHTML =
        claim.evidence
            .map(item => `<li>${item}</li>`)
            .join('');


    return `

        <article class="claim-card">

            <div class="claim-card-header">

                <div>

                    <p class="claim-label">
                        ${claim.category}
                    </p>

                    <h3>
                        "${claim.claim}"
                    </h3>

                </div>


                <span class="status ${statusClass}">
                    ${claim.status}
                </span>

            </div>


            <div class="claim-confidence">

                <span>
                    Verification confidence
                </span>

                <strong>
                    ${claim.confidence}%
                </strong>

            </div>


            <div class="claim-evidence">

                <p class="claim-label">
                    AVAILABLE EVIDENCE
                </p>

                <ul>
                    ${evidenceHTML}
                </ul>

            </div>


            <div class="explanation">

                <strong>
                    Why?
                </strong>

                <p>
                    ${claim.explanation}
                </p>

            </div>

        </article>

    `;

}