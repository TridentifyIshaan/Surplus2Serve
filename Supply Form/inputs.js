// Crop Name
const cropOptions = {
    "Staple Grains": ["Bajra", "Rice", "Wheat", "Maize", "Jowar", "Ragi", "Barley", "Sorghum", "Millet", "Amaranth"],
    "Vegetables": ["Tomato", "Potato", "Onion", "Spinach", "Cauliflower", "Cabbage", "Brinjal", "Bitter Gourd", "Lady Finger", "Bottle Gourd"],
    "Fruits": ["Mango", "Banana", "Papaya", "Guava", "Lychee", "Jackfruit", "Custard Apple", "Pomegranate",  "Chikoo", "Pineapple"],
    "Spices": ["Garlic", "Ginger", "Turmeric", "Cardamom", "Cinnamon", "Clove", "Black Pepper", "Cumin", "Coriander", "Fenugreek"],
    "Pulses": ["Chickpea", "Red Lentil", "Yellow Lentil", "Green Gram", "Black Gram", "Pigeon Pea", "Kidney Bean"],
    "Oilseeds": ["Mustard", "Sesame", "Groundnut", "Sunflower", "Soybean", "Linseed", "Safflower", "Castor", "Coconut", "Palm"],
    "Cash Crops": ["Cotton", "Sugarcane", "Jute", "Coffee", "Tea", "Tobacco", "Rubber", "Cocoa", "Indigo", "Opium"],
    "Nuts": ["Almond", "Walnut", "Cashew", "Pistachio", "Peanut", "Hazelnut", "Pine Nut", "Chestnut", "Pecan", "Brazil Nut"],
    "Medicinal": ["Aloe Vera", "Ashwagandha", "Neem", "Tulsi", "Lemongrass", "Mint", "Stevia", "Saffron", "Moringa", "Brahmi"],
    "Root Crops": ["Sweet Potato", "Yam", "Taro", "Cassava", "Beet", "Radish", "Turnip", "Carrot", "Ginger Root", "Horseradish"],
    "Berries": ["Strawberry", "Mulberry", "Gooseberry", "Jamun", "Karonda", "Cranberry", "Blueberry", "Blackberry", "Raspberry", "Falsa"],
    "Ornamentals": ["Rose", "Marigold", "Jasmine", "Chrysamthemum", "Orchid", "Gladiolus", "Lily", "Dahlia", "Aster", "Balsem"]
};

const commoditySelect = document.getElementById('commodity');
const cropSelect = document.getElementById('crop');

commoditySelect.addEventListener('change', function() {
    const selected = this.value;
    cropSelect.innerHTML = '';
    if (cropOptions[selected]) {
        cropSelect.disabled = false;
        cropSelect.innerHTML = '<option value="">Select...</option>';
        cropOptions[selected].forEach(crop => {
            const opt = document.createElement('option');
            opt.value = crop;
            opt.textContent = crop;
            cropSelect.appendChild(opt);
        });
    } else {
        cropSelect.disabled = true;
        cropSelect.innerHTML = '<option value="">Select commodity first...</option>';
    }
});

// Quantity
document.getElementById('quantity').addEventListener('input', function (e) {
    // Remove any non-digit characters
    this.value = this.value.replace(/[^0-9]/g, '');
});

// Location with coordinates and reverse geocoding using Nominatim API
document.getElementById('gps-btn').addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // Use Nominatim reverse geocoding API
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`)
                .then(response => response.json())
                .then(data => {
                    if (data.display_name) {
                        document.getElementById('address').value = data.display_name;
                    } else {
                        document.getElementById('address').value = `Lat: ${lat}, Lon: ${lon}`;
                    }
                })
                .catch(() => {
                    document.getElementById('address').value = `Lat: ${lat}, Lon: ${lon}`;
                });
                
        }, function(error) {
            alert('Unable to retrieve your location.');
        });
    } else {
        alert('Geolocation is not supported by your browser.');
    }
});

// Temperature of the crop
document.getElementById('temperature').addEventListener('input', function (e) {
    // Allow digits and a single leading minus sign
    this.value = this.value.replace(/(?!^)-|[^0-9-]/g, '').replace(/^-?(.*)-/, '-$1');
    // Ensure only one leading minus
    if (this.value.indexOf('-') > 0) {
        this.value = this.value.replace(/-/g, '');
    }
});

// Humidity of the crop
document.getElementById('humidity').addEventListener('input', function (e) {
    // Remove any non-digit characters
    this.value = this.value.replace(/[^0-9]/g, '');
});

// Days Since Harvest
document.getElementById('days since harvest').addEventListener('input', function (e) {
    // Remove any non-digit characters
    this.value = this.value.replace(/[^0-9]/g, '');
});

// Available from Date
document.getElementById('date').addEventListener('keydown', function(e) {
    e.preventDefault();
});

// Set max date to today
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const maxDate = `${yyyy}-${mm}-${dd}`;
    document.getElementById('date').setAttribute('max', maxDate);
});