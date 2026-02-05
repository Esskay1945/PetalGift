/**
 * Flower Engine - Procedural Growth Animation (Refined)
 */

const canvas = document.getElementById('flower-canvas');
const ctx = canvas.getContext('2d');

let flowers = [];
let currentFlowerType = 'rose';
let currentFlowerColor = 'red';
let animationId;
let scaleFactor = 1; // Global scale factor for mobile responsiveness

const COLOR_MAP = {
    red: { light: '#ff4d4d', main: '#ff0000', dark: '#a00000' },
    pink: { light: '#ff99cc', main: '#ff3399', dark: '#cc0066' },
    white: { light: '#ffffff', main: '#ffffff', dark: '#ffdce5' },
    sunflower: { light: '#ffffbf', main: '#ffeb3b', dark: '#fbc02d' },
    lily: { light: '#f3e5f5', main: '#e1bee7', dark: '#ba68c8' },
    tulip: { light: '#ff9e9e', main: '#ff5252', dark: '#d32f2f' },
    cherry_blossom: { light: '#ffffff', main: '#ffdbec', dark: '#f8bbd0' },
    lavender: { light: '#e8eaff', main: '#c5cae9', dark: '#9fa8da' },
    daisy: { light: '#ffffff', main: '#ffffef', dark: '#fff9c4' },
    hibiscus: { light: '#ff80ab', main: '#ff4081', dark: '#f50057' },
    orchid: { light: '#f8bbd0', main: '#f06292', dark: '#e91e63' },
    cactus: { light: '#e8f5e9', main: '#81c784', dark: '#4caf50' },
    leaf: { light: '#ffccbc', main: '#ff8a65', dark: '#e64a19' },
    clover: { light: '#c8e6c9', main: '#66bb6a', dark: '#388e3c' }
};

let particles = [];

class Flower {
    constructor(x, y, type, color) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color;
        this.palette = COLOR_MAP[type] || COLOR_MAP[color] || COLOR_MAP['red'];

        this.stems = [];
        this.petals = [];
        this.leaves = [];
        this.bloomProgress = 0;
        this.growthState = 'stem'; // stem, bud, bloom
        this.age = 0;
        this.done = false;

        // Physics / Sway
        this.swayOffset = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.005 + Math.random() * 0.005;
        this.windMagnifier = 1;

        // Physics / Sway
        this.swayOffset = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.005 + Math.random() * 0.005;
        this.windMagnifier = 1;

        // Caching
        this.bloomCanvas = null;

