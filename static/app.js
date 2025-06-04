document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const resultsGrid = document.getElementById('resultsGrid');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadPreview = document.getElementById('uploadPreview');
    let currentSearchTerm = '';
    let currentSearchType = 'text';

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show corresponding content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            // Update search type
            currentSearchType = tabId === 'text-search' ? 'text' : 'image';
            
            // Clear previous results when switching tabs
            clearResults();
            uploadPreview.innerHTML = ''; // Explicitly clear preview here
        });
    });

    // Text search
    function performTextSearch(query) {
        if (!query.trim()) return;
        
        currentSearchTerm = query;
        uploadPreview.innerHTML = ''; // Clear image preview for text search
        showLoading(true);
        
        fetch(`/search?search_query=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(displayResults)
            .catch(error => showError('Error performing search: ' + error))
            .finally(() => showLoading(false));
    }
    
    // Image search
    function performImageSearch(file) {
        if (!file) return;
        
        uploadPreview.innerHTML = ''; // Clear previous image preview
        showLoading(true);
        
        const formData = new FormData();
        formData.append('file', file);
        
        fetch('/search_by_image', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Show the uploaded image
            if (data.uploaded_image) {
                displayUploadedImage(data.uploaded_image);
            }
            displayResults(data.results || []);
        })
        .catch(error => showError('Error processing image: ' + error))
        .finally(() => showLoading(false));
    }
    
    // Display search results
    function displayResults(results) {
        clearResults();
        
        if (!results || results.length === 0) {
            showNoResults();
            return;
        }
        
        results.forEach((result) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            try {
                const img = document.createElement('img');
                // Handle both full URLs and local paths
                const imagePath = result.path.startsWith('http') ? 
                    result.path : 
                    (result.path.startsWith('static/') ? 
                        `/${result.path}` : 
                        `/${result.path}`);
                
                img.src = imagePath;
                img.alt = 'Search result';
                img.loading = 'lazy';
                
                // Add error handling for images that fail to load
                img.onerror = () => {
                    
                    img.alt = 'Image not found';
                    img.style.backgroundColor = '#f5f5f5';
                };
                
                resultItem.appendChild(img);
                resultsGrid.appendChild(resultItem);
            } catch (error) {
                
            }
        });
    }
    
    // Display uploaded image preview
    function displayUploadedImage(imagePath) {
        
        // Remove leading slash if present to avoid double slashes
        const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
        const imgUrl = `/${cleanPath}`;
        
        
        // Ensure the preview container is visible
        uploadPreview.style.display = 'block';
        uploadPreview.innerHTML = `
            <h3>Searching for similar images to:</h3>
            <img src="${imgUrl}" alt="Uploaded preview" class="uploaded-image">
        `;
    }
    
    // Clear previous results
    function clearResults() {
        resultsGrid.innerHTML = '';
        // uploadPreview is now cleared more selectively
    }
    
    // Show loading state
    function showLoading(isLoading) {
        const loadingElement = document.querySelector('.loading');
        if (isLoading && !loadingElement) {
            const loader = document.createElement('div');
            loader.className = 'loading';
            loader.textContent = 'Searching...';
            resultsGrid.parentNode.insertBefore(loader, resultsGrid);
        } else if (!isLoading && loadingElement) {
            loadingElement.remove();
        }
    }
    
    // Show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        resultsGrid.parentNode.insertBefore(errorDiv, resultsGrid);
    }
    
    // Show no results message
    function showNoResults() {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No results found. Try a different search term or image.';
        resultsGrid.appendChild(noResults);
    }
    
    // Event Listeners
    
    // Text search on button click
    searchButton.addEventListener('click', () => {
        performTextSearch(searchInput.value);
    });
    
    // Text search on Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performTextSearch(searchInput.value);
        }
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            performImageSearch(file);
        }
    });
    
    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropZone.classList.add('drop-zone--over');
    }
    
    function unhighlight() {
        dropZone.classList.remove('drop-zone--over');
    }
    
    // Handle dropped files
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        
        if (file && file.type.startsWith('image/')) {
            fileInput.files = dt.files;
            performImageSearch(file);
        } else {
            showError('Please upload an image file (JPEG, PNG, GIF)');
        }
    });
    
    // Click on drop zone to open file dialog
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
});