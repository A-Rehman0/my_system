window.addEventListener('load', () => {
            // 1. LOADING SCREEN & INITIALIZATION
            setTimeout(() => {
                const loadScreen = document.getElementById('LoadingScreen');
                if (loadScreen) {
                    loadScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadScreen.style.display = 'none';
                        initWeather(); 
                    }, 800);
                }
            }, 400);

            renderShortcuts();
            renderBookmarks();
            loadTodos();
            loadSettings();
            updateClock(); 
            initCanvas();
            initParticles();
            animateParticles();
            
            // Initialize Director Button Listener
            const activateBtn = document.getElementById('btn-activate');
            if (activateBtn) {
                activateBtn.addEventListener('click', () => {
                    activateBtn.classList.add('hidden');
                    Director.init();
                });
            }

            // Bind Panel Buttons
            document.getElementById('todoBtn').addEventListener('click', () => togglePanel('todoPanel'));
            document.getElementById('bookmarkBtn').addEventListener('click', () => togglePanel('bookmarkPanel'));
            document.getElementById('settingsBtn').addEventListener('click', () => togglePanel('settingsPanel'));
            document.getElementById('aiTrigger').addEventListener('click', () => togglePanel('aiPanel'));
            
            // Bind Backdrop
            const backdrop = document.getElementById('backdrop');
            if(backdrop) {
                backdrop.addEventListener('click', () => {
                    document.querySelectorAll('.overlay-panel').forEach(p => p.classList.remove('active'));
                    backdrop.classList.remove('active');
                });
            }
        });

        /**
 * GLOBE.JS
 * Standalone 3D Core Visualizer Module
 */

const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

class CoreVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        
        if (!this.canvas) {
            console.error("Globe.js: Canvas element with ID '" + canvasId + "' not found.");
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.colors = {
            cyan: { r: 0, g: 243, b: 255 },
            alert: { r: 255, g: 0, b: 60 },
            current: { r: 0, g: 243, b: 255 }
        };
        
        this.state = 'IDLE'; 
        this.points = [];
        this.numPoints = 150;
        this.orbRadius = 100;
        this.rings = [];
        this.particles = []; // Initialize particles array here
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetRotateX = 0;
        this.targetRotateY = 0;
        this.rotationY = 0;
        this.rotationX = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Initialize particles immediately
        for(let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                s: Math.random() * 2,
                v: Math.random() * 0.5 + 0.1
            });
        }

        for (let i = 0; i < this.numPoints; i++) {
            // FIX: Added missing closing parenthesis
            const phi = Math.acos(-1 + (2 * i) / this.numPoints); 
            const theta = Math.sqrt(this.numPoints * Math.PI) * phi;
            
            this.points.push({
                x: this.orbRadius * Math.cos(theta) * Math.sin(phi),
                y: this.orbRadius * Math.sin(theta) * Math.sin(phi),
                z: this.orbRadius * Math.cos(phi)
            });
        }
        
        for(let i=0; i<3; i++) {
            this.rings.push({
                radius: this.orbRadius * (1.2 + i * 0.15),
                angle: Math.random() * Math.PI,
                speed: (Math.random() * 0.02 + 0.005) * (i % 2 === 0 ?1 : -1),
                width: 1 + i
            });
        }

        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        const scale = Math.min(this.width, this.height) / 1000;
        this.orbRadius = 90 * scale;
        
        this.points = [];
        for (let i = 0; i < this.numPoints; i++) {
            // FIX: Added missing closing parenthesis
            const phi = Math.acos(-1 + (2 * i) / this.numPoints);
            const theta = Math.sqrt(this.numPoints * Math.PI) * phi;
            this.points.push({
                x: this.orbRadius * Math.cos(theta) * Math.sin(phi),
                y: this.orbRadius * Math.sin(theta) * Math.sin(phi),
                z: this.orbRadius * Math.cos(phi)
            });
        }
    }

    handleMouseMove(e) {
        this.mouseX = (e.clientX / this.width) * 2 - 1;
        this.mouseY = (e.clientY / this.height) * 2 - 1;
    }

    updateColorState() {
        const target = this.state === 'ALERT' ? this.colors.alert : this.colors.cyan;
        this.colors.current.r = lerp(this.colors.current.r, target.r, 0.05);
        this.colors.current.g = lerp(this.colors.current.g, target.g, 0.05);
        this.colors.current.b = lerp(this.colors.current.b, target.b, 0.05);
        
        return `rgb(${Math.round(this.colors.current.r)}, ${Math.round(this.colors.current.g)}, ${Math.round(this.colors.current.b)})`;
    }

    drawGlowingOrb(color, rotationX, rotationY, time) {
        const cx = this.width / 2;
        const cy = this.height * 0.89; 
        const speedMult = this.state === 'PROCESSING' ? 4 : 1;

        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 0.5;
        
        this.points.forEach(p => {
            let x1 = p.x * Math.cos(rotationY * speedMult) - p.z * Math.sin(rotationY * speedMult);
            let z1 = p.z * Math.cos(rotationY * speedMult) + p.x * Math.sin(rotationY * speedMult);
            let y1 = p.y * Math.cos(rotationX) - z1 * Math.sin(rotationX);
            let z2 = z1 * Math.cos(rotationX) + p.y * Math.sin(rotationX);

            p.px = x1 + cx;
            p.py = y1 + cy;
            p.pz = z2;
        });

        this.points.forEach((p, i) => {
            const alpha = (p.pz + this.orbRadius) / (2 * this.orbRadius); 
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.px, p.py, 1.5, 0, Math.PI * 2);
            this.ctx.fill();

            for (let j = i + 1; j < this.points.length; j++) {
                const p2 = this.points[j];
                const dx = p.px - p2.px;
                const dy = p.py - p2.py;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < 45) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.px, p.py);
                    this.ctx.lineTo(p2.px, p2.py);
                    this.ctx.globalAlpha = alpha * 0.3;
                    this.ctx.stroke();
                }
            }
        });
        this.ctx.globalAlpha = 1;

        const grad = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, this.orbRadius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(0.2, color);
        grad.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
        
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, this.orbRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalCompositeOperation = 'source-over';

        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.scale(1, 0.5 + (this.mouseY * 0.1));

        this.rings.forEach(ring => {
            this.ctx.beginPath();
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = ring.width;
            this.ctx.globalAlpha = 0.7;
            this.ctx.setLineDash([20, 40]);
            
            // FIX: Added missing closing parenthesis here
            this.ctx.rotate(ring.angle + (time * 0.001 * ring.speed * speedMult)); 
            this.ctx.ellipse(0, 0, ring.radius, ring.radius, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // FIX: Added missing closing parenthesis here
            this.ctx.rotate(-(ring.angle + (time * 0.001 * ring.speed * speedMult)));
        });
        
        this.ctx.restore();
        this.ctx.globalAlpha = 1;

        const scanY = cy + Math.sin(time * 0.002) * this.orbRadius;
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'white';
        this.ctx.moveTo(cx - this.orbRadius * 1.5, scanY);
        this.ctx.lineTo(cx + this.orbRadius * 1.5, scanY);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    animate(time = 0) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.targetRotateY = this.mouseX * 0.5;
        this.targetRotateX = this.mouseY * 0.2;
        this.rotationY = lerp(this.rotationY, this.targetRotateY, 0.05);
        this.rotationX = lerp(this.rotationX, this.targetRotateX, 0.05);

        const currentColor = this.updateColorState();
        this.drawGlowingOrb(currentColor, this.rotationX, this.rotationY, time);
        this.drawParticles(time, currentColor);
        
        requestAnimationFrame((t) => this.animate(t));
    }

    drawParticles(time, color) {
        this.ctx.fillStyle = color;
        this.particles.forEach(p => {
            p.y -= p.v;
            if(p.y < 0) p.y = this.height;
            
            this.ctx.globalAlpha = Math.random() * 0.5;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.s, 0, Math.PI*2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
}

// Initialize Visualizer
const visualizer = new CoreVisualizer('core-canvas');

        /* -----------------------------------------------------------
           DIRECTOR SYSTEM
        ----------------------------------------------------------- */
        

        /* -----------------------------------------------------------
   DIRECTOR DATA DICTIONARY
   Add/Edit all your tabs, links, and categories here.
----------------------------------------------------------- */
// const DIRECTOR_DATA = {
//     tabs: [
//         {
//             id: 'tab-movies',
//             label: 'MOVIES',
//             type: 'simple-grid',
//             links: [
//                 { name: "HDHub4u", url: "https://hdhub4u.catering/", desc: "HD Movies & Web Series" },
//                 { name: "Tamilrockers", url: "#", desc: "Tamil & Dubbed Movies" },
//                 { name: "Movierulz", url: "#", desc: "Telugu, Tamil, Hindi" },
//                 { name: "Filmyzilla", url: "#", desc: "Bollywood & Hollywood" },
//                 // Add more movies here...
//             ]
//         },
//         {
//             id: 'tab-identity',
//             label: 'IDENTITY',
//             type: 'profile',
//             profile: {
//                 name: "System User",
//                 role: "Admin Level 5",
//                 id: "#8839",
//                 status: "ONLINE",
//                 avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
//             }
//         },
//         {
//             id: 'tab-system',
//             label: 'SYSTEM',
//             type: 'diagnostics',
//             data: { cpu: "34%", mem: "12%", uptime: "4d 12h", ver: "2.4.0" }
//         },
//         {
//             id: 'tab-ai',
//             label: 'AI TOOLS',
//             type: 'category-grid',
//             categories: [
//                 {
//                     title: "1. AI CHAT & WRITING",
//                     desc: "Tools for writing, editing, brainstorming.",
//                     links: [
//                         { name: "ChatGPT", url: "https://chatgpt.com", desc: "Conversational AI" },
//                         { name: "Claude", url: "https://claude.ai", desc: "Safe, helpful assistant" },
//                         { name: "Perplexity", url: "https://perplexity.ai", desc: "AI search engine" },
//                         // Add more AI tools here...
//                     ]
//                 },
//                 {
//                     title: "2. IMAGE GENERATION",
//                     desc: "Create art, logos, and photos.",
//                     links: [
//                         { name: "Midjourney", url: "https://midjourney.com", desc: "High quality art" },
//                         { name: "Stable Diffusion", url: "https://stability.ai", desc: "Open source model" },
//                     ]
//                 }
//                 // Add more categories here...
//             ]
//         }
//     ]
// };

/* -----------------------------------------------------------
   DYNAMIC HTML GENERATOR
----------------------------------------------------------- */
function generateDirectorHTML(data) {
    let navHTML = '<div class="tabs-nav">';
    let contentHTML = '<div class="tab-content">';

    // Generate Tabs
    data.tabs.forEach((tab, index) => {
        const isActive = index === 1 ? 'active' : ''; // Default to IDENTITY
        navHTML += `<button class="tab-btn ${isActive}" data-tab="${tab.id}">${tab.label}</button>`;
        
        contentHTML += `<div id="${tab.id}" class="tab-pane ${isActive}">`;

        // TYPE: SIMPLE GRID (Movies)
        if (tab.type === 'simple-grid') {
            contentHTML += '<div class="ai-grid-tools">';
            tab.links.forEach(link => {
                contentHTML += `
                    <a href="${link.url}" target="_blank" class="universal-card">
                        <div class="card-name">${link.name}</div>
                        <div class="card-role">${link.desc}</div>
                    </a>`;
            });
            contentHTML += '</div>';
        }

        // TYPE: PROFILE (Identity)
        else if (tab.type === 'profile') {
            contentHTML += `
                <div class="profile-card universal-card">
                    <div class="card-avatar">
                        <img src="${tab.profile.avatar}" alt="Avatar">
                    </div>
                    <div class="card-info">
                        <div class="card-name">${tab.profile.name}</div>
                        <div class="card-role">${tab.profile.role}</div>
                        <div class="card-stats">
                            <div class="stat-item">ID: <span>${tab.profile.id}</span></div>
                            <div class="stat-item">Status: <span>${tab.profile.status}</span></div>
                        </div>
                    </div>
                </div>`;
        }

        // TYPE: DIAGNOSTICS (System)
        else if (tab.type === 'diagnostics') {
            contentHTML += `
                <div class="profile-card universal-card">
                    <div class="card-name" style="color:var(--accent-cyan)">SYSTEM DIAGNOSTICS</div>
                    <div class="card-role">RUNNING OPTIMALLY</div>
                    <div style="width:100%; margin-top:20px; text-align:left;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:0.8rem;">
                            <span>CPU LOAD</span> <span>${tab.data.cpu}</span>
                        </div>
                        <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:3px;">
                            <div style="width:${tab.data.cpu}; height:100%; background:var(--accent-cyan); box-shadow:0 0 10px var(--accent-cyan); border-radius:3px;"></div>
                        </div>
                    </div>
                    <div class="card-stats" style="margin-top:20px;">
                        <div class="stat-item">Uptime: <span>${tab.data.uptime}</span></div>
                        <div class="stat-item">Ver: <span>${tab.data.ver}</span></div>
                    </div>
                </div>`;
        }

        // TYPE: CATEGORY GRID (AI Tools)
        else if (tab.type === 'category-grid') {
            contentHTML += '<div class="ai-tools-container" style="width:100%;">';
            tab.categories.forEach(cat => {
                contentHTML += `
                    <div class="ai-category-block">
                        <div class="cat-header">
                            <span class="cat-title">${cat.title}</span>
                            <div class="cat-desc">${cat.desc}</div>
                        </div>
                        <div class="ai-grid-tools">`;
                        
                cat.links.forEach(link => {
                    contentHTML += `
                        <a href="${link.url}" target="_blank" class="universal-card">
                            <div class="card-name">${link.name}</div>
                            <div class="card-role">${link.desc}</div>
                        </a>`;
                });

                contentHTML += `</div></div>`; // End category-block & grid
            });
            contentHTML += '</div>'; // End container
        }

        contentHTML += '</div>'; // End tab-pane
    });

    navHTML += '</div>';
    contentHTML += '</div>';

    return navHTML + contentHTML;
}
 
        /* -----------------------------------------------------------
   DIRECTOR SYSTEM (OPTIMIZED)
----------------------------------------------------------- */
const Director = (function() {
    const els = {
        world: document.getElementById('world-layer'),
        line: document.getElementById('signal-line'),
        assembly: document.getElementById('window-assembly'),
        borders: {
            t: document.getElementById('b-top'),
            b: document.getElementById('b-bottom'),
            l: document.getElementById('b-left'),
            r: document.getElementById('b-right'),
        },
        panel: document.getElementById('window-panel'),
        header: document.getElementById('header'),
        content: document.querySelector('.window-panel .content'), 
        statBox: document.getElementById('stat-box'),
        btn: document.getElementById('btn-confirm')
    };

    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    async function run() {
        if (!els.world || !els.line) return;

        // 1. FLICKER (Faster start)
        await delay(50);
        els.line.style.animation = "flicker 0.15s steps(5) forwards";
        await delay(150);

        // 2. EXPAND LINE (Faster expansion)
        els.line.style.animation = "expandLine 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards";
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        let sparkInterval = setInterval(() => {
            if (window.SparkSystem) {
                window.SparkSystem.emit(centerX, centerY, 2, 1);
                window.SparkSystem.emit(centerX, centerY, 2, -1);
            }
        }, 20);
        
        await delay(250); 
        clearInterval(sparkInterval);

        // 3. TRANSFORMATION (Instant switch)
        els.line.style.transition = "opacity 0.05s";
        els.line.style.opacity = "0";
        if (els.assembly) els.assembly.style.opacity = "1";
        els.world.style.filter = "blur(8px) brightness(0.3)";

        // 4. BORDERS SNAP (Faster duration: 0.2s)
        const dur = "0.2s"; 
        const time = "cubic-bezier(0.2, 1, 0.3, 1)";
        
        if(els.borders.t) els.borders.t.style.animation = `snapTop ${dur} ${time} forwards`;
        if(els.borders.b) els.borders.b.style.animation = `snapBottom ${dur} ${time} forwards`;
        if(els.borders.l) els.borders.l.style.animation = `snapLeft ${dur} ${time} forwards`;
        if(els.borders.r) els.borders.r.style.animation = `snapRight ${dur} ${time} forwards`;
        if(els.borders.t) els.borders.t.style.animation += ", electricHum 0.1s infinite";

        // 5. FILL PANEL (Starts immediately while borders snap)
        await delay(50); // Tiny wait for borders to start moving
        if (els.panel) {
            els.panel.style.transition = "opacity 0.2s ease";
            els.panel.style.opacity = "1";
        }

        // 6. HEADER GLITCH (Faster)
        await delay(150);
        if (els.header) els.header.style.animation = "glitchText 0.2s steps(5) forwards";
        
        // 7. INJECT CONTENT (Using your new Dictionary System)
        await delay(200);
        if (els.content) {
            els.content.innerHTML = generateDirectorHTML(DIRECTOR_DATA);
        }
                
        // 8. BUTTON
        await delay(200);
        if (els.btn) {
            els.btn.style.transition = "opacity 0.2s";
            els.btn.style.opacity = 1;
            els.btn.onclick = closeSystem;
        }
    }

    async function closeSystem() {
        // 1. Fade out content instantly
        if (els.content) els.content.innerHTML = ""; 
        if (els.header) els.header.style.opacity = 0;
        if (els.statBox) els.statBox.style.opacity = 0;
        if (els.btn) els.btn.style.opacity = 0;
        
        // 2. Fade out panel
        if (els.panel) els.panel.style.opacity = 0;

        // 3. Collapse Borders (Fast reverse)
        await delay(100);
        const dur = "0.2s"; 
        if(els.borders.t) els.borders.t.style.animation = `snapTopReverse ${dur} ease-in forwards`;
        if(els.borders.b) els.borders.b.style.animation = `snapBottomReverse ${dur} ease-in forwards`;
        if(els.borders.l) els.borders.l.style.animation = `snapLeftReverse ${dur} ease-in forwards`;
        if(els.borders.r) els.borders.r.style.animation = `snapRightReverse ${dur} ease-in forwards`;

        els.world.style.filter = "blur(0px) brightness(1)";

        // 4. Hide Assembly
        await delay(300);
        if (els.assembly) els.assembly.style.opacity = 0;

        setTimeout(() => {
            if (els.assembly) {
                els.assembly.classList.remove('closing');
                // Reset borders for next time
                Object.values(els.borders).forEach(b => {
                    if(b) b.style.animation = '';
                });
            }
        }, 300);

        const activateBtn = document.getElementById('btn-activate');
        if (activateBtn) activateBtn.classList.remove('hidden');
    }

    return { init: run };
})();
        /* -----------------------------------------------------------
           SPARK SYSTEM
        ----------------------------------------------------------- */
        window.SparkSystem = (function() {
            const canvas = document.createElement('canvas');
            canvas.id = 'sparks';
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '150';
            document.body.appendChild(canvas);
            
            const ctx = canvas.getContext('2d');
            let sparks = [];

            function resize() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            window.addEventListener('resize', resize);
            resize();

            class Spark {
                constructor(x, y, direction) {
                    this.x = x;
                    this.y = y;
                    this.vx = (Math.random() - 0.5) * 8 * direction;
                    this.vy = (Math.random() - 0.5) * 8;
                    this.life = 1.0;
                    this.color = `rgba(200, 255, 255, ${Math.random()})`;
                }
                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.life -= 0.04;
                }
                draw() {
                    ctx.fillStyle = this.color;
                    ctx.globalAlpha = this.life;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, Math.random() * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
            }

            function emit(x, y, count, direction = 0) {
                for(let i=0; i<count; i++) sparks.push(new Spark(x, y, direction));
            }

            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                sparks = sparks.filter(s => s.life > 0);
                sparks.forEach(s => { s.update(); s.draw(); });
                requestAnimationFrame(animate);
            }
            animate();
            return { emit };
        })();

        /* -----------------------------------------------------------
           CLOCK LOGIC
        ----------------------------------------------------------- */
        let is24Hour = false;

        function updateClock() {
            const secHand = document.getElementById('secHand');
            const minHand = document.getElementById('minHand');
            const hourHand = document.getElementById('hourHand');
            const digitalTime = document.getElementById('digitalTime');
            const ampmEl = document.getElementById('ampm');

            if (!secHand || !digitalTime) return; 

            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes();
            const s = now.getSeconds();
            const ms = now.getMilliseconds();

            const sDeg = (s + ms/1000) * 6;
            const mDeg = (m + s/60) * 6;
            const hDeg = (h % 12 + m/60) * 30;
            
            secHand.style.transform = `rotate(${sDeg}deg)`;
            minHand.style.transform = `rotate(${mDeg}deg)`;
            hourHand.style.transform = `rotate(${hDeg}deg)`;

            let displayH = h;
            let ampm = 'AM';
            
            if (!is24Hour) {
                ampm = h >= 12 ? 'PM' : 'AM';
                displayH = h % 12;
                displayH = displayH ? displayH : 12; 
            }
            
            const hStr = displayH < 10 ? '0' + displayH : displayH;
            const mStr = m < 10 ? '0' + m : m;

            digitalTime.textContent = `${hStr}:${mStr}`;
            if(ampmEl) ampmEl.textContent = is24Hour ? '' : ampm;

            requestAnimationFrame(updateClock);
        }

        function setFormat(fmt) {
            is24Hour = (fmt === 24);
            localStorage.setItem('clockFormat', is24Hour);
            const fmt12 = document.getElementById('fmt12');
            const fmt24 = document.getElementById('fmt24');
            
            if (fmt12 && fmt24) {
                fmt12.style.background = is24Hour ? 'rgba(255,255,255,0.05)' : 'var(--primary-dark)';
                fmt24.style.background = !is24Hour ? 'rgba(255,255,255,0.05)' : 'var(--primary-dark)';
            }
        }

        /* -----------------------------------------------------------
           WEATHER LOGIC
        ----------------------------------------------------------- */
        async function initWeather() {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    
                    try {
                        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                        const weatherData = await weatherRes.json();
                        
                        const temp = Math.round(weatherData.current_weather.temperature);
                        const code = weatherData.current_weather.weathercode;
                        
                        const tempEl = document.getElementById('tempDisplay');
                        const condEl = document.getElementById('conditionDisplay');
                        
                        if(tempEl) tempEl.textContent = `${temp}°`;
                        if(condEl) condEl.textContent = getWeatherDesc(code);
                        
                        try {
                            const locRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
                            const locData = await locRes.json();
                            const cityEl = document.getElementById('cityDisplay');
                            if(cityEl) cityEl.textContent = locData.city || locData.locality || "Unknown";
                        } catch (e) {
                            const cityEl = document.getElementById('cityDisplay');
                            if(cityEl) cityEl.textContent = "Detected Location";
                        }

                    } catch (e) {
                        const condEl = document.getElementById('conditionDisplay');
                        if(condEl) condEl.textContent = "Connection Failed";
                    }
                }, () => {
                    const condEl = document.getElementById('conditionDisplay');
                    if(condEl) condEl.textContent = "Location Access Denied";
                });
            }
        }

        function getWeatherDesc(code) {
            if(code === 0) return "CLEAR SKY";
            if(code >= 1 && code <= 3) return "PARTLY CLOUDY";
            if(code >= 45 && code <= 48) return "FOGGY";
            if(code >= 51 && code <= 67) return "RAIN";
            if(code >= 71 && code <= 77) return "SNOW";
            if(code >= 95) return "THUNDERSTORM";
            return "CHAOTIC";
        }

        /* -----------------------------------------------------------
           SEARCH LOGIC
        ----------------------------------------------------------- */
        const searchEngines = {
            google: "https://www.google.com/search?q=",
            duckduckgo: "https://duckduckgo.com/?q=",
            bing: "https://www.bing.com/search?q=",
            youtube: "https://www.youtube.com/results?search_query=",
            brave: "https://search.brave.com/search?q="
        };

        window.addEventListener('load', () => {
            const searchBtn = document.getElementById('searchBtn');
            const searchInput = document.getElementById('searchInput');

            if (!searchBtn || !searchInput) return;

            function executeSearch() {
                const engineEl = document.getElementById('searchEngine');
                const selectedKey = engineEl ? engineEl.value : 'google';
                const url = searchEngines[selectedKey] || searchEngines['google'];
                const query = searchInput ? searchInput.value : '';

                if (query && query.trim() !== "") {
                    window.location.href = url + encodeURIComponent(query);
                }
            }

            searchBtn.addEventListener('click', executeSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') executeSearch();
            });
        });

        /* -----------------------------------------------------------
           PANEL TOGGLE LOGIC
        ----------------------------------------------------------- */
        function togglePanel(id) {
            const panel = document.getElementById(id);
            if(!panel) return;
            
            const isActive = panel.classList.contains('active');
            document.querySelectorAll('.overlay-panel').forEach(p => p.classList.remove('active'));
            const backdrop = document.getElementById('backdrop');
            if(backdrop) backdrop.classList.remove('active');

            if(!isActive) {
                panel.classList.add('active');
                if(backdrop) backdrop.classList.add('active');
            }
        }

        /* -----------------------------------------------------------
           SHORTCUTS
        ----------------------------------------------------------- */
            const defaultShortcuts = [
            { name: 'YouTube', url: 'https://youtube.com', icon: 'Gemini_Generated_Image_4tdw2y4tdw2y4tdw-removebg-preview.png' },
            { name: 'Gmail', url: 'https://mail.google.com', icon: 'Gemini_Generated_Image_e0qc1xe0qc1xe0qc-removebg-preview.png' },
            { name: 'WhatsApp', url: 'https://web.whatsapp.com', icon: 'Gemini_Generated_Image_6hcunh6hcunh6hcu-removebg-preview.png' },
            { name: 'Docs', url: 'https://docs.google.com', icon: 'Gemini_Generated_Image_qbfma3qbfma3qbfm-removebg-preview.png' },
            { name: 'Z.ai', url: 'https://chat.z.ai/', icon: 'Gemini_Generated_Image_huu3ughuu3ughuu3-removebg-preview.png' }
            ];


        function renderShortcuts() {
        const dock = document.querySelector('.shortcuts-dock');
        if (!dock) return;

        dock.innerHTML = '';

        defaultShortcuts.forEach(s => {
            const a = document.createElement('a');
            a.href = s.url;
            a.className = 'shortcut-item';

            a.innerHTML = `
            <div class="icon-box">
                <img src="${s.icon}" alt="${s.name}" class="shortcut-icon">
            </div>
            <span class="shortcut-name">${s.name}</span>
            `;

            dock.appendChild(a);
        });
        }


        /* -----------------------------------------------------------
           TODO LIST
        ----------------------------------------------------------- */
        function loadTodos() {
            const todos = JSON.parse(localStorage.getItem('systemTodos')) || [];
            const list = document.getElementById('todoList');
            if (!list) return;

            list.innerHTML = '';
            todos.forEach((todo, index) => {
                const li = document.createElement('li');
                li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
                li.innerHTML = `<span onclick="toggleTodo(${index})">${todo.text}</span> <span class="delete-task" onclick="deleteTodo(${index})">&times;</span>`;
                list.appendChild(li);
            });
        }
        
        const addTodoBtn = document.getElementById('addTodoBtn');
        if (addTodoBtn) {
            addTodoBtn.addEventListener('click', () => {
                const input = document.getElementById('newTodo');
                if(input && input.value.trim()) {
                    const todos = JSON.parse(localStorage.getItem('systemTodos')) || [];
                    todos.push({ text: input.value, completed: false });
                    localStorage.setItem('systemTodos', JSON.stringify(todos));
                    input.value = '';
                    loadTodos();
                }
            });
        }

        window.toggleTodo = (i) => {
            const todos = JSON.parse(localStorage.getItem('systemTodos')) || [];
            todos[i].completed = !todos[i].completed;
            localStorage.setItem('systemTodos', JSON.stringify(todos));
            loadTodos();
        };
        
        window.deleteTodo = (i) => {
            const todos = JSON.parse(localStorage.getItem('systemTodos')) || [];
            todos.splice(i, 1);
            localStorage.setItem('systemTodos', JSON.stringify(todos));
            loadTodos();
        };

        /* -----------------------------------------------------------
           BOOKMARKS (Simulated)
        ----------------------------------------------------------- */
        function renderBookmarks() {
            const container = document.getElementById('bookmarkContainer');
            if (!container) return;
            
            container.innerHTML = `
                <div class="bookmark-category">
                    <div class="cat-title">Social</div>
                    <a href="https://twitter.com" class="bookmark-link">Twitter / X</a>
                    <a href="https://instagram.com" class="bookmark-link">Instagram</a>
                    <a href="https://reddit.com" class="bookmark-link">Reddit</a>
                </div>
                <div class="bookmark-category">
                    <div class="cat-title">Work</div>
                    <a href="https://github.com" class="bookmark-link">GitHub</a>
                    <a href="https://stackoverflow.com" class="bookmark-link">StackOverflow</a>
                </div>
                <div class="bookmark-category">
                    <div class="cat-title">Entertainment</div>
                    <a href="https://twitch.tv" class="bookmark-link">Twitch</a>
                    <a href="https://netflix.com" class="bookmark-link">Netflix</a>
                </div>
            `;
        }

        /* -----------------------------------------------------------
           USER SETTINGS
        ----------------------------------------------------------- */
        function loadSettings() {
            const savedFormat = localStorage.getItem('clockFormat');
            if(savedFormat === 'true') { 
                setFormat(24);
            } else {
                setFormat(12);
            }
            
            const name = localStorage.getItem('userName');
            const userNameEl = document.getElementById('userName');
            const userNameInput = document.getElementById('userNameInput');
            
            if(name) {
                if(userNameEl) userNameEl.textContent = name;
                if(userNameInput) userNameInput.value = name;
            }

            if (userNameInput) {
                userNameInput.addEventListener('change', (e) => {
                    const newName = e.target.value || 'Hunter';
                    localStorage.setItem('userName', newName);
                    if(userNameEl) userNameEl.textContent = newName;
                });
            }
        }

        /* -----------------------------------------------------------
           BACKGROUND CANVAS PARTICLES
        ----------------------------------------------------------- */
        const bgCanvas = document.getElementById('bg-canvas');
        let ctx, particles = [];

        function initCanvas() {
            if(!bgCanvas) return;
            ctx = bgCanvas.getContext('2d');
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
        }

        function resizeCanvas() {
            if (!bgCanvas) return;
            bgCanvas.width = window.innerWidth;
            bgCanvas.height = window.innerHeight;
        }

        class Particle {
            constructor() {
                this.x = Math.random() * bgCanvas.width;
                this.y = Math.random() * bgCanvas.height;
                this.size = Math.random() * 2;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                this.color = Math.random() > 0.5 ? 'rgba(157, 77, 221,' : 'rgba(0, 242, 255,'; 
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if(this.x < 0 || this.x > bgCanvas.width) this.speedX *= -1;
                if(this.y < 0 || this.y > bgCanvas.height) this.speedY *= -1;
            }
            draw() {
                if (!ctx) return;
                ctx.fillStyle = this.color + '0.8)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            for(let i=0; i<70; i++) particles.push(new Particle());
        }

        function animateParticles() {
            if (!ctx || !bgCanvas) {
                requestAnimationFrame(animateParticles);
                return;
            }
            
            ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            for(let i=0; i<particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                for(let j=i; j<particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    if(distance < 120) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(157, 77, 221, ${0.15 * (1 - distance/120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animateParticles);
        }

        /* -----------------------------------------------------------
           APEX BACKGROUND TOGGLE SYSTEM (Extension Safe)
        ----------------------------------------------------------- */
        
        const bgBtn = document.getElementById('toggleExtBgBtn');
        const mainCanvas = document.getElementById('bg-canvas');
        const threeContainer = document.getElementById('three-container');
        const errorMsg = document.getElementById('bg-error-msg');
        
        let isApexActive = false;
        let animationFrameId;
        let scene, camera, renderer, points;
        let lx = 0.1, ly = 0, lz = 0; 

        const COUNT = 60000;
        const targets = new Float32Array(COUNT * 3);
        
        // Shapes
               // -----------------------------------------------------------
        // COMPLEX 3D SHAPES DICTIONARY
        // -----------------------------------------------------------
                // -----------------------------------------------------------
        // FUTURISTIC 3D SHAPES DATABASE (35+ Forms)
        // -----------------------------------------------------------
        const FORMS = {
            
            // --- MATHEMATICAL CHAOS & ATTRACTORS ---
            // 2. QUANTUM-HELIX NEXUS (Futuristic Data-Structure)
            QUANTUM_NEXUS: (arr) => {
                let x = 0.1, y = 0, z = 0;
                // Base constants
                let a = 0.9, b = 0.7;
                const dt = 0.005; // Higher precision for more detail
                
                for(let i = 0; i < COUNT; i++){
                    // 1. DYNAMIC PARAMETER MODULATION (The shape evolves over time)
                    // Parameters breathe and shift, creating an evolving "tech" feel
                    const evolution = Math.sin(i * 0.0005);
                    const dynamic_a = 0.95 + evolution * 0.1;
                    const dynamic_b = 0.7 - evolution * 0.05;

                    // 2. COMPLEX DIFFERENTIAL EQUATIONS
                    // Mixing standard polynomial chaos with trigonometric "crystalline" folding
                    const dx = (z - dynamic_b) * x - Math.sin(y) * dynamic_a;
                    const dy = x * dynamic_a + (z - dynamic_b) * y - Math.cos(x) * 0.5;
                    const dz = 0.6 + dynamic_b * z - (z * z * z) / 3 
                               - (x * x + y * y) * (1 + evolution * z) 
                               + 0.25 * z * x * x * x;

                    x += dx * dt;
                    y += dy * dt;
                    z += dz * dt;

                    // 3. SPATIAL TRANSFORMATION (Helix Encoding)
                    // Wrap the chaotic attractor around a double-helix lattice
                    const angle = i * 0.05; // Tight twisting
                    const radius = 15 + evolution * 5; // Breathing radius
                    
                    // Offset X and Y to create the double-helix rail system
                    const x_helix = x * 20 + Math.cos(angle) * radius;
                    const y_helix = y * 20 + Math.sin(angle) * radius;
                    
                    // Z acts as the central spine with "noise" from the attractor
                    const z_spine = z * 50;

                    // 4. "GLITCH" INJECTION (Digital Artifacts)
                    // Randomly displace points to create a "holographic noise" effect
                    const glitch = (Math.random() > 0.97) ? Math.random() * 10 : 0;

                    // Output: Mapping the complex 3D structure
                    arr[i*3]   = x_helix + glitch;      // X
                    arr[i*3+1] = y_helix + glitch;      // Y
                    arr[i*3+2] = z_spine - (COUNT*0.25) + i*0.5; // Z (centered vertically)
                }
            },

            // 1. AIZAWA ATTRACTOR (Organic Spiral)
            AIZAWA: (arr) => {
                let x=0.1, y=0, z=0;
                const a=0.95, b=0.7, c=0.6, d=3.5, e=0.25, f=0.1;
                const dt = 0.01;
                for(let i=0; i<COUNT; i++){
                    const dx = (z-b)*x - d*y;
                    const dy = d*x + (z-b)*y;
                    const dz = c + a*z - (z*z*z)/3 - (x*x+y*y)*(1+e*z) + f*z*x*x*x;
                    x+=dx*dt; y+=dy*dt; z+=dz*dt;
                    arr[i*3]=x*50; arr[i*3+1]=y*50; arr[i*3+2]=z*50;
                }
            },

            // 2. THOMAS ATTRACTOR (Cyclic Symmetry)
           // 3. THOMAS CYBERNETIC NEXUS (Self-Weaving Data Tunnel)
            THOMAS_CYBER: (arr) => {
                let x = 1.1, y = 1.1, z = -0.01;
                const dt = 0.04;
                
                for(let i = 0; i < COUNT; i++){
                    // 1. DYNAMIC PARAMETERS (Breathing Effect)
                    // 'b' oscillates, causing the attractor to shift between chaotic and stable states
                    const b = 0.208186 + Math.sin(i * 0.002) * 0.025;

                    // 2. ENHANCED DIFFERENTIAL EQUATIONS
                    // Added cos(z) coupling to dx for sharper, "digital" folding edges
                    const dx = Math.sin(y) - b * x + Math.cos(z) * 0.15;
                    const dy = Math.sin(z) - b * y;
                    const dz = Math.sin(x) - b * z;

                    x += dx * dt;
                    y += dy * dt;
                    z += dz * dt;

                    // 3. SPATIAL TRANSFORMATION (The "Möbius Warp")
                    // We calculate a rotation angle based on the Z-position.
                    // This unwraps the chaotic knot into a long, spiraling "cable" or "wormhole".
                    const twist_angle = z * 0.9;
                    const cosA = Math.cos(twist_angle);
                    const sinA = Math.sin(twist_angle);

                    // Apply rotation to X and Y to create the spiral conduit
                    const x_rot = x * cosA - y * sinA;
                    const y_rot = x * sinA + y * cosA;

                    // 4. RESONANCE MODULATION (Energy Nodes)
                    // Create bulging "rings" along the tunnel to mimic data packets or energy pulses
                    const resonance = 1 + Math.sin(z * 2.5) * 0.3;

                    // 5. VERTICAL STRETCHING
                    // Stretch Z to emphasize the tunnel length and center the structure
                    const z_pos = z * 30; 

                    // Output: A complex, spiraling, resonant structure
                    arr[i*3]   = x_rot * 80 * resonance;
                    arr[i*3+1] = y_rot * 80 * resonance;
                    arr[i*3+2] = z_pos;
                }
            }   ,

            // 3. DADRA ATTRACTOR (Quantum Flux)
                        DADRA_NEXUS: (arr) => {
                let x=1, y=1, z=1;
                // Base Constants
                let a=3, b=2.7, c=1.7, d=2, e=9;
                const dt = 0.004; // Slightly smaller step for detail

                for(let i=0; i<COUNT; i++){
                    // 1. EVOLVING PARAMETERS
                    // 'a' and 'e' fluctuate, causing the topology to shift over time
                    const flux = Math.sin(i * 0.0002); 
                    const dynamic_a = a + flux * 0.5;
                    const dynamic_e = e + flux * 1.5;

                    // 2. ENHANCED EQUATIONS
                    // Added modular folding (mod) or trigonometric distortion
                    // The 'tan' or 'sin' terms create hard edges and digital artifacts
                    const dx = y*z - b*x - c*y + d*z;
                    const dy = dynamic_a*y - x*z + Math.sin(z)*0.1; // Sin coupling
                    const dz = dynamic_e*z - x*y - Math.cos(x)*y*0.5; // Cos coupling

                    x+=dx*dt; 
                    y+=dy*dt; 
                    z+=dz*dt;

                    // 3. STRUCTURAL TRANSFORMATION (The "Tesseract Shift")
                    // Instead of linear scaling, we project the points through a polar transformation
                    // This turns the chaotic cloud into a structured "Vortex Engine"
                    
                    const radius = Math.sqrt(x*x + y*y);
                    const angle = Math.atan2(y, x);
                    
                    // Modulate radius based on Z to create a dynamic funnel shape
                    const warpRadius = radius * (1 + Math.abs(z) * 0.05);
                    
                    // Twist the angle based on the iteration to create a long spiral helix
                    const twist = i * 0.002; 
                    
                    // Calculate final positions
                    const X = warpRadius * Math.cos(angle + twist + z*0.1);
                    const Y = warpRadius * Math.sin(angle + twist + z*0.1);
                    const Z = z * 15; // Stretch height

                    // Output
                    arr[i*3]   = X * 15;
                    arr[i*3+1] = Y * 15;
                    arr[i*3+2] = Z;
                }
            },

            // 4. CHEN ATTRACTOR (Double Scroll)
            CHEN: (arr) => {
                let x=-0.1, y=0.5, z=-0.6;
                const a=40, b=3, c=28;
                const dt=0.002;
                for(let i=0; i<COUNT; i++){
                    const dx = a*(y-x);
                    const dy = (c-a)*x - x*z + c*y;
                    const dz = x*y - b*z;
                    x+=dx*dt; y+=dy*dt; z+=dz*dt;
                    arr[i*3]=x*2; arr[i*3+1]=y*2; arr[i*3+2]=z*2;
                }
            },

            // 5. HALVORSEN ATTRACTOR (Twisted Triangle)
            HALVORSEN: (arr) => {
                let x=-5, y=0, z=0;
                const a=1.89;
                const dt=0.005;
                for(let i=0; i<COUNT; i++){
                    const dx = -a*x - 4*y - 4*z - y*y;
                    const dy = -a*y - 4*z - 4*x - z*z;
                    const dz = -a*z - 4*x - 4*y - x*x;
                    x+=dx*dt; y+=dy*dt; z+=dz*dt;
                    arr[i*3]=x*4; arr[i*3+1]=y*4; arr[i*3+2]=z*4;
                }
            },

            // --- 4D & TOPOLOGICAL ANOMALIES ---

            // 6. TESSERACT (Rotating 4D Hypercube)
            TESSERACT: (arr) => {
                const scale = 100;
                const angle = Date.now() * 0.0001; // Rotating based on time
                const cosA = Math.cos(angle), sinA = Math.sin(angle);
                
                // 16 vertices of a hypercube
                const verts = [];
                for(let i=0; i<16; i++){
                    verts.push([
                        (i&1)?1:-1, (i&2)?1:-1, (i&4)?1:-1, (i&8)?1:-1
                    ]);
                }

                for(let i=0; i<COUNT; i++){
                    // Pick a vertex
                    const v = verts[i % 16];
                    let [x,y,z,w] = v;

                    // Rotate in XW plane
                    const xw = x*cosA - w*sinA;
                    const ww = x*sinA + w*cosA;
                    x=xw; w=ww;

                    // Stereographic projection
                    const dist = 2.5;
                    const proj = 1 / (dist - w);
                    
                    arr[i*3] = x * proj * scale;
                    arr[i*3+1] = y * proj * scale;
                    arr[i*3+2] = z * proj * scale;
                }
            },

            // 7. KLEIN BOTTLE (Topological Surface)
            KLEIN_BOTTLE: (arr) => {
                let idx = 0;
                for(let u=0; u<Math.PI*2; u+=0.05){
                    for(let v=0; v<Math.PI*2; v+=0.1){
                        if(idx >= COUNT) break;
                        const r = 4*(1-Math.cos(u)/2);
                        let x, y, z;
                        if(u < Math.PI){
                            x = 6*Math.cos(u)*(1+Math.sin(u)) + r*Math.cos(u)*Math.cos(v);
                            y = 16*Math.sin(u) + r*Math.sin(u)*Math.cos(v);
                        } else {
                            x = 6*Math.cos(u)*(1+Math.sin(u)) + r*Math.cos(v+Math.PI);
                            y = 16*Math.sin(u);
                        }
                        z = r*Math.sin(v);
                        arr[idx*3]=x*5; arr[idx*3+1]=y*5-50; arr[idx*3+2]=z*5;
                        idx++;
                    }
                }
            },

            // 8. MOBIUS STRIP (Volumetric)
            MOBIUS: (arr) => {
                const radius = 100;
                const width = 40;
                for(let i=0; i<COUNT; i++){
                    const t = (i/COUNT) * Math.PI * 2;
                    const v = (Math.random() - 0.5) * width;
                    const x = (radius + v * Math.cos(t/2)) * Math.cos(t);
                    const y = (radius + v * Math.cos(t/2)) * Math.sin(t);
                    const z = v * Math.sin(t/2);
                    arr[i*3]=x; arr[i*3+1]=y; arr[i*3+2]=z;
                }
            },

            // 9. TREFOIL KNOT (Torus Knot)
            TREFOIL: (arr) => {
                const R = 80, r = 30;
                for(let i=0; i<COUNT; i++){
                    const u = (i/COUNT) * Math.PI * 2 * 3;
                    const v = Math.random() * Math.PI * 2;
                    
                    // Parametric formula for trefoil
                    const x = Math.sin(u) + 2*Math.sin(2*u);
                    const y = Math.cos(u) - 2*Math.cos(2*u);
                    const z = -Math.sin(3*u);
                    
                    arr[i*3]=x*40; arr[i*3+1]=y*40; arr[i*3+2]=z*40;
                }
            },

            // --- SCI-FI STRUCTURES ---

            // 10. DYSON SWARM (Satellite Ring)
            DYSON_SWARM: (arr) => {
                const rings = 30;
                let idx = 0;
                for(let r=0; r<rings; r++){
                    const radius = 50 + r*5;
                    const particles = Math.floor(COUNT/rings);
                    for(let p=0; p<particles; p++){
                        if(idx >= COUNT) break;
                        const angle = (p/particles) * Math.PI * 2;
                        const wobble = Math.sin(angle*10+r) * 10;
                        arr[idx*3] = Math.cos(angle)*radius + wobble;
                        arr[idx*3+1] = Math.sin(angle)*radius + wobble;
                        arr[idx*3+2] = (Math.random()-0.5)*30;
                        idx++;
                    }
                }
            },

            // 11. CYBER TUNNEL (Warp Drive)
            CYBER_TUNNEL: (arr) => {
                const length = 600;
                const radius = 100;
                for(let i=0; i<COUNT; i++){
                    const t = (i/COUNT);
                    const angle = t * Math.PI * 2 * 20; // Tight spiral
                    const z = t * length - length/2;
                    const r = radius * (1 - t*0.5); // Taper
                    arr[i*3] = Math.cos(angle)*r;
                    arr[i*3+1] = Math.sin(angle)*r;
                    arr[i*3+2] = z;
                }
            },

            // 12. NEURAL NETWORK (Nodes & Links)
            NEURAL_NET: (arr) => {
                const nodes = [];
                // Create 50 nodes
                for(let i=0; i<50; i++) nodes.push({
                    x:(Math.random()-0.5)*300,
                    y:(Math.random()-0.5)*300,
                    z:(Math.random()-0.5)*300
                });
                
                for(let i=0; i<COUNT; i++){
                    const n1 = nodes[Math.floor(Math.random()*nodes.length)];
                    const n2 = nodes[Math.floor(Math.random()*nodes.length)];
                    const t = Math.random();
                    // Draw line between nodes
                    arr[i*3] = n1.x + (n2.x-n1.x)*t + (Math.random()-0.5)*5;
                    arr[i*3+1] = n1.y + (n2.y-n1.y)*t + (Math.random()-0.5)*5;
                    arr[i*3+2] = n1.z + (n2.z-n1.z)*t + (Math.random()-0.5)*5;
                }
            },

            // 13. RING WORLD (Halo Array)
            HALO_RING: (arr) => {
                const R = 150;
                const width = 30;
                const depth = 50;
                for(let i=0; i<COUNT; i++){
                    const angle = (i/COUNT) * Math.PI * 2;
                    const w = (Math.random()-0.5) * width;
                    const d = (Math.random()-0.5) * depth;
                    arr[i*3] = Math.cos(angle)*(R+d) + Math.cos(angle+Math.PI/2)*w;
                    arr[i*3+1] = Math.sin(angle)*(R+d) + Math.sin(angle+Math.PI/2)*w;
                    arr[i*3+2] = Math.sin(angle) * depth/2; // Verticality
                }
            },

            // 14. SIERPINSKI TETRAHEDRON (Fractal)
            SIERPINSKI: (arr) => {
                const depth = 6;
                const size = 200;
                const vertices = [
                    {x:0, y:0, z:0},
                    {x:size, y:0, z:0},
                    {x:size/2, y:0, z:size},
                    {x:size/2, y:size, z:size/2}
                ];
                
                // Recursive approximation with random "Chaos Game"
                let x=0, y=0, z=0;
                for(let i=0; i<COUNT; i++){
                    const v = vertices[Math.floor(Math.random()*4)];
                    x = (x + v.x)/2;
                    y = (y + v.y)/2;
                    z = (z + v.z)/2;
                    arr[i*3]=x-100; arr[i*3+1]=y-100; arr[i*3+2]=z-100;
                }
            },

            // 15. JETTISONED DEBRIS (Explosion)
            DEBRIS_FIELD: (arr) => {
                const clusters = 20;
                for(let i=0; i<COUNT; i++){
                    const c = Math.floor(Math.random()*clusters);
                    const spread = 50;
                    const offset = (Math.random()-0.5)*300;
                    const axis = c % 3;
                    arr[i*3] = axis===0 ? offset : (Math.random()-0.5)*spread;
                    arr[i*3+1] = axis===1 ? offset : (Math.random()-0.5)*spread;
                    arr[i*3+2] = axis===2 ? offset : (Math.random()-0.5)*spread;
                }
            },

            // 16. VORTEX ENGINE (Black Hole)
            VORTEX_ENGINE: (arr) => {
                for(let i=0; i<COUNT; i++){
                    const t = (i/COUNT);
                    const angle = t * Math.PI * 2 * 10;
                    const radius = Math.pow(t, 0.5) * 150; // Fast center, slow edge
                    const z = (t - 0.5) * 200; // Elongated
                    
                    arr[i*3] = Math.cos(angle)*radius;
                    arr[i*3+1] = Math.sin(angle)*radius;
                    arr[i*3+2] = z + Math.sin(angle*5)*10; // Rippled
                }
            },

            // 17. PLANETARY GEAR (Mechanical)
            GEAR_SYSTEM: (arr) => {
                const teeth = 12;
                const innerR = 60;
                const outerR = 100;
                
                for(let i=0; i<COUNT; i++){
                    const ring = Math.floor(Math.random() * 3); // 3 layers
                    const t = (i/COUNT);
                    const angle = t * Math.PI * 2 * teeth;
                    
                    const r = ring === 0 ? innerR : outerR;
                    const z = (ring - 1) * 20; // Stack gears
                    
                    // Gear tooth logic
                    const toothAngle = angle % (Math.PI*2/teeth);
                    const toothDepth = (toothAngle < 0.2) ? 20 : 0;
                    
                    arr[i*3] = Math.cos(angle) * (r + toothDepth);
                    arr[i*3+1] = Math.sin(angle) * (r + toothDepth);
                    arr[i*3+2] = z;
                }
            },

            // 18. FRACTAL TREE (Digital Growth)
            FRACTAL_TREE: (arr) => {
                // Simple recursive stack logic
                let stack = [{x:0, y:-150, z:0, angle:-Math.PI/2, length:50, depth:0}];
                let idx = 0;
                
                while(idx < COUNT && stack.length > 0){
                    const node = stack.shift();
                    
                    // Draw this segment
                    for(let k=0; k<10; k++){
                        if(idx >= COUNT) break;
                        const t = k/10;
                        arr[idx*3] = node.x + Math.cos(node.angle)*node.length*t;
                        arr[idx*3+1] = node.y + Math.sin(node.angle)*node.length*t;
                        arr[idx*3+2] = node.z + (Math.random()-0.5)*2;
                        idx++;
                    }
                    
                    // Branch
                    if(node.depth < 5){
                        stack.push({
                            x: node.x + Math.cos(node.angle)*node.length,
                            y: node.y + Math.sin(node.angle)*node.length,
                            z: node.z,
                            angle: node.angle - 0.5 - Math.random()*0.5,
                            length: node.length*0.7,
                            depth: node.depth+1
                        });
                        stack.push({
                            x: node.x + Math.cos(node.angle)*node.length,
                            y: node.y + Math.sin(node.angle)*node.length,
                            z: node.z,
                            angle: node.angle + 0.5 + Math.random()*0.5,
                            length: node.length*0.7,
                            depth: node.depth+1
                        });
                    }
                }
            },

            // 19. SUPERNOVA SHELL
            SUPERNOVA: (arr) => {
                for(let i=0; i<COUNT; i++){
                    const phi = Math.acos(-1 + (2*i)/COUNT);
                    const theta = Math.sqrt(COUNT * Math.PI) * phi;
                    
                    // Disturbance
                    const noise = Math.random() * 20;
                    const r = 100 + noise + Math.sin(phi*10)*10;
                    
                    arr[i*3] = r * Math.cos(theta) * Math.sin(phi);
                    arr[i*3+1] = r * Math.sin(theta) * Math.sin(phi);
                    arr[i*3+2] = r * Math.cos(phi);
                }
            },

            // 20. DNA_DATABASE (Multiple Helixes)
            DNA_CLUSTER: (arr) => {
                for(let i=0; i<COUNT; i++){
                    const which = i % 3; // 3 strands
                    const t = (i/COUNT);
                    const angle = t * Math.PI * 2 * 4 + (which * Math.PI * 2 / 3);
                    const y = (t - 0.5) * 300;
                    const r = 60;
                    
                    arr[i*3] = Math.cos(angle)*r;
                    arr[i*3+1] = y;
                    arr[i*3+2] = Math.sin(angle)*r;
                }
            },

            // --- GEOMETRIC ABSTRACT ---

            // 21. TORUS (Solid)
            TORUS: (arr) => {
                const R=100, r=30;
                for(let i=0; i<COUNT; i++){
                    const u = Math.random() * Math.PI * 2;
                    const v = Math.random() * Math.PI * 2;
                    arr[i*3] = (R+r*Math.cos(v))*Math.cos(u);
                    arr[i*3+1] = (R+r*Math.cos(v))*Math.sin(u);
                    arr[i*3+2] = r*Math.sin(v);
                }
            },

            // 22. CONE_HELIX
            CONE_HELIX: (arr) => {
                const height = 300;
                const turns = 6;
                for(let i=0; i<COUNT; i++){
                    const t = (i/COUNT);
                    const angle = t * Math.PI * 2 * turns;
                    const y = t * height - height/2;
                    const r = t * 80; // Radius grows with height
                    
                    arr[i*3] = Math.cos(angle)*r;
                    arr[i*3+1] = y;
                    arr[i*3+2] = Math.sin(angle)*r;
                }
            },

            // 23. SPHERE_LATTICE (Hollow)
            SPHERE_CAGE: (arr) => {
                const r = 100;
                let idx = 0;
                // Latitude lines
                for(let lat=0; lat<10; lat++){
                    const phi = (lat/10) * Math.PI;
                    const ringR = r * Math.sin(phi);
                    const y = r * Math.cos(phi);
                    for(let p=0; p<COUNT/20; p++){
                        if(idx>=COUNT) break;
                        const theta = (p/(COUNT/20))*Math.PI*2;
                        arr[idx*3] = ringR*Math.cos(theta);
                        arr[idx*3+1] = y;
                        arr[idx*3+2] = ringR*Math.sin(theta);
                        idx++;
                    }
                }
            },

            // 24. HYPER_PARABOLOID
            HYPER_PARABOLOID: (arr) => {
                const size=100;
                for(let i=0; i<COUNT; i++){
                    const x = (Math.random()-0.5)*size;
                    const z = (Math.random()-0.5)*size;
                    // Hyperbolic equation: y = x^2 - z^2
                    const y = (Math.pow(x, 2) - Math.pow(z, 2)) / 50;
                    arr[i*3]=x; arr[i*3+1]=y; arr[i*3+2]=z;
                }
            },

            // 25. CUBE_FRAME
            CUBE_FRAME: (arr) => {
                const s=100;
                // Edges of a cube
                const edges = [
                    [-s,-s,-s], [s,-s,-s], [s,s,-s], [-s,s,-s], // Back face
                    [-s,-s,s], [s,-s,s], [s,s,s], [-s,s,s]      // Front face
                ];
                for(let i=0; i<COUNT; i++){
                    const e = edges[i%8];
                    arr[i*3] = e[0] + (Math.random()-0.5)*20;
                    arr[i*3+1] = e[1] + (Math.random()-0.5)*20;
                    arr[i*3+2] = e[2] + (Math.random()-0.5)*20;
                }
            },

            // 26. CRYSTAL_SHARD
            CRYSTAL: (arr) => {
                for(let i=0; i<COUNT; i++){
                    const h = Math.pow(Math.random(), 2) * 200; // Bias towards bottom
                    const angle = Math.random() * Math.PI * 2;
                    const r = (1 - h/200) * 40; // Taper
                    
                    arr[i*3] = Math.cos(angle)*r;
                    arr[i*3+1] = h - 100;
                    arr[i*3+2] = Math.sin(angle)*r;
                }
            },

            // 27. ASTEROID_BELT
            ASTEROID_BELT: (arr) => {
                const R = 150;
                for(let i=0; i<COUNT; i++){
                    const angle = (i/COUNT) * Math.PI * 2 * 1.2; // Spiral
                    const spread = (Math.random()-0.5) * 60;
                    const z = (Math.random()-0.5) * 20;
                    
                    arr[i*3] = Math.cos(angle) * R + spread;
                    arr[i*3+1] = Math.sin(angle) * R + spread;
                    arr[i*3+2] = z;
                }
            },

            // 28. TORNADO (Particle Swirl)
            TORNADO: (arr) => {
                for(let i=0; i<COUNT; i++){
                    const t = (i/COUNT);
                    const angle = t * Math.PI * 2 * 8;
                    const r = t * 80 + 10; // Widens up
                    const y = t * 300 - 150;
                    
                    arr[i*3] = Math.cos(angle)*r + (Math.random()-0.5)*10;
                    arr[i*3+1] = y;
                    arr[i*3+2] = Math.sin(angle)*r + (Math.random()-0.5)*10;
                }
            },

            // 29. ANTENNA_ARRAY
            ANTENNA_ARRAY: (arr) => {
                const grid = 10;
                const spacing = 20;
                let idx=0;
                for(let x=-grid; x<=grid; x++){
                    for(let z=-grid; z<=grid; z++){
                        if(idx >= COUNT) break;
                        const height = Math.random() * 100;
                        for(let k=0; k<3; k++){ // Make vertical lines
                            arr[idx*3] = x*spacing;
                            arr[idx*3+1] = (k/3)*height - 50;
                            arr[idx*3+2] = z*spacing;
                            idx++;
                        }
                    }
                }
            },

            // 30. QUANTUM_TUNNEL (Ring Sequence)
            QUANTUM_TUNNEL: (arr) => {
                for(let i=0; i<COUNT; i++){
                    const z = (i/COUNT) * 500 - 250;
                    const ring = Math.floor(z/20);
                    const angle = Math.random() * Math.PI * 2;
                    const r = 50 + Math.sin(ring*0.5)*20; // Pulsating radius
                    
                    arr[i*3] = Math.cos(angle)*r;
                    arr[i*3+1] = Math.sin(angle)*r;
                    arr[i*3+2] = z;
                }
            },
            
            // 31. DISRUPTOR_WAVE
            DISRUPTOR: (arr) => {
                for(let i=0; i<COUNT; i++){
                   const x = (Math.random()-0.5)*300;
                   const z = (Math.random()-0.5)*300;
                   const dist = Math.sqrt(x*x+z*z);
                   // Interference pattern
                   const y = Math.sin(dist*0.1) * 20 * Math.exp(-dist*0.01);
                   arr[i*3]=x; arr[i*3+1]=y; arr[i*3+2]=z;
                }
            },
            
            // 32. BIO_CELL (Organic)
            BIO_CELL: (arr) => {
                const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
                for(let i=0; i<COUNT; i++){
                    const y = 1 - (i / (COUNT - 1)) * 2; // y goes from 1 to -1
                    const radius = Math.sqrt(1 - y * y); // radius at y
                    const theta = phi * i; // golden angle increment
                    
                    const r=100 + Math.random()*10;
                    
                    arr[i*3] = Math.cos(theta) * radius * r;
                    arr[i*3+1] = y * r;
                    arr[i*3+2] = Math.sin(theta) * radius * r;
                }
            },

            // 33. SOLAR_FLARE
            SOLAR_FLARE: (arr) => {
                // Core
                for(let i=0; i<COUNT; i++){
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const r = 50 + Math.random() * 10;
                    
                    // Flares
                    if(Math.random() > 0.9) {
                       const flareLength = Math.random() * 100;
                       arr[i*3] = r * Math.cos(theta) * Math.sin(phi) * (1+flareLength/r);
                       arr[i*3+1] = r * Math.sin(theta) * Math.sin(phi) * (1+flareLength/r);
                       arr[i*3+2] = r * Math.cos(phi) * (1+flareLength/r);
                    } else {
                       arr[i*3] = r * Math.cos(theta) * Math.sin(phi);
                       arr[i*3+1] = r * Math.sin(theta) * Math.sin(phi);
                       arr[i*3+2] = r * Math.cos(phi);
                    }
                }
            },

            // 34. TURBINE_ENGINE
            TURBINE: (arr) => {
                const blades = 12;
                for(let i=0; i<COUNT; i++){
                    const blade = i % blades;
                    const t = (i/COUNT);
                    const angle = blade * (Math.PI*2/blades) + t * 0.5; // Twist
                    const r = 20 + t * 80; // Radius
                    const z = (Math.random()-0.5) * 20; // Thickness
                    
                    arr[i*3] = Math.cos(angle)*r;
                    arr[i*3+1] = Math.sin(angle)*r;
                    arr[i*3+2] = z;
                }
            },

            // 35. NULL_VOID (Error Glitch)
            NULL_VOID: (arr) => {
                // Random noise in a box
                for(let i=0; i<COUNT; i++){
                    arr[i*3] = (Math.random()-0.5) * 300;
                    arr[i*3+1] = (Math.random()-0.5) * 300;
                    arr[i*3+2] = (Math.random()-0.5) * 300;
                }
            }
        };

        // -----------------------------------------------------------
        // TRANSITION ENGINE (Fixed & Randomized)
        // -----------------------------------------------------------
        
        
        let currentFormKey = 0;
        const formKeys = Object.keys(FORMS);
        let mouse = new THREE.Vector2();

    function initApexBackground() {
            // 1. CHECK LIBRARY
            if (typeof THREE === 'undefined') {
                console.error("SYSTEM ERROR: THREE.js is not defined.");
                const btn = document.getElementById('toggleExtBgBtn');
                if (btn) {
                    btn.innerText = "ERROR: MISSING LIBRARY";
                    btn.style.borderColor = "red";
                    btn.style.color = "red";
                }
                return;
            }

            try {
                // 2. SETUP SCENE
                scene = new THREE.Scene();
                scene.fog = new THREE.FogExp2(0x000000, 0.002);

                camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
                camera.position.z = 300;

                const threeContainer = document.getElementById('three-container');
                if (!threeContainer) return;

                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(window.devicePixelRatio);
                
                threeContainer.innerHTML = ''; 
                threeContainer.appendChild(renderer.domElement);

                // 3. CREATE PARTICLES
                // Ensure we don't redeclare COUNT if it's already global, 
                // but here we assume it's local to this scope for safety.
                const localCOUNT = 60000; 
                
                const geo = new THREE.BufferGeometry();
                const pos = new Float32Array(localCOUNT * 3);
                const colors = new Float32Array(localCOUNT * 3);

                // Initialize Positions AND Targets to a Sphere
                for (let i = 0; i < localCOUNT; i++) {
                    const mix = Math.random();
                    colors[i * 3] = 0.05;
                    colors[i * 3 + 1] = mix * 0.8;
                    colors[i * 3 + 2] = 1.0;

                    // Initial Shape (Sphere)
                    const r = 120;
                    const phi = Math.acos(-1 + (2 * i) / localCOUNT);
                    const theta = Math.sqrt(localCOUNT * Math.PI) * phi;
                    
                    const x = r * Math.cos(theta) * Math.sin(phi);
                    const y = r * Math.sin(theta) * Math.sin(phi);
                    const z = r * Math.cos(phi);

                    pos[i * 3] = x;
                    pos[i * 3 + 1] = y;
                    pos[i * 3 + 2] = z;

                    // FIX: Initialize Targets so particles don't collapse to 0
                    targets[i * 3] = x;
                    targets[i * 3 + 1] = y;
                    targets[i * 3 + 2] = z;
                }

                geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
                geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

                const mat = new THREE.PointsMaterial({
                    size: 0.8,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.6,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });

                points = new THREE.Points(geo, mat);
                scene.add(points);

                // Start Animation
                animateApex();
                
                // Start Morphing Loop
                window.formInterval = setInterval(morphNextForm, 6000); // Slightly longer interval

                // FIX: Trigger the first morph immediately so user sees action
                setTimeout(morphNextForm, 1000); 

            } catch (error) {
                console.error("WebGL Error:", error);
            }
        }

        function animateApex() {
            if (!isApexActive) return;
            animationFrameId = requestAnimationFrame(animateApex);

            const positions = points.geometry.attributes.position.array;

            for (let i = 0; i < positions.length; i += 3) {
                // Lerp to target
                positions[i] += (targets[i] - positions[i]) * 0.05; // Slower lerp (0.05)
                positions[i + 1] += (targets[i + 1] - positions[i + 1]) * 0.05;
                positions[i + 2] += (targets[i + 2] - positions[i + 2]) * 0.05;

                // Mouse Interaction
                const dx = mouse.x - positions[i];
                const dy = mouse.y - positions[i + 1];
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 100) {
                    positions[i] += dx * 0.02; // Stronger push
                    positions[i + 1] += dy * 0.02;
                }
            }

            points.geometry.attributes.position.needsUpdate = true;
            points.rotation.y += 0.002; // Auto rotate
            renderer.render(scene, camera);
        }

    function morphNextForm() {
            // 1. SAFETY CHECK
            if (!targets || !FORMS) return;

            // 2. EXPLODE (Scatter particles)
            for (let i = 0; i < COUNT * 3; i += 3) {
                targets[i] = (Math.random() - 0.5) * 800;   // Wider explosion
                targets[i + 1] = (Math.random() - 0.5) * 800;
                targets[i + 2] = (Math.random() - 0.5) * 800;
            }

            // 3. WAIT, THEN COALESCE INTO NEW SHAPE
            setTimeout(() => {
                const keys = Object.keys(FORMS);
                const randomKey = keys[Math.floor(Math.random() * keys.length)];

                if (FORMS[randomKey]) {
                    FORMS[randomKey](targets);
                    console.log(`Morphing to: ${randomKey}`);
                }
            }, 600);
        }

        function stopApexBackground() {
            isApexActive = false;
            cancelAnimationFrame(animationFrameId);
            clearInterval(window.formInterval);
            if (renderer) {
                renderer.dispose();
                threeContainer.innerHTML = ''; 
            }
            if (points) {
                points.geometry.dispose();
                points.material.dispose();
            }
        }

        if (bgBtn) {
            bgBtn.addEventListener('click', () => {
                if (!isApexActive) {
                    // Activate
                    isApexActive = true;
                    if(mainCanvas) mainCanvas.style.opacity = "0";
                    
                    threeContainer.style.opacity = "0";
                    threeContainer.style.display = "block";
                    
                    // Small delay to allow display:block to apply before opacity transition
                    setTimeout(() => { threeContainer.style.opacity = "1"; }, 50);

                    initApexBackground();

                    bgBtn.textContent = "DEACTIVATE APEX CORE";
                    bgBtn.style.borderColor = "#ff4444";
                    bgBtn.style.color = "#ff4444";
                    if(errorMsg) errorMsg.style.display = 'none';

                } else {
                    // Deactivate
                    stopApexBackground();
                    
                    if(mainCanvas) {
                        mainCanvas.style.opacity = "1";
                    }
                    
                    threeContainer.style.opacity = "0";
                    setTimeout(() => { threeContainer.style.display = "none"; }, 1000);

                    bgBtn.textContent = "INITIALIZE APEX CORE (3D)";
                    bgBtn.style.borderColor = "";
                    bgBtn.style.color = "";
                    if(errorMsg) errorMsg.style.display = 'none';
                }
            });
        }

        window.addEventListener('resize', () => {
            if(isApexActive && camera && renderer) {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
        });

        window.addEventListener('mousemove', (e) => {
            if(isApexActive) {
                mouse.x = (e.clientX / window.innerWidth - 0.5) * 400;
                mouse.y = -(e.clientY / window.innerHeight - 0.5) * 400;
            }
        });
        /* -----------------------------------------------------------
        TAB SWITCHING LOGIC (Must be Global)
        ----------------------------------------------------------- */
        /* -----------------------------------------------------------
   TAB SWITCHING LOGIC (Global Scope)
   ----------------------------------------------------------- */
      /* -----------------------------------------------------------
           TAB SYSTEM & EVENT DELEGATION (Chrome Extension Safe)
        ----------------------------------------------------------- */

        /**
         * Switches the active tab pane.
         * @param {string} tabId - The ID of the tab pane to show (e.g., 'tab-identity').
         */
        window.switchTab = function(tabId) {
    const allPanes = document.querySelectorAll('.tab-pane');
    const allBtns = document.querySelectorAll('.tab-btn');
    const targetPane = document.getElementById(tabId);
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);

    if (!allPanes.length || !allBtns.length) return;

    // Hide all panes
    allPanes.forEach(pane => {
        pane.classList.remove('active');
        pane.style.display = 'none'; 
    });

    // Deactivate all buttons
    allBtns.forEach(btn => btn.classList.remove('active'));

    // Activate target
    if (targetPane) {
        targetPane.classList.add('active');
        targetPane.style.display = 'flex'; 
        
        if (activeBtn) {
            activeBtn.classList.add('active');
            
            /* AUTO-SCROLL FIX: Scrolls the tab into view if it's off-screen */
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
};

        /**
         * Initializes Tab Listeners using Event Delegation.
         * This is attached to the document, so it works even if HTML 
         * is injected dynamically (like by the Director system).
         */
        function initTabsSystem() {
            document.addEventListener('click', function(e) {
                // Check if the clicked element (or its parent) is a tab button
                const btn = e.target.closest('.tab-btn');
                
                // Only proceed if it's a tab button and inside a tab navigation
                if (btn && btn.closest('.tabs-nav')) {
                    // Prevent default link behavior if any
                    e.preventDefault();
                    
                    // Get the target tab ID from the data attribute
                    const tabId = btn.getAttribute('data-tab');
                    
                    if (tabId) {
                        window.switchTab(tabId);
                    }
                }
            });
        }

        // Initialize the tab listener immediately
        initTabsSystem();

        /* -----------------------------------------------------------
           UPDATE DIRECTOR CONTENT INJECTION
        ----------------------------------------------------------- */
        
        // We need to update the Director.run() content string to use data-tab attributes.
        // Overwrite the 'content' injection part inside the Director object:
        
        if (typeof Director !== 'undefined' && Director.contentInjector) {
            // If you structured Director with an injector method, update it here.
            // However, to ensure this works in your current file structure, 
            // we will modify the `els.content.innerHTML` string directly in the Director logic above.
            // *See the instructions above for the HTML replacement.*
        }

        /* -----------------------------------------------------------
           END OF REPLACEMENT
        ----------------------------------------------------------- */
