// Example data
const crops = [
    {
        name: "Tomato",
        temperature: "12°C",
        humidity: "85%",
        spoilage: "10%",
        shelf: "7 days",
        location: "Delhi",
        quantity: 100
    },
    {
        name: "Potato",
        temperature: "8°C",
        humidity: "90%",
        spoilage: "5%",
        shelf: "30 days",
        location: "Punjab",
        quantity: 200
    },
    {
        name: "Mango",
        temperature: "10°C",
        humidity: "80%",
        spoilage: "15%",
        shelf: "5 days",
        location: "Maharashtra",
        quantity: 50
    }
    // Add more crop objects as needed
];

function renderResults(data) {
    const results = document.getElementById('results');
    results.innerHTML = '';
    if (data.length === 0) {
        results.innerHTML = '<p>No crops found.</p>';
        return;
    }
    data.forEach(crop => {
        const card = document.createElement('div');
        card.className = 'crop-card';
        card.innerHTML = `
            <div class="crop-title">${crop.name}</div>
            <div class="crop-info">Temperature: ${crop.temperature}</div>
            <div class="crop-info">Humidity: ${crop.humidity}</div>
            <div class="crop-info">Spoilage Rate: ${crop.spoilage}</div>
            <div class="crop-info">Shelf Life: ${crop.shelf}</div>
            <div class="crop-info">Location: ${crop.location}</div>
            <div class="crop-info">Quantity: ${crop.quantity}</div>
        `;
        results.appendChild(card);
    });
}

function searchCrops() {
    const searchVal = document.getElementById('search-bar').value.toLowerCase();
    const minQty = parseInt(document.getElementById('quantity-filter').value) || 0;
    const sortBy = document.getElementById('sort-by').value;

    let filtered = crops.filter(crop =>
        crop.name.toLowerCase().includes(searchVal) &&
        crop.quantity >= minQty
    );

    if (sortBy === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'spoilage') {
        filtered.sort((a, b) => parseFloat(a.spoilage) - parseFloat(b.spoilage));
    } else if (sortBy === 'shelf') {
        filtered.sort((a, b) => {
            // Extract number of days from shelf string
            const daysA = parseInt(a.shelf) || 0;
            const daysB = parseInt(b.shelf) || 0;
            return daysB - daysA;
        });
    }

    renderResults(filtered);
}

document.getElementById('search-btn').addEventListener('click', searchCrops);

// Only allow letters and space for crop search
document.getElementById('search-bar').addEventListener('keydown', function(e) {
    if (
        !(
            (e.key >= 'a' && e.key <= 'z') ||
            (e.key >= 'A' && e.key <= 'Z') ||
            e.key === ' ' ||
            e.key === 'Backspace' ||
            e.key === 'Delete' ||
            e.key === 'ArrowLeft' ||
            e.key === 'ArrowRight' ||
            e.key === 'Tab'
        )
    ) {
        e.preventDefault();
    }
});

// Only allow numbers for quantity filter
document.getElementById('quantity-filter').addEventListener('keydown', function(e) {
    if (
        !(
            (e.key >= '0' && e.key <= '9') ||
            e.key === 'Backspace' ||
            e.key === 'Delete' ||
            e.key === 'ArrowLeft' ||
            e.key === 'ArrowRight' ||
            e.key === 'Tab'
        )
    ) {
        e.preventDefault();
    }
});

// Initial render
renderResults(crops);