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
        const FORMS = {
    
        // 1. DYSON SWARM (Dense Orbital Shell)
    // Thousands of particles orbiting in perfect latitude/longitude rings.
    // Looks like a futuristic shield generator or planetary defense grid.
    DYSON_SWARM: (arr) => {
        const rings = 40; // Number of latitude bands
        const radius = 100;
        
        let idx = 0;
        for(let ring=0; ring<rings; ring++) {
            const phi = (ring / rings) * Math.PI; // 0 to PI
            const particlesPerRing = Math.floor(COUNT / rings);
            
            // Calculate radius of this specific ring (Sphere slicing)
            const ringRadius = radius * Math.sin(phi);
            const y = radius * Math.cos(phi);

            for(let p=0; p<particlesPerRing; p++) {
                if(idx >= COUNT) break;
                const theta = (p / particlesPerRing) * Math.PI * 2;
                
                // Create the ring
                arr[idx*3] = ringRadius * Math.cos(theta);
                arr[idx*3+1] = y;
                arr[idx*3+2] = ringRadius * Math.sin(theta);
                
                // Add slight "tech jitter" for a digital feel
                arr[idx*3] += (Math.random()-0.5)*2;
                arr[idx*3+2] += (Math.random()-0.5)*2;
                
                idx++;
            }
        }
    },

    // 2. VORTEX GRID (Hyperbolic Cylinder)
    // A grid surface that wraps around itself, creating a twisted vortex.
    // Looks like a time-tunnel or a warp engine.
    VORTEX_GRID: (arr) => {
        const height = 400;
        const turns = 5;
        
        for(let i=0; i<COUNT; i++) {
            // Height position (Y)
            const t = (i / COUNT); // 0 to 1
            const y = (t - 0.5) * height;
            
            // Angle based on height (spiral)
            const angle = t * Math.PI * 2 * turns;
            
            // Hyperbolic Expansion: Radius gets larger at ends
            const r = 50 + Math.pow(t * 2 - 1, 2) * 100;
            
            // Create a grid effect: Snap angle to integers
            const gridSnap = Math.floor(angle * 10) / 10;
            
            // Multiple lines: Snap radius to create "ribs"
            const ribSnap = Math.floor(r / 10) * 10;

            arr[i*3] = Math.cos(gridSnap) * ribSnap;
            arr[i*3+1] = y;
            arr[i*3+2] = Math.sin(gridSnap) * ribSnap;
        }
    },

    // 3. NEURAL MATRIX (3D Lattice Network)
    // Nodes connected by thick strands, forming a cubic brain-like structure.
    // Looks like an AI core or a server room visualization.
    NEURAL_MATRIX: (arr) => {
        const gridSize = 20;
        const limit = 100;
        
        for(let x = -limit; x <= limit; x += gridSize) {
            for(let y = -limit; y <= limit; y += gridSize) {
                for(let z = -limit; z <= limit; z += gridSize) {
                    if(i >= COUNT) return;
                    
                    // Distance from center (Spherical cutoff)
                    const dist = Math.sqrt(x*x + y*y + z*z);
                    
                    // Only keep points inside a sphere, but remove inner core
                    if(dist > limit || dist < 30) continue;
                    
                    // "Strand" logic: Fill the space between nodes
                    // We add points along the lines connecting to neighbors
                    for(let j=0; j<8; j++) { // 8 particles per node (volume)
                        if(i >= COUNT) break;
                        
                        const offsetX = (Math.random()) * gridSize;
                        const offsetY = (Math.random()) * gridSize;
                        const offsetZ = (Math.random()) * gridSize;

                        arr[i*3] = x + offsetX;
                        arr[i*3+1] = y + offsetY;
                        arr[i*3+2] = z + offsetZ;
                        
                        // Color variation (optional logic)
                        // if (Math.random() > 0.9) makeGlowing();
                        
                        i++; 
                    }
                }
            }
        }
    },

    // 4. TESSERACT PROJECTION (4D Cube)
    // A rotating 4D hypercube projected into 3D.
    // Looks impossible and geometrically alien.
    HYPERCUBE: (arr) => {
        const vertices = [
            [-1,-1,-1,-1], [-1,-1,-1,1], [-1,-1,1,-1], [-1,-1,1,1],
            [-1,1,-1,-1], [-1,1,-1,1], [-1,1,1,-1], [-1,1,1,1],
            [1,-1,-1,-1], [1,-1,-1,1], [1,-1,1,-1], [1,-1,1,1],
            [1,1,-1,-1], [1,1,-1,1], [1,1,1,-1], [1,1,1,1]
        ];
        const scale = 100;
        
        // Rotation speeds in 4D
        const angle = Math.PI / 4; 
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        
        // Rotation speed in 3D
        const angle3D = Date.now() * 0.001; // Simulating time if possible, or static angle
        const cos3D = Math.cos(0.5), sin3D = Math.sin(0.5);

        for(let i=0; i<COUNT; i++) {
            // Pick a vertex
            const v = vertices[i % 16];
            let x=v[0], y=v[1], z=v[2], w=v[3];

            // Rotate in ZW plane
            let z_r = z * cosA - w * sinA;
            let w_r = z * sinA + w * cosA;
            z = z_r; w = w_r;

            // Rotate in XW plane
            let x_r = x * cosA - w * sinA;
            w_r = x * sinA + w * cosA;
            x = x_r; w = w_r;

            // Stereographic Projection (4D -> 3D)
            // distance from 4D camera
            const distance = 3.0; 
            const wFactor = 1 / (distance - w);
            
            let px = x * wFactor * scale;
            let py = y * wFactor * scale;
            let pz = z * wFactor * scale;

            // Rotate result in 3D XY plane
            let x_final = px * cos3D - py * sin3D;
            let y_final = px * sin3D + py * cos3D;

            // Draw lines connecting vertices? 
            // Since this is a point cloud, we just draw the vertices densely.
            // To make it look solid, we add duplicates along the edges.
            // Approximating edge drawing by adding points between random pairs
            if(Math.random() > 0.5) {
                const v2 = vertices[Math.floor(Math.random()*16)];
                // Interpolate
                const t = Math.random();
                x_final += (v2[0] - x) * t * scale * 0.5;
                y_final += (v2[1] - y) * t * scale * 0.5;
                pz += (v2[2] - z) * t * scale * 0.5;
            }

            arr[i*3] = x_final;
            arr[i*3+1] = y_final;
            arr[i*3+2] = pz;
        }
    },

    // 5. FRACTAL TREE CRYSTAL (3D L-System)
    // A recursive branching structure that looks like a frozen lightning bolt or alien coral.
    FRACTAL_TREE: (arr) => {
        const depth = 5; // Recursion depth
        let idx = 0;
        
        function branch(x, y, z, dx, dy, dz, len, level) {
            if (level === 0 || idx >= COUNT) return;
            
            // Draw branch particles
            const segments = 10;
            for(let s=0; s<segments; s++) {
                if(idx >= COUNT) break;
                const t = s / segments;
                arr[idx*3] = x + dx * len * t;
                arr[idx*3+1] = y + dy * len * t;
                arr[idx*3+2] = z + dz * len * t;
                idx++;
            }
            
            // Calculate new position (tip of branch)
            const nx = x + dx * len;
            const ny = y + dy * len;
            const nz = z + dz * len;
            
            // Branch out (2 or 3 branches)
            const branches = 3;
            for(let b=0; b<branches; b++) {
                if(idx >= COUNT) break;
                
                // Rotate direction vector
                const angle = (b / branches) * Math.PI * 2;
                const tilt = 0.5; // Spread angle
                
                // Simple 3D rotation matrix application
                // (This is a simplified direction change)
                let ndx = dx * Math.cos(tilt) + Math.sin(angle);
                let ndy = dy * Math.cos(tilt) + Math.cos(angle);
                let ndz = dz + (Math.random()-0.5);
                
                // Normalize roughly
                const mag = Math.sqrt(ndx*ndx + ndy*ndy + ndz*ndz);
                ndx/=mag; ndy/=mag; ndz/=mag;
                
                branch(nx, ny, nz, ndx, ndy, ndz, len * 0.7, level - 1);
            }
        }
        
        // Start tree at bottom center 
        branch(0, -150, 0, 0, 1, 0, 60, depth);
    },

    // 6. PLASMA SHELL (Deformed Geosphere)
    // A sphere where the surface is deformed by interference waves.
    // Looks like a living planet core or a plasma containment field.
    PLASMA_SHELL: (arr) => {
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        
        for(let i=0; i<COUNT; i++) {
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT);
            
            // Base Sphere
            const rBase = 80;
            
            // 3 Complex interference waves
            const wave1 = Math.sin(theta * 8 + phi * 8) * 15;
            const wave2 = Math.cos(theta * 12 - phi * 6) * 10;
            const wave3 = Math.sin(phi * 20 + theta * 5) * 5;
            
            const r = rBase + wave1 + wave2 + wave3;
            
            // Convert to Cartesian
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            
            // Add "Plasma" noise (internal glow)
            // Pull some particles inward to create volume
            const volume = Math.random();
            const depth = volume > 0.8 ? 20 : 0;
            
            arr[i*3] = x * (1 - depth/100);
            arr[i*3+1] = y * (1 - depth/100);
            arr[i*3+2] = z * (1 - depth/100);
        }
    },

    // 7. HELICAL CITY (Cylindrical Skyscrapers)
    // Particles arranged in a cylinder, but with vertical "towers" rising.
    HELICAL_CITY: (arr) => {
        const radius = 80;
        const height = 300;
        
        for(let i=0; i<COUNT; i++) {
            const angle = (i / COUNT) * Math.PI * 2 * 10; // 10 spirals
            const y = (Math.random() - 0.5) * height;
            
            // Logic: Are we building a tower or a street?
            // Modulo math to create "slots" for buildings
            const slot = Math.floor(angle * 10) % 2; 
            
            let r = radius;
            
            // If it's a "building" slot, rise up significantly
            if(slot === 0) {
                // Taper the towers in the middle
                const taper = Math.abs(y) / height; 
                r += (Math.random() * 20) + taper * 20;
            } else {
                // Street level
                r = radius - 5; 
            }
            
            arr[i*3] = Math.cos(angle) * r;
            arr[i*3+1] = y;
            arr[i*3+2] = Math.sin(angle) * r;
        }
    },
    
    
    
    
       // 1. TESSERACT SWIRL (4D Hypercube Projection)
    // Projects a rotating 4D cube into 3D space, creating an "inside-out" effect.
    TESSERACT: (arr) => {
        const scale = 130;
        const rotAngle = Math.PI / 4; // 45 degree 4D rotation
        for(let i=0; i<COUNT; i++) {
            // 1. Create a random point in a 4D unit cube [-1, 1]
            let x = (Math.random() - 0.5) * 2;
            let y = (Math.random() - 0.5) * 2;
            let z = (Math.random() - 0.5) * 2;
            let w = (Math.random() - 0.5) * 2;

            // 2. Rotate in 4D (XW plane) to create the hyper-twist
            let x_r = x * Math.cos(rotAngle) - w * Math.sin(rotAngle);
            let w_r = x * Math.sin(rotAngle) + w * Math.cos(rotAngle);
            x = x_r; w = w_r;

            // 3. Rotate in 4D (YW plane) for extra complexity
            let y_r = y * Math.cos(rotAngle) - w * Math.sin(rotAngle);
            w = y * Math.sin(rotAngle) + w * Math.cos(rotAngle);
            y = y_r;

            // 4. Stereographic Projection (4D -> 3D)
            const dist = 3.0; // Distance of 4D camera
            const wFactor = 1 / (dist - w);

            arr[i*3] = x * wFactor * scale;
            arr[i*3+1] = y * wFactor * scale;
            arr[i*3+2] = z * wFactor * scale;
        }
    },
        FRACTAL_ICOSA: (arr) => {
        const phi = (1 + Math.sqrt(5)) / 2;
        // The 12 vertices of a standard icosahedron
        const verts = [
            [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
            [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
            [phi, 0, 1], [phi, 0, -1], [-phi, 0, 1], [-phi, 0, -1]
        ];

        for(let i=0; i<COUNT; i++) {
            // Determine fractal level (0 to 4) based on particle index
            const level = i % 5;
            const levelScale = Math.pow(0.5, level); // Each layer is half the size
            const baseSize = 140 * levelScale;

            // Pick a random vertex
            const v = verts[Math.floor(Math.random() * verts.length)];
            
            // Rotate each layer independently for a "crystal" look
            const theta = level * 0.8; 
            const x_rot = v[0] * Math.cos(theta) - v[2] * Math.sin(theta);
            const z_rot = v[0] * Math.sin(theta) + v[2] * Math.cos(theta);

            // Interpolate from center to vertex to create volume/lines
            const t = Math.pow(Math.random(), 3); // Bias towards center for core density

            arr[i*3] = x_rot * baseSize * t;
            arr[i*3+1] = v[1] * baseSize * t;
            arr[i*3+2] = z_rot * baseSize * t;
        }
    },

    MOBIUS_LATTICE: (arr) => {
        const R = 90; // Main radius
        const width = 50; 
        const turns = 2; // Full 4pi twist
        
        for(let i=0; i<COUNT; i++) {
            const t = (i / COUNT) * Math.PI * 2 * turns;
            
            // Lattice Logic: Snap to grid lines based on index parity
            // This creates "ribs" along the strip rather than a solid sheet
            const isRib = (i % 5 === 0); 
            let v = (Math.random() - 0.5) * width;
            
            if(isRib) {
                // Force particles to the edges of the strip for a wireframe look
                v = (Math.random() > 0.5 ? 1 : -1) * (width / 2);
            }

            // Möbius parametric equations
            const halfAngle = t / 2;
            const cosHalf = Math.cos(halfAngle);
            const sinHalf = Math.sin(halfAngle);

            const x = (R + v * cosHalf) * Math.cos(t);
            const y = (R + v * cosHalf) * Math.sin(t);
            const z = v * sinHalf;

            arr[i*3] = x;
            arr[i*3+1] = y;
            arr[i*3+2] = z;
        }
    },

    GEOSPHERE_FLUX: (arr) => {
        const rBase = 100;
        const goldenRatio = (1 + Math.sqrt(5)) / 2;

        for(let i=0; i<COUNT; i++) {
            // Fibonacci Sphere Algorithm (Even distribution)
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT);

            // Flux Harmonics: Modulate radius based on position
            // Creates "spikes" and "valleys"
            const wave1 = Math.sin(theta * 6 + phi * 4);
            const wave2 = Math.cos(theta * 10 - phi * 2);
            const distortion = (wave1 + wave2) * 15;

            // Apply high-frequency noise for "electric" feel
            const noise = (Math.random() - 0.5) * 5;
            
            const r = rBase + distortion + noise;

            const x = r * Math.cos(theta) * Math.sin(phi);
            const y = r * Math.sin(theta) * Math.sin(phi);
            const z = r * Math.cos(phi);

            arr[i*3] = x;
            arr[i*3+1] = y;
            arr[i*3+2] = z;
        }
    },
        LIQUID_CRYSTAL_STREAM: (arr) => {
        const width = 400;
        const length = 600;
        
        for(let i=0; i<COUNT; i++) {
            // Position along the stream (0 to 1)
            const t = i / COUNT; 
            
            // X and Z form a long plane/ribbon
            const x = (t - 0.5) * length;
            const z = (Math.random() - 0.5) * width;
            
            // Y is the "Liquid" height
            // Combine multiple sine waves for fluid motion
            const wave1 = Math.sin(x * 0.02 + z * 0.05) * 30;
            const wave2 = Math.cos(x * 0.05) * 20;
            const wave3 = Math.sin(z * 0.1 + t * 10) * 10;
            
            let y = wave1 + wave2 + wave3;
            
            // Add "Crystalline" spikes (sharp peaks)
            if(Math.random() > 0.92) {
                y += (Math.random() > 0.5 ? 40 : -40);
            }

            arr[i*3] = x;
            arr[i*3+1] = y;
            arr[i*3+2] = z;
        }
    },
        PARTICLE_BLOOM: (arr) => {
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        
        for(let i=0; i<COUNT; i++) {
            // Golden Angle distribution
            const theta = i * 2.39996; // ~137.5 degrees in radians
            const rBase = 4 * Math.sqrt(i); // Expanding spiral
            
            // Create "Petals" by modulating radius with Sine waves
            // High frequency wave creates the frilly flower edge
            const petalWave = Math.sin(theta * 6) * Math.cos(theta * 2 + i/500);
            const r = rBase + (petalWave * 15);

            // Flatten into a bowl/flower shape
            const x = r * Math.cos(theta);
            const z = r * Math.sin(theta);
            
            // Y creates the cup shape (negative center, raised edges)
            const y = (rBase / 8) - (Math.random() * 10) - 50; 

            // Tilt the flower slightly
            arr[i*3] = x;
            arr[i*3+1] = y * 0.5 + z * 0.5; // Tilt transformation
            arr[i*3+2] = z * 0.5 - y * 0.5; // Tilt transformation
        }
    },  

    // 2. DNA DOUBLE HELIX
    

    // 3. TORUS RING (Sci-Fi Portal)
    RING: (arr) => {
        const R = 100; // Major radius
        const r = 40;  // Minor radius (tube thickness)
        for(let i=0; i<COUNT; i++) {
            // Random point on torus surface
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI * 2;
            
            arr[i*3] = (R + r * Math.cos(v)) * Math.cos(u);
            arr[i*3+1] = (R + r * Math.cos(v)) * Math.sin(u);
            arr[i*3+2] = r * Math.sin(v);
        }
    },

    // 4. HYPERCUBE (The Box)
    CUBE: (arr) => {
        const size = 160; 
        for(let i=0; i<COUNT; i++) {
            // Pick a random face (0-5)
            const face = Math.floor(Math.random() * 6);
            // Random coordinates on that face
            const u = (Math.random() - 0.5) * size;
            const v = (Math.random() - 0.5) * size;
            
            if(face === 0) { arr[i*3]=size; arr[i*3+1]=u; arr[i*3+2]=v; } // Right
            else if(face === 1) { arr[i*3]=-size; arr[i*3+1]=u; arr[i*3+2]=v; } // Left
            else if(face === 2) { arr[i*3]=u; arr[i*3+1]=size; arr[i*3+2]=v; } // Top
            else if(face === 3) { arr[i*3]=u; arr[i*3+1]=-size; arr[i*3+2]=v; } // Bottom
            else if(face === 4) { arr[i*3]=u; arr[i*3+1]=v; arr[i*3+2]=size; } // Front
            else { arr[i*3]=u; arr[i*3+1]=v; arr[i*3+2]=-size; } // Back
        }
    },
    
    // 2. PULSE SPHERE (Sound Wave Harmonics)
    // A sphere deformed by sine waves to look like a sci-fi planet
    PULSE_SPHERE: (arr) => {
        const rBase = 90;
        for(let i=0; i<COUNT; i++) {
            const phi = Math.acos(-1 + (2 * i) / COUNT);
            const theta = Math.sqrt(COUNT * Math.PI) * phi;
            
            // Harmonic Deformation
            // Modulate the radius based on angle to create spikes/waves
            let r = rBase + 15 * Math.sin(theta * 8) * Math.cos(phi * 8);
            r += 5 * Math.sin(theta * 20); // High frequency noise
            
            arr[i*3] = r * Math.cos(theta) * Math.sin(phi);
            arr[i*3+1] = r * Math.sin(theta) * Math.sin(phi);
            arr[i*3+2] = r * Math.cos(phi);
        }
    },

    // 3. CYBER GRID (Data Cylinder)
    // Looks like falling digital rain wrapped in a cylinder
    CYBER_GRID: (arr) => {
        const segments = 32; // Number of vertical lines
        const radius = 80;
        const height = 400;
        
        for(let i=0; i<COUNT; i++) {
            // Snap angles to create distinct vertical lines
            const segIndex = i % segments;
            const angle = segIndex * (Math.PI * 2 / segments);
            
            // Distribute particles vertically
            const y = (i / COUNT) * height - (height/2);
            
            // Add some "glitch" particles outside the main cylinder
            const isGlitch = Math.random() > 0.95;
            const rOffset = isGlitch ? 30 : 0;
            
            arr[i*3] = (radius + rOffset) * Math.cos(angle);
            arr[i*3+1] = y;
            arr[i*3+2] = (radius + rOffset) * Math.sin(angle);
        }
    },

    // 4. KLEIN BOTTLE (Topological Mystery)
    // A complex shape with no inside or outside
    KLEIN_BOTTLE: (arr) => {
        for(let i=0; i<COUNT; i++) {
            const u = (i / COUNT) * Math.PI * 2;
            const v = Math.random() * Math.PI * 2; // Random v for volume filling
            
            const cosu = Math.cos(u);
            const sinu = Math.sin(u);
            const cosv = Math.cos(v);
            const sinv = Math.sin(v);
            
            // Klein Bottle Parametric Equations (Simplified)
            const scale = 40; // Scale up significantly
            
            const x = (cosu * (2 + cosv) + (u / Math.PI) * cosu * sinv) * scale;
            const y = (sinu * (2 + cosv) + (u / Math.PI) * sinu * sinv) * scale;
            const z = ((u / Math.PI) * sinv + cosv) * sinv * scale;
            
            arr[i*3] = x;
            arr[i*3+1] = y - 50; // Center vertically
            arr[i*3+2] = z;
        }
    },

    // 5. GEOSPHERE (Fibonacci Lattice)
    // Perfectly distributed points on a sphere (Structural/Strong)
    GEOSPHERE: (arr) => {
        const radius = 100;
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        
        for(let i=0; i<COUNT; i++) {
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT);
            
            const x = radius * Math.cos(theta) * Math.sin(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(phi);
            
            arr[i*3] = x;
            arr[i*3+1] = y;
            arr[i*3+2] = z;
        }
    },
    TORUS_KNOT: (arr) => {
        const p = 2, q = 3; // Determines knot complexity
        const tube = 25;
        const radius = 80;
        for(let i=0; i<COUNT; i++) {
            const u = (i / COUNT) * Math.PI * 2 * p; // Loop around the ring
            const v = (Math.random() - 0.5) * Math.PI * 2; // Around the tube
            
            const r = radius + tube * Math.cos(q * u / p);
            
            arr[i*3] = r * Math.cos(u) + (Math.random()-0.5)*5;
            arr[i*3+1] = tube * Math.sin(q * u / p) + (Math.random()-0.5)*5;
            arr[i*3+2] = r * Math.sin(u) + (Math.random()-0.5)*5;
        }
    },
     HELICOID: (arr) => {
        for(let i=0; i<COUNT; i++) {
            const t = (i / COUNT); // 0 to 1
            const angle = t * Math.PI * 16; // 8 full turns
            const radius = 20 + t * 80; // Expanding cone/spiral
            
            arr[i*3] = Math.cos(angle) * radius;
            arr[i*3+1] = (t - 0.5) * 300; // Vertical height
            arr[i*3+2] = Math.sin(angle) * radius;
        }
    },

    // 4. ATOM (Nucleus + Electron Rings)
    
    // 5. CRYSTAL PLANE (A spiky digital floor)
    PLANE: (arr) => {
        const size = 200;
        for(let i=0; i<COUNT; i++) {
            const x = (Math.random() - 0.5) * size;
            const y = (Math.random() - 0.5) * size;
            // Z is mostly 0, but with random spikes
            const z = (Math.random() < 0.1) ? (Math.random() - 0.5) * 100 : 0;
            
            arr[i*3] = x;
            arr[i*3+1] = y;
            arr[i*3+2] = z - 50; // Lower down
        }
    },

        BLACK_HOLE: (arr) => {
        for(let i=0; i<COUNT; i++) {
            // Distribute particles in a disc (flat on XZ plane)
            // Use random distribution biased towards center
            const t = Math.random();
            const radius = 10 + t * 200; // Hole in middle (radius 10)
            
            // The angle depends heavily on radius to create the spiral
            // Inner particles rotate more (gravitational time dilation simulation)
            const angle = t * Math.PI * 20 + Math.random() * 0.5;
            
            // Warp effect: Tilt the inner part of the disc
            const zTilt = (Math.random() - 0.5) * (200 / radius) * 10;

            arr[i*3] = Math.cos(angle) * radius;
            arr[i*3+1] = (Math.random() - 0.5) * 2; // Very thin disc
            arr[i*3+2] = Math.sin(angle) * radius + zTilt;
        }
    },
        NEBULA: (arr) => {
        // Define 5 random "centers of gravity" for the cloud clusters
        const centers = [];
        for(let k=0; k<5; k++) {
            centers.push({
                x: (Math.random() - 0.5) * 300,
                y: (Math.random() - 0.5) * 200,
                z: (Math.random() - 0.5) * 300
            });
        }

        for(let i=0; i<COUNT; i++) {
            // Pick a random center
            const center = centers[Math.floor(Math.random() * centers.length)];
            
            // Gaussian distribution (box-muller transform approximation) around that center
            const u = 1 - Math.random();
            const v = Math.random();
            const r = 60 * Math.sqrt(-2.0 * Math.log(u)); // Cluster spread
            const theta = 2.0 * Math.PI * v;

            arr[i*3] = center.x + r * Math.cos(theta);
            arr[i*3+1] = center.y + r * Math.sin(theta);
            arr[i*3+2] = center.z + (Math.random() - 0.5) * 60;
        }
    },
        QUANTUM_LATTICE: (arr) => {
        const gridSize = 20; // Distance between grid points
        const limit = 100;
        
        let i = 0;
        for(let x = -limit; x <= limit; x += gridSize) {
            for(let y = -limit; y <= limit; y += gridSize) {
                for(let z = -limit; z <= limit; z += gridSize) {
                    if(i >= COUNT) break;
                    
                    // Quantum Jump: 10% chance to teleport far away
                    const isQuantum = Math.random() > 0.9;
                    
                    if(isQuantum) {
                        arr[i*3] = x + (Math.random()-0.5) * 300;
                        arr[i*3+1] = y + (Math.random()-0.5) * 300;
                        arr[i*3+2] = z + (Math.random()-0.5) * 300;
                    } else {
                        // Standard oscillating grid position
                        arr[i*3] = x + Math.sin(y*0.1) * 5;
                        arr[i*3+1] = y + Math.cos(z*0.1) * 5;
                        arr[i*3+2] = z + Math.sin(x*0.1) * 5;
                    }
                    i++;
                }
            }
        }
        // Fill remaining if grid was too small
        while(i < COUNT) {
            arr[i*3] = (Math.random()-0.5)*300;
            arr[i*3+1] = (Math.random()-0.5)*300;
            arr[i*3+2] = (Math.random()-0.5)*300;
            i++;
        }
    },
        AURORA_RING: (arr) => {
        const height = 300;
        const radius = 100;
        
        for(let i=0; i<COUNT; i++) {
            const t = i / COUNT;
            const angle = t * Math.PI * 16; // Multiple twists
            
            // Y goes from bottom to top
            const y = (t - 0.5) * height;
            
            // Radius breathes and waves based on height and angle
            const wave = Math.sin(y * 0.05 + angle * 2) * 30;
            const r = radius + wave + (Math.random() - 0.5) * 10;
            
            // Twist the ribbon
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;

            arr[i*3] = x;
            arr[i*3+1] = y;
            arr[i*3+2] = z;
        }
    },
        HYPERSPHERE: (arr) => {
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        
        for(let i=0; i<COUNT; i++) {
            // Fibonacci Sphere distribution
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT);
            
            let x = Math.sin(phi) * Math.cos(theta);
            let y = Math.sin(phi) * Math.sin(theta);
            let z = Math.cos(phi);
            
            // Vortex Rotation: Rotate around Y axis based on Y position
            // Top particles rotate one way, bottom the other
            const rotSpeed = 3.0; 
            const rotAngle = y * rotSpeed;
            
            const x_rot = x * Math.cos(rotAngle) - z * Math.sin(rotAngle);
            const z_rot = x * Math.sin(rotAngle) + z * Math.cos(rotAngle);
            
            const r = 100;
            
            arr[i*3] = x_rot * r;
            arr[i*3+1] = y * r;
            arr[i*3+2] = z_rot * r;
        }
    },
       
        INTERFERENCE_GRID: (arr) => {
        const size = 300;
        const step = 4;
        
        let idx = 0;
        for(let x = -size; x <= size; x += step) {
            for(let z = -size; z <= size; z += step) {
                if(idx >= COUNT) break;
                
                // Interference Math
                const dist = Math.sqrt(x*x + z*z);
                const wave1 = Math.sin(dist * 0.05) * 30;
                const wave2 = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 40;
                
                const y = wave1 + wave2;
                
                arr[idx*3] = x;
                arr[idx*3+1] = y;
                arr[idx*3+2] = z;
                idx++;
            }
        }
        // Fill rest randomly if needed
        while(idx < COUNT) {
            arr[idx*3] = (Math.random()-0.5)*600;
            arr[idx*3+1] = (Math.random()-0.5)*100;
            arr[idx*3+2] = (Math.random()-0.5)*600;
            idx++;
        }
    },
        RIBBON_SPIRAL: (arr) => {
        const height = 400;
        
        for(let i=0; i<COUNT; i++) {
            const t = (i / COUNT);
            const angle = t * Math.PI * 10;
            
            // Main helix spine
            const spineX = Math.cos(angle) * 60;
            const spineZ = Math.sin(angle) * 60;
            const spineY = (t - 0.5) * height;
            
            // Ribbon width/offset
            // We use the angle to determine the "normal" direction of the ribbon
            const width = 40;
            const w = (Math.random() - 0.5) * width;
            
            // Simple twist: Offset X and Z based on a second angle
            const twist = angle + Math.PI/2;
            
            arr[i*3] = spineX + Math.cos(twist) * w;
            arr[i*3+1] = spineY + (Math.random()-0.5)*10; // Slight thickness
            arr[i*3+2] = spineZ + Math.sin(twist) * w;
        }
    },
        MAGNETIC_SWARM: (arr) => {
        const poleDist = 100;
        // Pole 1 and Pole 2 positions
        const p1 = {x: 0, y: poleDist, z: 0};
        const p2 = {x: 0, y: -poleDist, z: 0};

        for(let i=0; i<COUNT; i++) {
            // Pick a pole to orbit
            const pole = (i % 2 === 0) ? p1 : p2;
            
            // Create a ring around the pole
            const theta = Math.random() * Math.PI * 2;
            const r = 40 + Math.random() * 60;
            
            // Orbit plane (perpendicular to Y axis)
            const x = pole.x + Math.cos(theta) * r;
            const z = pole.z + Math.sin(theta) * r;
            const y = pole.y + (Math.random() - 0.5) * 20; // Disc height
            
            // Add "swarm" jitter
            arr[i*3] = x + (Math.random()-0.5)*10;
            arr[i*3+1] = y + (Math.random()-0.5)*10;
            arr[i*3+2] = z + (Math.random()-0.5)*10;
        }
    },
        ELECTROSTATIC_NET: (arr) => {
        const nodes = [];
        // Create 8 random nodes
        for(let j=0; j<8; j++) {
            nodes.push({
                x: (Math.random()-0.5)*200,
                y: (Math.random()-0.5)*200,
                z: (Math.random()-0.5)*200
            });
        }

        for(let i=0; i<COUNT; i++) {
            // Connect nodes: Pick two random nodes
            const n1 = nodes[Math.floor(Math.random() * nodes.length)];
            const n2 = nodes[Math.floor(Math.random() * nodes.length)];
            
            // Interpolate a position between them (the "strand")
            const t = Math.random();
            
            // Add "static cling" jitter - particles stick close to the line
            const jitter = 5;
            
            arr[i*3] = (n1.x + (n2.x - n1.x) * t) + (Math.random()-0.5)*jitter;
            arr[i*3+1] = (n1.y + (n2.y - n1.y) * t) + (Math.random()-0.5)*jitter;
            arr[i*3+2] = (n1.z + (n2.z - n1.z) * t) + (Math.random()-0.5)*jitter;
        }
    },
    
    // 5. VORTEX (Black Hole style)
    VORTEX: (arr) => {
        for(let i=0; i<COUNT; i++) {
            const t = i / COUNT; // 0 to 1
            const angle = t * Math.PI * 40; // Tight spiral
            const radius = 10 + (t * 150); // Expanding radius
            
            arr[i*3] = Math.cos(angle) * radius;
            arr[i*3+1] = (Math.random() - 0.5) * 200; // Vertical spread
            arr[i*3+2] = Math.sin(angle) * radius;
        }
    }
};
        
        let currentFormKey = 0;
        const formKeys = Object.keys(FORMS);
        let mouse = new THREE.Vector2();

        function initApexBackground() {
    // -----------------------------------------------------------
    // 1. CHECK IF LIBRARY LOADED (Extension Fix)
    // -----------------------------------------------------------
    if (typeof THREE === 'undefined') {
        console.error("SYSTEM ERROR: THREE.js is not defined.");
        console.log("SOLUTION: Did you download 'three.min.js' locally and add the <script> tag in HTML?");
        
        // Visual feedback on the button
        const btn = document.getElementById('toggleExtBgBtn');
        if (btn) {
            btn.innerText = "ERROR: MISSING LIBRARY";
            btn.style.borderColor = "red";
            btn.style.color = "red";
        }
        return; // Stop execution
    }

    try {
        // -----------------------------------------------------------
        // 2. SETUP SCENE
        // -----------------------------------------------------------
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.002);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 2000);
        camera.position.z = 300;

        // Ensure renderer has a container
        const threeContainer = document.getElementById('three-container');
        if(!threeContainer) return;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        // Clear previous canvas if exists (prevents duplicate canvases)
        threeContainer.innerHTML = ''; 
        threeContainer.appendChild(renderer.domElement);

        // -----------------------------------------------------------
        // 3. CREATE PARTICLES
        // -----------------------------------------------------------
        const COUNT = 60000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(COUNT * 3);
        const colors = new Float32Array(COUNT * 3);

        for(let i=0; i<COUNT; i++) {
            const mix = Math.random();
            colors[i*3] = 0.05;     // R
            colors[i*3+1] = mix * 0.8; // G
            colors[i*3+2] = 1.0;     // B
            
            // Initial Sphere Shape
            const r = 120;
            const phi = Math.acos(-1 + (2 * i) / COUNT);
            const theta = Math.sqrt(COUNT * Math.PI) * phi;
            pos[i*3] = r * Math.cos(theta) * Math.sin(phi);
            pos[i*3+1] = r * Math.sin(theta) * Math.sin(phi);
            pos[i*3+2] = r * Math.cos(phi);
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
        window.formInterval = setInterval(morphNextForm, 5000);

    } catch (error) {
        console.error("WebGL Error:", error);
        const btn = document.getElementById('toggleExtBgBtn');
        if(btn) btn.innerText = "WEBGL ERROR";
    }
}

        function animateApex() {
            if (!isApexActive) return;
            animationFrameId = requestAnimationFrame(animateApex);
            
            const positions = points.geometry.attributes.position.array;

            for(let i=0; i<positions.length; i+=3) {
                positions[i] += (targets[i] - positions[i]) * 0.08;
                positions[i+1] += (targets[i+1] - positions[i+1]) * 0.08;
                positions[i+2] += (targets[i+2] - positions[i+2]) * 0.08;

                const dx = mouse.x - positions[i];
                const dy = mouse.y - positions[i+1];
                const d = Math.sqrt(dx*dx + dy*dy);
                if(d < 100) {
                    positions[i] += dx * 0.01;
                    positions[i+1] += dy * 0.01;
                }
            }
            
            points.geometry.attributes.position.needsUpdate = true;
            points.rotation.y += 0.005;
            renderer.render(scene, camera);
        }

        function morphNextForm() {
    // 1. PICK A RANDOM TRANSITION TYPE
    // 'EXPLODE': Scatter to random chaos
    // 'IMPLODE': Collapse to a single point (0,0,0)
    // 'FLATTEN': Collapse to a flat disc
    const modes = ['EXPLODE', 'IMPLODE', 'FLATTEN','HELIX_SPIN'];
    const mode = modes[Math.floor(Math.random() * modes.length)];

    // 2. APPLY THE INTERIM STATE (The "Glitch")
    for(let i=0; i<COUNT*3; i++) {
        if(mode === 'EXPLODE') {
            // Scatters randomly far away
            targets[i] = (Math.random() - 0.5) * 1500;
        } 
        else if (mode === 'IMPLODE') {
            // Collapses to center (0,0,0) with slight noise
            targets[i] = (Math.random() - 0.5) * 5;
        }
        else if (mode === 'FLATTEN') {
            // Collapses to Z=0 plane, but keeps X/Y spread
            const axis = i % 3; // 0=x, 1=y, 2=z
            if(axis === 2) {
                targets[i] = 0; // Flatten Z
            } else {
                targets[i] = (Math.random() - 0.5) * 400; // Spread X/Y
            }
        }
        else if (mode === 'HELIX_SPIN') {
            // Spiral rapidly around Y axis
            const angle = (i / COUNT) * Math.PI * 20; // Tight spiral
            const r = 200 + Math.random() * 50;
            targets[i] = Math.cos(angle) * r;
            targets[i+1] = (Math.random() - 0.5) * 600; // Tall vertical spread
            targets[i+2] = Math.sin(angle) * r;
        }
    }

    // 3. WAIT FOR TRANSITION TO COMPLETE (600ms)
    setTimeout(() => {
        
        // 4. SELECT THE NEW FINAL SHAPE
        const formKey = formKeys[currentFormKey];
        
        // Generate the math for the new shape
        if(FORMS[formKey]) {
            FORMS[formKey](targets);
        }

        // Advance to the next shape for the future loop
        currentFormKey = (currentFormKey + 1) % formKeys.length;
        
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