// JavaScript for JoeSushiBar

document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initSmoothScroll();
    initAnimations();
    initHeroCarousel(); // Carousel Init
    initAccordion();    // Accordion Init

    // Cart Initialization
    initCartSystem();
});

function initAccordion() {
    const headers = document.querySelectorAll('.accordion-header');

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isActive = item.classList.contains('active');

            // Optional: Close others
            // document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));

            if (isActive) {
                item.classList.remove('active');
            } else {
                item.classList.add('active');
            }
        });
    });
}

function initHeroCarousel() {
    const track = document.getElementById('hero-carousel-track');
    if (!track) return;

    const slides = Array.from(track.children);
    if (slides.length === 0) return;

    let index = 0;

    setInterval(() => {
        index++;
        if (index >= slides.length) {
            index = 0;
        }
        const width = slides[0].getBoundingClientRect().width;
        track.style.transform = `translateX(-${index * width}px)`;
    }, 4000); // 4 seconds
}

// --- Cart System --- //
const cartState = {
    // 1. Initialize from LocalStorage
    items: JSON.parse(localStorage.getItem('joeSushiCart')) || [],
    isOpen: false
};

// Helper to save cart
function saveCart() {
    localStorage.setItem('joeSushiCart', JSON.stringify(cartState.items));
}

function initCartSystem() {
    const cartBtn = document.getElementById('cart-btn');
    const closeBtn = document.getElementById('close-cart');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartSidebar = document.getElementById('cart-sidebar');
    const addToCartBtns = document.querySelectorAll('.add-btn');

    if (!cartBtn) return; // Guard clause for pages without cart (like success page)

    // 2. Initial UI Update (restore saved state)
    updateCartUI();

    // Toggle Cart
    function toggleCart() {
        cartState.isOpen = !cartState.isOpen;
        if (cartState.isOpen) {
            cartSidebar.classList.add('open');
            cartOverlay.classList.add('open');
        } else {
            cartSidebar.classList.remove('open');
            cartOverlay.classList.remove('open');
        }
    }

    cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleCart();
    });

    closeBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);

    // Add to Cart Logic
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            // Get product data first
            const card = this.closest('.product-card');
            const title = card.querySelector('h3').innerText;
            const priceStr = card.querySelector('.price').innerText;

            // Robust price parsing: remove everything that isn't a digit or comma, then replace comma with dot
            const priceClean = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
            const price = parseFloat(priceClean);

            // Add item
            addItemToCart({ title, price });
            // 3. Save after adding
            saveCart();
        });
    });

}

function addItemToCart(product) {
    const existingItem = cartState.items.find(item => item.title === product.title);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartState.items.push({
            ...product,
            quantity: 1
        });
    }

    updateCartUI();
}

function removeItemFromCart(title) {
    cartState.items = cartState.items.filter(item => item.title !== title);
    updateCartUI();
}

function updateQuantity(title, change) {
    const item = cartState.items.find(item => item.title === title);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        removeItemFromCart(title);
    } else {
        updateCartUI();
    }
}

// Function to sync buttons on the main page with cart state
function updateProductButtons() {
    const cards = document.querySelectorAll('.product-card');

    cards.forEach(card => {
        const title = card.querySelector('h3').innerText;
        const btn = card.querySelector('.add-btn');
        const item = cartState.items.find(i => i.title === title);

        if (item) {
            // Item is in cart - Show Quantity with persistent style
            btn.innerHTML = `<span style="font-weight:bold; font-size:1.1rem;">${item.quantity}</span>`;
            btn.style.background = '#4ECDC4';
            btn.style.color = '#fff';
            btn.style.border = 'none';
        } else {
            // Item not in cart - Show Plus Icon
            btn.innerHTML = `<svg style="width:20px;height:20px;fill:currentColor" viewBox="0 0 24 24"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>`;
            btn.style.background = ''; // Revert to CSS default (transparent/rgba)
            btn.style.color = '';
            btn.style.border = '';
        }
    });
}