        this.init();
    }

    init() {
        const stemCount = this.type === 'lavender' ? 3 : 1;
        for (let i = 0; i < stemCount; i++) {
            this.stems.push({
                points: [{ x: this.x, y: canvas.height }],
                angle: -Math.PI / 2 + (Math.random() - 0.5) * 0.2,
                maxLength: (canvas.height - this.y) * (0.9 + Math.random() * 0.2),
                width: (5 + Math.random() * 2) * scaleFactor,
                growthSpeed: (1.5 + Math.random() * 1.5) * scaleFactor,
                sway: 0,
                segments: 0
            });
        }
    }

    update() {
        this.age++;

        if (this.growthState === 'stem') {
            let allStemsDone = true;
            this.stems.forEach(stem => {
                const lastPoint = stem.points[stem.points.length - 1];
                const currentDist = Math.sqrt(Math.pow(lastPoint.x - this.x, 2) + Math.pow(lastPoint.y - canvas.height, 2));

                if (currentDist < stem.maxLength) {
                    allStemsDone = false;
                    const nextX = lastPoint.x + Math.cos(stem.angle) * stem.growthSpeed;
                    const nextY = lastPoint.y + Math.sin(stem.angle) * stem.growthSpeed;

                    stem.angle += (Math.random() - 0.5) * 0.05;
                    stem.points.push({ x: nextX, y: nextY });
                    stem.segments++;

                    if (Math.random() < 0.2) {
                        particles.push(new Particle(nextX, nextY, 'rgba(255, 255, 255, 0.4)'));
                    }

                    // Add organic leaves (Reduced density)
                    if (Math.random() < 0.02 && stem.segments > 20) {
                        this.leaves.push({
                            pIdx: stem.points.length - 1,
                            side: Math.random() < 0.5 ? 1 : -1,
                            size: 0,
                            maxSize: (30 + Math.random() * 30) * scaleFactor, // Scaled leaves
                            angle: (Math.random() - 0.5) * 0.8,
                            phase: Math.random() * Math.PI * 2,
                            petioleLength: (8 + Math.random() * 10) * scaleFactor
                        });
                    }
                }
            });

            if (allStemsDone) {
                this.growthState = 'bud';
                this.initBloom();
            }
        } else if (this.growthState === 'bud' || this.growthState === 'bloom') {
            this.bloomProgress += 0.01; // Slightly faster bloom for responsiveness
            if (this.bloomProgress >= 1) {
                this.bloomProgress = 1;
                this.growthState = 'bloom';
                if (!this.done) {
                    this.done = true;
                    this.cacheBloom(); // Bake the complex head into an image
                }
            }

            if (!this.done) {
                this.petals.forEach(p => {
                    const targetSize = p.baseMaxSize * (0.2 + this.bloomProgress * 0.8);
                    if (p.size < targetSize) p.size += (targetSize - p.size) * 0.1;
                    p.angleOffset = Math.sin(this.bloomProgress * Math.PI - p.layer * 0.2) * 0.2;
                });
            }
        }

        this.leaves.forEach(l => {
            if (l.size < l.maxSize) l.size += 0.5;
        });
    }

    // Optimization: Cache the expensive flower head into a small canvas
    cacheBloom() {
        const size = 200 * scaleFactor; // Scaled buffer
        this.bloomCanvas = document.createElement('canvas');
        this.bloomCanvas.width = size;
        this.bloomCanvas.height = size;
        const bCtx = this.bloomCanvas.getContext('2d');

        // Draw centered in the cache canvas
        bCtx.translate(size / 2, size / 2);

        // Sort petals by layer
        const sortedPetals = [...this.petals].sort((a, b) => b.layer - a.layer);

        sortedPetals.forEach(p => {
            bCtx.save();
            bCtx.rotate(p.angle + p.angleOffset); // Static rotation in cache

            // Realistic Shading
            const pGrad = bCtx.createRadialGradient(0, 0, 0, 0, 0, p.size * 1.5);
            pGrad.addColorStop(0, this.palette.light);
            pGrad.addColorStop(0.4, this.palette.main);
            pGrad.addColorStop(1, this.palette.dark);

            bCtx.fillStyle = pGrad;
            bCtx.shadowBlur = 10;
            bCtx.shadowColor = 'rgba(0,0,0,0.2)';

            // Complex Petal Shape
            bCtx.beginPath();
            const s = p.size;
            const c = p.curve;

            bCtx.moveTo(0, 0);
            bCtx.bezierCurveTo(-s * 0.4, s * c, s * 1.4, s * c, s, 0);
            bCtx.bezierCurveTo(s * 1.4, -s * c, -s * 0.4, -s * c, 0, 0);
            bCtx.fill();

            // SOLID WHITE BORDER (Fix)
            bCtx.strokeStyle = '#ffffff';
            bCtx.lineWidth = 1;
            bCtx.stroke();

            bCtx.restore();
        });

        // Center glow
        const centerGlow = bCtx.createRadialGradient(0, 0, 0, 0, 0, 15);
        centerGlow.addColorStop(0, 'rgba(255,255,255,0.6)');
        centerGlow.addColorStop(1, 'rgba(255,255,255,0)');
        bCtx.fillStyle = centerGlow;
        bCtx.beginPath();
        bCtx.arc(0, 0, 15, 0, Math.PI * 2);
        bCtx.fill();
    }

    initBloom() {
        const tip = this.stems[0].points[this.stems[0].points.length - 1];
        if (this.type === 'rose') {
            // High fidelity rose petal layers
            const layers = [
                { count: 8, size: 50, radius: 2, curve: 0.8 },
                { count: 7, size: 45, radius: 5, curve: 0.9 },
                { count: 6, size: 38, radius: 8, curve: 1.0 },
                { count: 5, size: 30, radius: 10, curve: 1.1 },
                { count: 3, size: 20, radius: 12, curve: 1.2 }
            ];

            layers.forEach((layer, lIdx) => {
                for (let i = 0; i < layer.count; i++) {
                    const baseAngle = (i / layer.count) * Math.PI * 2 + (lIdx * 0.5);
                    this.petals.push({
                        angle: baseAngle,
                        angleOffset: 0,
                        size: 0,
                        baseMaxSize: (layer.size + Math.random() * 10) * scaleFactor,
                        layer: lIdx,
                        radius: layer.radius,
                        curve: layer.curve,
                        vOffset: (Math.random() - 0.5) * 5,
                        randomSeed: Math.random()
                    });
                }
            });
        } else {
            // Generic fallback for other types
            const count = 12;
            for (let i = 0; i < count; i++) {
                this.petals.push({
                    angle: (i / count) * Math.PI * 2,
                    angleOffset: 0,
                    size: 0,
                    baseMaxSize: (40 + Math.random() * 10) * scaleFactor,
                    layer: 0,
                    radius: 5,
                    curve: 1.0,
                    vOffset: 0,
                    randomSeed: Math.random()
                });
            }
        }
    }

    draw() {
        const time = Date.now() * 0.001;
        const tip = this.stems[0].points[this.stems[0].points.length - 1];

        // 1. Draw Stem with gradient
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        this.stems.forEach(stem => {
            const stemGrad = ctx.createLinearGradient(this.x, canvas.height, tip.x, tip.y);
            stemGrad.addColorStop(0, '#1a3311');
            stemGrad.addColorStop(1, '#2d5a27');
            ctx.strokeStyle = stemGrad;
            ctx.lineWidth = stem.width;

            ctx.beginPath();
            ctx.moveTo(stem.points[0].x, stem.points[0].y);
            stem.points.forEach((p, i) => {
                const factor = i / stem.points.length;
                const swayX = Math.sin(time + this.swayOffset + factor * 2) * (factor * 10);
                ctx.lineTo(p.x + swayX, p.y);
            });
            ctx.stroke();
        });

        // 2. Draw Leaves
        this.leaves.forEach(leaf => {
            const p = this.stems[0].points[leaf.pIdx];
            if (!p) return;
            const factor = leaf.pIdx / this.stems[0].points.length;
            const lx = p.x + Math.sin(time + this.swayOffset + factor * 2) * (factor * 10);
            const ly = p.y;

            ctx.save();
            ctx.translate(lx, ly);

            // Calculate direction for petiole
            const leafAngle = leaf.side * (Math.PI / 3 + leaf.angle) + Math.sin(time * 2 + leaf.phase) * 0.1;
            ctx.rotate(leafAngle);

            // Draw Petiole (small connecting stem)
            ctx.strokeStyle = '#2d5a27';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(leaf.petioleLength * (leaf.size / leaf.maxSize), 0);
            ctx.stroke();

            // Move to end of petiole to draw leaf blade
            ctx.translate(leaf.petioleLength * (leaf.size / leaf.maxSize), 0);

            const lGrad = ctx.createLinearGradient(0, 0, leaf.size, 0);
            lGrad.addColorStop(0, '#2d5a27');
            lGrad.addColorStop(1, '#4caf50');
            ctx.fillStyle = lGrad;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(leaf.size * 0.3, -leaf.size * 0.5, leaf.size * 0.7, -leaf.size * 0.5, leaf.size, 0);
            ctx.bezierCurveTo(leaf.size * 0.7, leaf.size * 0.5, leaf.size * 0.3, leaf.size * 0.5, 0, 0);
            ctx.fill();

            // Leaf veins
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(leaf.size * 0.8, 0);
            ctx.stroke();

            ctx.restore();
        });

        // 3. Draw Bloom (Dynamic or Cached)
        if (this.growthState !== 'stem') {
            const bloomX = tip.x + Math.sin(time + this.swayOffset + 2) * 10;
            const bloomY = tip.y;

            // If we have a cached bloom, use it for performance
            if (this.done && this.bloomCanvas) {
                ctx.save();
                ctx.translate(bloomX, bloomY);
                // Rotate with sway
                ctx.rotate(Math.sin(time + this.swayOffset) * 0.05);
                ctx.drawImage(this.bloomCanvas, -this.bloomCanvas.width / 2, -this.bloomCanvas.height / 2);
                ctx.restore();
            } else {
                // ... Otherwise render procedurally (growing phase) ...

                // Sort petals by layer
                const sortedPetals = [...this.petals].sort((a, b) => b.layer - a.layer);

                sortedPetals.forEach(p => {
                    ctx.save();
                    ctx.translate(bloomX, bloomY);
                    ctx.rotate(p.angle + p.angleOffset + Math.sin(time + this.swayOffset) * 0.05);

                    // Authentic Shading
                    const pGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 1.5);
                    pGrad.addColorStop(0, this.palette.light);
                    pGrad.addColorStop(0.4, this.palette.main);
                    pGrad.addColorStop(1, this.palette.dark);

                    ctx.fillStyle = pGrad;

                    // Complex Petal Shape
                    ctx.beginPath();
                    const s = p.size;
                    const c = p.curve;

                    ctx.moveTo(0, 0);
                    ctx.bezierCurveTo(-s * 0.4, s * c, s * 1.4, s * c, s, 0);
                    ctx.bezierCurveTo(s * 1.4, -s * c, -s * 0.4, -s * c, 0, 0);
                    ctx.fill();

                    ctx.restore();
                });
            }
        }
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 3 * scaleFactor;
        this.vy = -(Math.random() * 3 + 1) * scaleFactor;
        this.life = 1.0;
        this.color = Math.random() < 0.5 ? '#ff75a0' : '#ffffff';
        this.size = (Math.random() * 3 + 1) * scaleFactor;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.015;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Soft glow for particles
        ctx.shadowBlur = 5;
        ctx.shadowColor = this.color;
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Calculate scale factor based on width
    // Base width is 1000px. If screen is smaller, we scale down.
    // We limit scaling to not be too tiny (min 0.6)
    scaleFactor = Math.min(1, Math.max(0.6, window.innerWidth / 1000));

    // No need to clear cache, but could potentially resize cache if needed, 
    // but fixed size 200 is usually fine for this aesthetic.
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Performance: Filter particles
    particles = particles.filter(p => p.life > 0);
    if (particles.length > 50) particles = particles.slice(0, 50);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    flowers.forEach(f => {
        f.update();
        f.draw();
    });

    animationId = requestAnimationFrame(animate);
}

window.initFlowerEngine = (type, color) => {
    currentFlowerType = type;
    currentFlowerColor = color;
    flowers = [];
    resize();
    if (!animationId) animate();
};

window.addEventListener('resize', resize);

canvas.addEventListener('mousedown', (e) => {
    flowers.push(new Flower(e.clientX, e.clientY, currentFlowerType, currentFlowerColor));
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    flowers.push(new Flower(touch.clientX, touch.clientY, currentFlowerType, currentFlowerColor));
}, { passive: false });
