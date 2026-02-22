/**
 * GLOBE.JS
 * Standalone 3D Core Visualizer Module
 */

const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

class CoreVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        
        // Safety check: If canvas doesn't exist, don't initialize
        if (!this.canvas) {
            console.error("Globe.js: Canvas element with ID '" + canvasId + "' not found.");
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Color Config
        this.colors = {
            cyan: { r: 0, g: 243, b: 255 },
            alert: { r: 255, g: 0, b: 60 },
            current: { r: 0, g: 243, b: 255 }
        };
        
        this.state = 'IDLE'; // IDLE, PROCESSING, ALERT
        
        // Orb Geometry
        this.points = [];
        this.numPoints = 150;
        this.orbRadius = 100;
        this.rings = [];
        
        // Parallax
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
        
        // Create sphere points
        for (let i = 0; i < this.numPoints; i++) {
            // FIXED SYNTAX ERROR HERE: Added missing closing parenthesis
            const phi = Math.acos(-1 + (2 * i) / this.numPoints);
            const theta = Math.sqrt(this.numPoints * Math.PI) * phi;
            
            this.points.push({
                x: this.orbRadius * Math.cos(theta) * Math.sin(phi),
                y: this.orbRadius * Math.sin(theta) * Math.sin(phi),
                z: this.orbRadius * Math.cos(phi),
                baseX: 0, baseY: 0, baseZ: 0 
            });
        }
        
        // Initialize rings (3 orbits)
        for(let i=0; i<3; i++) {
            this.rings.push({
                radius: this.orbRadius * (1.2 + i * 0.15),
                angle: Math.random() * Math.PI,
                speed: (Math.random() * 0.02 + 0.005) * (i % 2 === 0 ? 1 : -1),
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
        
        // Responsive sizing
        const scale = Math.min(this.width, this.height) / 1000;
        this.orbRadius = 120 * scale;
        
        // Re-calc points on resize to maintain shape
        this.points = [];
        for (let i = 0; i < this.numPoints; i++) {
            // FIXED SYNTAX ERROR HERE: Added missing closing parenthesis
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
        // Normalize mouse from -1 to 1
        this.mouseX = (e.clientX / this.width) * 2 - 1;
        this.mouseY = (e.clientY / this.height) * 2 - 1;
    }

    updateColorState() {
        // Determine target color
        const target = this.state === 'ALERT' ? this.colors.alert : this.colors.cyan;
        
        // Smooth Lerp
        this.colors.current.r = lerp(this.colors.current.r, target.r, 0.05);
        this.colors.current.g = lerp(this.colors.current.g, target.g, 0.05);
        this.colors.current.b = lerp(this.colors.current.b, target.b, 0.05);
        
        return `rgb(${Math.round(this.colors.current.r)}, ${Math.round(this.colors.current.g)}, ${Math.round(this.colors.current.b)})`;
    }

    drawGlowingOrb(color, rotationX, rotationY, time) {
        const cx = this.width / 2;
        const cy = this.height * 0.8; // Positioned at bottom area
        const speedMult = this.state === 'PROCESSING' ? 4 : 1;

        // 1. Draw Connecting Lines (Constellation effect inside orb)
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 0.5;
        
        // Rotate Points
        this.points.forEach(p => {
            // Rotate Y
            let x1 = p.x * Math.cos(rotationY * speedMult) - p.z * Math.sin(rotationY * speedMult);
            let z1 = p.z * Math.cos(rotationY * speedMult) + p.x * Math.sin(rotationY * speedMult);
            // Rotate X
            let y1 = p.y * Math.cos(rotationX) - z1 * Math.sin(rotationX);
            let z2 = z1 * Math.cos(rotationX) + p.y * Math.sin(rotationX);

            p.px = x1 + cx;
            p.py = y1 + cy;
            p.pz = z2;
        });

        // Draw dots and close connections
        this.points.forEach((p, i) => {
            const alpha = (p.pz + this.orbRadius) / (2 * this.orbRadius); // Depth fading
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.px, p.py, 1.5, 0, Math.PI * 2);
            this.ctx.fill();

            // Connect to neighbors if close
            for (let j = i + 1; j < this.points.length; j++) {
                const p2 = this.points[j];
                const dx = p.px - p2.px;
                const dy = p.py - p2.py;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < 40) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.px, p.py);
                    this.ctx.lineTo(p2.px, p2.py);
                    this.ctx.globalAlpha = alpha * 0.3;
                    this.ctx.stroke();
                }
            }
        });
        this.ctx.globalAlpha = 1;

        // 2. Central Gradient Core
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

        // 3. Rotating Rings
        this.ctx.save();
        this.ctx.translate(cx, cy);
        // Apply perspective tilt based on mouse
        this.ctx.scale(1, 0.5 + (this.mouseY * 0.1)); 

        this.rings.forEach(ring => {
            this.ctx.beginPath();
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = ring.width;
            this.ctx.globalAlpha = 0.7;
            
            // Add dash effect
            this.ctx.setLineDash([20, 40]);
            
            // Ellipse rotation
            this.ctx.rotate(ring.angle + (time * 0.001 * ring.speed * speedMult));
            this.ctx.ellipse(0, 0, ring.radius, ring.radius, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Reset rotation for next ring
            this.ctx.rotate(-(ring.angle + (time * 0.001 * ring.speed * speedMult)));
        });
        
        this.ctx.restore();
        this.ctx.globalAlpha = 1;

        // 4. Vertical Scanner Line (Passes through orb)
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
        // Clear entire canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Smooth Camera Tilt (Parallax)
        this.targetRotateY = this.mouseX * 0.5;
        this.targetRotateX = this.mouseY * 0.2;
        this.rotationY = lerp(this.rotationY, this.targetRotateY, 0.05);
        this.rotationX = lerp(this.rotationX, this.targetRotateX, 0.05);

        const currentColor = this.updateColorState();
        
        // Draw Core
        this.drawGlowingOrb(currentColor, this.rotationX, this.rotationY, time);
        
        // Draw Data Particles (Background)
        this.drawParticles(time, currentColor);

        requestAnimationFrame((t) => this.animate(t));
    }

    drawParticles(time, color) {
        // Initialize particles array if it doesn't exist
        if (!this.particles) {
            this.particles = Array.from({ length: 50 }, () => ({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                s: Math.random() * 2,
                v: Math.random() * 0.5 + 0.1
            }));
        }
        
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