function updateCartUI() {
    // Save state on every UI update to ensure persistence
    saveCart();

    const cartContainer = document.getElementById('cart-items-container');
    const cartCountBadge = document.getElementById('cart-count');
    const cartTotalPrice = document.getElementById('cart-total-price');

    // Update Badge
    const totalCount = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadge.innerText = totalCount;
    cartCountBadge.style.visibility = totalCount > 0 ? 'visible' : 'hidden';

    // Update Product Buttons on Page (Sync)
    updateProductButtons();

    // Update List
    cartContainer.innerHTML = '';

    if (cartState.items.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart-msg">Seu carrinho está vazio 🍣</div>';
        cartTotalPrice.innerText = 'R$ 0,00';
        return;
    }

    let total = 0;

    cartState.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item';
        cartItemEl.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="window.updateCartQty('${item.title}', -1)">-</button>
                    <span class="qty-val">${item.quantity}</span>
                    <button class="qty-btn" onclick="window.updateCartQty('${item.title}', 1)">+</button>
                </div>
            </div>
            <div class="item-total-remove">
                <span style="font-weight:bold; color: #fff;">R$ ${itemTotal.toFixed(2).replace('.', ',')}</span>
                <button class="remove-item" onclick="window.removeCartItem('${item.title}')">Remover</button>
            </div>
        `;
        cartContainer.appendChild(cartItemEl);
    });

    cartTotalPrice.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    document.getElementById('cart-subtotal').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;

    // Trigger recalculation of total with delivery
    if (window.calculateDelivery) {
        window.calculateTotalWithDelivery();
    }
}

// Expose helper functions to window for onclick events
window.updateCartQty = function (title, change) {
    updateQuantity(title, change);
};

window.removeCartItem = function (title) {
    removeItemFromCart(title);
};

// --- End Cart System --- //

function updateDeliveryUI() {
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;
    const deliveryInfo = document.getElementById('delivery-info');

    if (deliveryType === 'delivery') {
        deliveryInfo.style.display = 'flex';
    } else {
        deliveryInfo.style.display = 'none';
        document.getElementById('delivery-fee').innerText = 'R$ 0,00';
    }
    calculateTotalWithDelivery();
}

// --- Address-Based Delivery Calculation (Real Google Maps + Mock Fallback) ---
function initMap() {
    console.log("Google Maps API loaded");
    // If the DOM isn't ready yet (API can call the callback before DOMContentLoaded), wait for it
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            try { initAutocomplete(); } catch (e) { console.warn('initAutocomplete failed after DOM load', e); }
        });
    } else {
        try { initAutocomplete(); } catch (e) { console.warn('initAutocomplete failed', e); }
    }
}

// Expose initMap to window to ensure the API callback finds it
window.initMap = initMap;

function initAutocomplete() {
    const input = document.getElementById("address-input");
    if (!input || typeof google === 'undefined' || !google.maps || !google.maps.places) return;

    const autocomplete = new google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: "br" }, // Restrict to Brazil
        fields: ["formatted_address", "geometry"],
        types: ["address"],
    });

    // Bias to Campo Grande, MS (approximate bounds)
    const southWest = new google.maps.LatLng(-20.55, -54.7);
    const northEast = new google.maps.LatLng(-20.35, -54.5);
    const bounds = new google.maps.LatLngBounds(southWest, northEast);
    autocomplete.setBounds(bounds);

    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            // User entered name of a Place that was not suggested and pressed the Enter key, or the Place Details request failed.
            // fallback to manual calculation
            calculateDeliveryFromAddress();
            return;
        }
        // Auto-calculate when address is selected
        calculateDeliveryFromAddress();
    });
}

// --- Helpers for Async Pattern ---
const getDistanceMatrixAsync = (service, request) => {
    return new Promise((resolve, reject) => {
        service.getDistanceMatrix(request, (response, status) => {
            if (status === 'OK') resolve(response);
            else reject(new Error('Maps API Status: ' + status));
        });
    });
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function calculateDeliveryFromAddress() {
    const addressInput = document.getElementById('address-input').value;
    if (!addressInput) {
        // Visual feedback instead of alert
        const input = document.getElementById('address-input');
        input.style.border = "2px solid #ff6b6b";
        input.placeholder = "Digite um endereço...";
        input.focus();
        setTimeout(() => input.style.border = "", 3000);
        return;
    }

    const calcBtn = document.getElementById('calc-delivery-btn');
    calcBtn.innerText = 'Calculando...';

    // Helper to run mock in async style
    const runFallback = async () => {
        console.warn("Switching to Mock Logic.");
        await delay(1000); // Async delay
        const mockDist = (Math.random() * 10 + 2).toFixed(1);
        const fee = 5 + (mockDist * 1.5);
        // travel minutes estimate (mock): base 10min + factor per km
        const travelMinutes = Math.round(10 + (mockDist * 3));
        // Combine with production time range
        const combinedMin = CONFIG_RESTAURANTE.tempoProducaoMin + travelMinutes;
        const combinedMax = CONFIG_RESTAURANTE.tempoProducaoMax + travelMinutes;
        const timeText = `${combinedMin} - ${combinedMax} min (Produção + Entrega)`;
        updateDeliveryDisplay(mockDist, fee, timeText);
        calcBtn.innerText = 'Recalcular';
    };

    try {
        // Check availability
        if (typeof google === 'undefined' || !google.maps || !google.maps.DistanceMatrixService) {
            throw new Error('Google Maps API not loaded');
        }

        const service = new google.maps.DistanceMatrixService();
        const request = {
            origins: ['R. Bahia, 1503 - Monte Castelo, Campo Grande - MS'],
            destinations: [addressInput],
            travelMode: 'DRIVING',
            unitSystem: google.maps.UnitSystem.METRIC
        };

        // Async Race: Real API vs 2s Timeout
        // This stops the "infinite loading" properly
        const response = await Promise.race([
            getDistanceMatrixAsync(service, request),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);

        const result = response.rows[0].elements[0];
        if (result.status === 'OK') {
            const distanceValue = result.distance.value / 1000; // Meters to KM
            const fee = 5 + (distanceValue * 1.5);
            // Compute travel time in minutes from Duration (value is in seconds)
            const travelMinutes = Math.ceil(result.duration.value / 60);
            const combinedMin = CONFIG_RESTAURANTE.tempoProducaoMin + travelMinutes;
            const combinedMax = CONFIG_RESTAURANTE.tempoProducaoMax + travelMinutes;
            const timeText = `${combinedMin} - ${combinedMax} min (Produção + Entrega)`;
            updateDeliveryDisplay(distanceValue.toFixed(1), fee, timeText);
            calcBtn.innerText = 'Recalcular';
        } else {
            throw new Error('Address not found in Matrix');
        }

    } catch (error) {
        console.warn("Delivery Calculation Error:", error.message);
        await runFallback();
    }
}

function updateDeliveryDisplay(km, fee, time) {
    document.getElementById('delivery-info').style.display = 'flex';
    document.getElementById('calc-result').style.display = 'flex';

    document.getElementById('distance-input').value = km;
    document.getElementById('calc-dist').innerText = `${km} km (de Rua Bahia, 1503)`;
    document.getElementById('delivery-fee').innerText = `R$ ${fee.toFixed(2).replace('.', ',')}`;
    // 'time' is a preformatted string like '65 - 105 min (Produção + Entrega)'
    document.getElementById('estimated-time').innerText = time;

    calculateTotalWithDelivery();
}

function calculateTotalWithDelivery() {
    const subtotalText = document.getElementById('cart-subtotal').innerText;
    // Robustly parse the subtotal
    const subtotal = parseFloat(subtotalText.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

    const deliveryTypeInput = document.querySelector('input[name="deliveryType"]:checked');
    const deliveryType = deliveryTypeInput ? deliveryTypeInput.value : 'pickup';

    let fee = 0;

    if (deliveryType === 'delivery') {
        const feeText = document.getElementById('delivery-fee').innerText;
        // Robustly parse the fee calculated previously
        fee = parseFloat(feeText.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    }

    const total = subtotal + fee;
    document.getElementById('cart-total-price').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;


    // Minimum Order Logic (R$ 25.00)
    const minOrderMsg = document.getElementById('min-order-msg');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (subtotal < 25) {
        minOrderMsg.style.display = 'block';
        checkoutBtn.style.opacity = '0.5';
        checkoutBtn.style.pointerEvents = 'none';
        checkoutBtn.innerText = `Mínimo R$ 25,00`;
    } else {
        minOrderMsg.style.display = 'none';
        checkoutBtn.style.opacity = '1';
        checkoutBtn.style.pointerEvents = 'auto';
        checkoutBtn.innerText = 'Finalizar Pedido';
    }
}

// Expose delivery functions to window
window.updateDeliveryUI = updateDeliveryUI;
window.calculateDeliveryFromAddress = calculateDeliveryFromAddress;

function finalizeOrder() {
    const minOrderMsg = document.getElementById('min-order-msg');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Double check minimum order logic just in case
    const subtotalText = document.getElementById('cart-subtotal').innerText;
    const subtotal = parseFloat(subtotalText.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0;

    if (subtotal < 25) {
        alert("O pedido mínimo é de R$ 25,00");
        return;
    }

    // Redirect to success page
    window.location.href = 'order-success.html';
}

// Attach event listener if not using inline onclick
document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'checkout-btn') {
        finalizeOrder();
    }
});


function initHeaderScroll() {
    const header = document.querySelector('header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            e.preventDefault();

            // Update active state in nav
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            if (this.classList.contains('nav-item')) {
                this.classList.add('active');
            }

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initAnimations() {
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const elementsToAnimate = document.querySelectorAll('.product-card, .loyalty-card');

    elementsToAnimate.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });
}
// 1. Defina os dados fixos do seu restaurante
const CONFIG_RESTAURANTE = {
    endereco: "Rua Bahia, 1503, Campo Grande, MS", // Endereço de partida
    precoBase: 5.00,  // Valor mínimo da entrega
    valorPorKm: 2.00,  // Quanto cobra por cada km rodado
    // Tempo de produção (preparo) em minutos — pode ser um intervalo
    tempoProducaoMin: 40,
    tempoProducaoMax: 80
};

async function calcularEntrega() {
    // Pega o endereço que o cliente digitou no input
    const enderecoCliente = document.getElementById('input-endereco').value;

    if (!enderecoCliente) {
        alert("Por favor, digite um endereço!");
        return;
    }

    // 2. Cria o serviço de matriz de distância
    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
        {
            origins: [CONFIG_RESTAURANTE.endereco],
            destinations: [enderecoCliente],
            travelMode: 'DRIVING', // Modo de condução (carro/moto)
            unitSystem: google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
            if (status === "OK") {
                const resultado = response.rows[0].elements[0];

                if (resultado.status === "OK") {
                    // 3. Extrai a distância em KM
                    const distanciaKm = resultado.distance.value / 1000;
                    
                    // 4. Calcula o valor final
                    const valorTotal = CONFIG_RESTAURANTE.precoBase + (distanciaKm * CONFIG_RESTAURANTE.valorPorKm);

                    // 5. Exibe na tela
                    document.getElementById('resultado-frete').innerHTML = `
                        Distância: ${distanciaKm.toFixed(1)} km <br>
                        <strong>Taxa de Entrega: R$ ${valorTotal.toFixed(2)}</strong>
                    `;
                } else {
                    alert("Endereço não encontrado ou rota impossível.");
                }
            } else {
                console.error("Erro na API: " + status);
            }
        }
    );
}
