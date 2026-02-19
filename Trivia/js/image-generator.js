/**
 * Instagram Score Image Generator
 * Creates shareable images with scout design and user score
 */

class ScoreImageGenerator {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1080; // Instagram post width
        this.canvas.height = 1080; // Square format
        
        // Scout theme colors
        this.colors = {
            primary: '#d80000', // Scout red
            secondary: '#0066cc', // Scout blue  
            background: '#f8f9fa',
            text: '#333333',
            accent: '#ffcc00' // Gold/yellow accent
        };
    }
    
    async generateScoreImage(score, total, username = 'Scout') {
        try {
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw background
            this.drawBackground();
            
            // Draw scout elements
            await this.drawScoutElements();
            
            // Draw score information
            this.drawScoreInfo(score, total, username);
            
            // Draw decorative elements
            this.drawDecorativeElements();
            
            return this.canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Error generating score image:', error);
            return null;
        }
    }
    
    drawBackground() {
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f0f0f0');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Subtle border
        this.ctx.strokeStyle = this.colors.primary;
        this.ctx.lineWidth = 8;
        this.ctx.strokeRect(4, 4, this.canvas.width - 8, this.canvas.height - 8);
    }
    
    async drawScoutElements() {
        // Draw scout fleur-de-lis symbol (simplified)
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2 - 200);
        
        // Main fleur-de-lis shape
        this.ctx.fillStyle = this.colors.primary;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -150);
        this.ctx.bezierCurveTo(-40, -120, -40, -80, 0, -60);
        this.ctx.bezierCurveTo(40, -80, 40, -120, 0, -150);
        this.ctx.fill();
        
        // Bottom part
        this.ctx.beginPath();
        this.ctx.moveTo(-30, -60);
        this.ctx.lineTo(-30, 100);
        this.ctx.lineTo(30, 100);
        this.ctx.lineTo(30, -60);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Side flourishes
        this.ctx.beginPath();
        this.ctx.moveTo(-50, -100);
        this.ctx.bezierCurveTo(-70, -80, -60, -40, -30, -40);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(50, -100);
        this.ctx.bezierCurveTo(70, -80, 60, -40, 30, -40);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawScoreInfo(score, total, username) {
        const centerX = this.canvas.width / 2;
        const startY = this.canvas.height / 2 + 100;
        
        // Score display
        this.ctx.font = 'bold 120px Arial';
        this.ctx.fillStyle = this.colors.primary;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${score}/${total}`, centerX, startY);
        
        // Percentage
        const percentage = Math.round((score / total) * 100);
        this.ctx.font = 'bold 60px Arial';
        this.ctx.fillStyle = this.colors.secondary;
        this.ctx.fillText(`${percentage}%`, centerX, startY + 80);
        
        // Username
        if (username && username !== 'Scout') {
            this.ctx.font = '40px Arial';
            this.ctx.fillStyle = this.colors.text;
            this.ctx.fillText(`@${username}`, centerX, startY + 140);
        }
        
        // Title
        this.ctx.font = 'bold 50px Arial';
        this.ctx.fillStyle = this.colors.text;
        this.ctx.fillText('TRIVIA SCOUT', centerX, startY - 280);
    }
    
    drawDecorativeElements() {
        // Corner decorations
        const size = 40;
        const corners = [
            { x: size, y: size },
            { x: this.canvas.width - size, y: size },
            { x: size, y: this.canvas.height - size },
            { x: this.canvas.width - size, y: this.canvas.height - size }
        ];
        
        corners.forEach(corner => {
            this.ctx.save();
            this.ctx.translate(corner.x, corner.y);
            this.ctx.fillStyle = this.colors.accent;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        
        // Bottom text
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = this.colors.text;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Comparte tu conocimiento scout!', this.canvas.width / 2, this.canvas.height - 50);
    }
    
    // Download the generated image
    downloadImage(dataUrl, filename = 'trivia-scout-score.png') {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Share to Instagram (opens in new tab for download)
    shareToInstagram(dataUrl, score, total) {
        // Create a temporary page for sharing
        const shareWindow = window.open('', '_blank', 'width=600,height=800');
        if (!shareWindow) {
            // If popup blocked, download instead
            this.downloadImage(dataUrl);
            return;
        }
        
        shareWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Compartir en Instagram - Trivia Scout</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 20px; 
                        text-align: center;
                        background: #f8f9fa;
                    }
                    .image-container {
                        margin: 20px 0;
                        border: 2px solid #ddd;
                        border-radius: 10px;
                        overflow: hidden;
                    }
                    img { 
                        max-width: 100%; 
                        height: auto;
                        display: block;
                    }
                    .buttons {
                        margin: 20px 0;
                    }
                    button {
                        background: #d80000;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        margin: 10px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                    }
                    button:hover {
                        background: #b00000;
                    }
                    .instructions {
                        background: #e9ecef;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <h2>¡Tu resultado de Trivia Scout!</h2>
                <div class="image-container">
                    <img src="${dataUrl}" alt="Resultado Trivia Scout ${score}/${total}">
                </div>
                <div class="instructions">
                    <p><strong>Para compartir en Instagram:</strong></p>
                    <p>1. Haz clic en "Descargar Imagen"</p>
                    <p>2. Abre Instagram y crea una nueva publicación</p>
                    <p>3. Selecciona la imagen descargada</p>
                    <p>4. ¡Publica y presume tus conocimientos scout!</p>
                </div>
                <div class="buttons">
                    <button onclick="downloadImage()">Descargar Imagen</button>
                    <button onclick="window.close()">Cerrar</button>
                </div>
                <script>
                    function downloadImage() {
                        const link = document.createElement('a');
                        link.href = "${dataUrl}";
                        link.download = "trivia-scout-${score}-de-${total}.png";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                </script>
            </body>
            </html>
        `);
        shareWindow.document.close();
    }
}

// Initialize the generator when needed
const scoreImageGenerator = new ScoreImageGenerator();