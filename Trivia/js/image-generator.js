/**
 * Instagram Score Image Generator
 * Creates shareable images with scout design and user score
 */

class ImageGenerator {
    static async generateScoreImage(canvas, score, total, username = 'Scout') {
        try {
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;
            
            // Clear canvas
            ctx.clearRect(0, 0, width, height);
            
            // Draw background
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#f0f0f0');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // Border
            ctx.strokeStyle = '#d80000';
            ctx.lineWidth = 8;
            ctx.strokeRect(4, 4, width - 8, height - 8);
            
            // Scout symbol (simplified)
            ctx.save();
            ctx.translate(width / 2, height / 2 - 200);
            ctx.fillStyle = '#d80000';
            ctx.beginPath();
            ctx.moveTo(0, -150);
            ctx.bezierCurveTo(-40, -120, -40, -80, 0, -60);
            ctx.bezierCurveTo(40, -80, 40, -120, 0, -150);
            ctx.fill();
            ctx.restore();
            
            // Score text
            const centerX = width / 2;
            const startY = height / 2 + 100;
            ctx.font = 'bold 120px Arial';
            ctx.fillStyle = '#d80000';
            ctx.textAlign = 'center';
            ctx.fillText(`${score}/${total}`, centerX, startY);
            
            const percentage = Math.round((score / total) * 100);
            ctx.font = 'bold 60px Arial';
            ctx.fillStyle = '#0066cc';
            ctx.fillText(`${percentage}%`, centerX, startY + 80);
            
            ctx.font = 'bold 50px Arial';
            ctx.fillStyle = '#333333';
            ctx.fillText('TRIVIA SCOUT', centerX, startY - 280);
            
            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Error generating score image:', error);
            return null;
        }
    }
    
    static downloadImage(canvas, filename = 'trivia-scout-score.png') {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}