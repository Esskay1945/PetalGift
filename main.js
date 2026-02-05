const FLOWERS = [
    { id: 'rose', name: 'Rose', icon: '🌹', hasColors: true },
    { id: 'sunflower', name: 'Sunflower', icon: '🌻' },
    { id: 'lily', name: 'Lily', icon: '🪻' },
    { id: 'tulip', name: 'Tulip', icon: '🌷' },
    { id: 'cherry_blossom', name: 'Sakura', icon: '🌸' },
    { id: 'lavender', name: 'Lavender', icon: '🌿' },
    { id: 'daisy', name: 'Daisy', icon: '🌼' },
    { id: 'hibiscus', name: 'Hibiscus', icon: '🌺' },
    { id: 'orchid', name: 'Orchid', icon: '🪷' },
    { id: 'cactus', name: 'Cactus', icon: '🌵' },
    { id: 'leaf', name: 'Maple', icon: '🍁' },
    { id: 'clover', name: 'Clover', icon: '🍀' }
];

let state = {
    selectedFlower: 'rose',
    selectedColor: 'red',
    view: 'dashboard'
};

// DOM Elements
const flowerGrid = document.getElementById('flower-grid');
const roseOptions = document.getElementById('rose-options');
const colorBtns = document.querySelectorAll('.color-btn');
const generateBtn = document.getElementById('generate-btn');
const linkDisplay = document.getElementById('link-display');
const shareUrlInput = document.getElementById('share-url');
const copyBtn = document.getElementById('copy-btn');
const dashboard = document.getElementById('dashboard');
const viewer = document.getElementById('viewer');

// Initialize Dashboard
function initDashboard() {
    flowerGrid.innerHTML = FLOWERS.map(f => `
        <div class="flower-card ${f.id === state.selectedFlower ? 'active' : ''}" data-id="${f.id}">
            <span class="flower-icon">${f.icon}</span>
            <span class="flower-name">${f.name}</span>
        </div>
    `).join('');

    // Flower Selection
    flowerGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.flower-card');
        if (!card) return;

        document.querySelectorAll('.flower-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        state.selectedFlower = card.dataset.id;

        if (state.selectedFlower === 'rose') {
            roseOptions.classList.remove('hidden');
        } else {
            roseOptions.classList.add('hidden');
        }

        linkDisplay.classList.add('hidden');
    });

    // Color Selection
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.selectedColor = btn.dataset.color;
            linkDisplay.classList.add('hidden');
        });
    });

    // Generate Link
    generateBtn.addEventListener('click', () => {
        const url = new URL(window.location.href);
        url.searchParams.set('f', state.selectedFlower);
        if (state.selectedFlower === 'rose') {
            url.searchParams.set('c', state.selectedColor);
        } else {
            url.searchParams.delete('c');
        }

        shareUrlInput.value = url.toString();
        linkDisplay.classList.remove('hidden');
    });

    // Copy Link
    copyBtn.addEventListener('click', () => {
        shareUrlInput.select();
        document.execCommand('copy');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = 'Copy Link';
        }, 2000);
    });
}

// Check for URL Parameters
function checkParams() {
    const params = new URLSearchParams(window.location.search);
    const flower = params.get('f');
    const color = params.get('c');

    if (flower) {
        state.selectedFlower = flower;
        state.selectedColor = color || 'red';
        showViewer();
    } else {
        showDashboard();
    }
}

function showViewer() {
    state.view = 'viewer';
    dashboard.classList.add('hidden');
    viewer.classList.remove('hidden');

    // Initialize animation engine
    if (window.initFlowerEngine) {
        window.initFlowerEngine(state.selectedFlower, state.selectedColor);
    }
}

function showDashboard() {
    state.view = 'dashboard';
    dashboard.classList.remove('hidden');
    viewer.classList.add('hidden');

    // Clear URL without reloading
    window.history.pushState({}, '', window.location.pathname);
    initDashboard();
}

// Start app
checkParams();
