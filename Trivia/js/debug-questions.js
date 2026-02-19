// Debug script to help identify question loading issues

document.addEventListener('DOMContentLoaded', () => {
    console.log('Debug script loaded');
    
    // Check if JSON file exists
    fetch('data/questions.json')
        .then(response => {
            console.log('JSON fetch response:', response);
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('JSON file not found or server error');
            }
        })
        .then(data => {
            console.log('Questions loaded successfully:', data);
            console.log('Total categories:', Object.keys(data.categories || data).length);
            console.log('Baden Powell questions:', data.categories?.badenPowell?.questions?.length || data.badenPowell?.length);
        })
        .catch(error => {
            console.error('Failed to load questions.json:', error);
            
            // Try to find the file in different locations
            const possiblePaths = [
                'data/questions.json',
                'questions.json',
                '/data/questions.json',
                './data/questions.json'
            ];
            
            possiblePaths.forEach(path => {
                fetch(path)
                    .then(resp => {
                        if (resp.ok) {
                            console.log(`Found questions.json at: ${path}`);
                        }
                    })
                    .catch(() => {});
            });
        });
    
    // Check if DOM elements exist
    setTimeout(() => {
        const container = document.querySelector('.categories-container');
        console.log('Categories container exists:', !!container);
        
        const submitBtn = document.getElementById('submitBtn');
        console.log('Submit button exists:', !!submitBtn);
        
        // Check for radio buttons
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        console.log('Radio buttons found:', radioButtons.length);
    }, 1000);
});