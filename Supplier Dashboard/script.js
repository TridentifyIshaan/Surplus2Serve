document.addEventListener('DOMContentLoaded', function () {
    const addBtn = document.getElementById('add-product-btn');
    const formDiv = document.getElementById('supply-form');
    const submittedList = document.getElementById('submitted-products-list');

    // The actual supply form HTML (with GPS button)
    const formHTML = `
        <form class="form-container" id="supplyForm">
            <h2>Surplus 2 Serve - Supply Form</h2>
            <label for="org">Organization / Business Name</label>
            <input type="text" id="org" name="org">
            <label for="phone">Phone Number <span class="required">*</span></label>
            <input type="tel" id="phone" name="phone" required pattern="[0-9+\\-\\s]{8,}">
            <label for="commodity">Commodity Type <span class="required">*</span></label>
            <select id="commodity" name="commodity" required>
                <option value="">Select...</option>
                <option>Staple Grains</option>
                <option>Vegetables</option>
                <option>Fruits</option>
                <option>Spices</option>
                <option>Pulses</option>
                <option>Oilseeds</option>
                <option>Cash Crops</option>
                <option>Nuts</option>
                <option>Medicinal</option>
                <option>Root Crops</option>
                <option>Berries</option>
                <option>Ornamentals</option>
            </select>
            <label for="crop">Crop Name <span class="required">*</span></label>
            <select id="crop" name="crop" required disabled>
                <option value="">Select commodity first...</option>
            </select>
            <label for="quantity">Quantity (kg/units) <span class="required">*</span></label>
            <input type="number" id="quantity" name="quantity" min="1" required>
            <label for="state">Pickup Location (State/UT) <span class="required">*</span></label>
            <select id="state" name="state/ut" required>
                <option value="">Select...</option>
                <option>Andaman and Nicobar Islands</option>
                <option>Andhra Pradesh</option>
                <option>Arunachal Pradesh</option>
                <option>Assam</option>
                <option>Bihar</option>
                <option>Chandigarh</option>
                <option>Chhattisgarh</option>
                <option>Dadra and Nagar Haveli and Daman and Diu</option>
                <option>Delhi</option>
                <option>Goa</option>
                <option>Gujarat</option>
                <option>Haryana (Chandigarh is seperate option)</option>
                <option>Himachal Pradesh</option>
                <option>Jammu and Kashmir</option>
                <option>Jharkhand</option>
                <option>Karnataka</option>
                <option>Kerala</option>
                <option>Ladakh</option>
                <option>Lakshadweep</option>
                <option>Madhya Pradesh</option>
                <option>Maharashtra</option>
                <option>Manipur</option>
                <option>Meghalaya</option>
                <option>Mizoram</option>
                <option>Nagaland</option>
                <option>Odisha</option>
                <option>Puducherry</option>
                <option>Punjab (Chandigarh is seperate option)</option>
                <option>Rajasthan</option>
                <option>Sikkim</option>
                <option>Tamil Nadu</option>
                <option>Telangana</option>
                <option>Tripura</option>
                <option>Uttar Pradesh</option>
                <option>Uttarakhand</option>
                <option>West Bengal</option>
            </select>
            <label for="address">Full Address of Pickup <span class="required">*</span></label>
            <div class="address-row">
                <input type="text" id="address" name="address" required>
                <button type="button" id="gps-btn" class="gps-btn">📍</button>
            </div>
            <label for="temperature"> Temperature of the crop (in °C) <span class="required">*</span></label>
            <input type="number" id="temperature" name="temperature" required max="50" min="-20">
            <label for="humidity"> Humidity level (in %) <span class="required">*</span></label>
            <input type="number" id="humidity" name="humidity" required min="0" max="100">
            <label for="storage type"> Storage Type <span class="required">*</span></label>
            <select id="storage type" name="storage type" required>
                <option value="">Select...</option>
                <option>Cold Storage</option>
                <option>Open Air Storage</option>
                <option>Room Temperature</option>
            </select>
            <label for="date">Available From <span class="required">*</span></label>
            <input type="date" id="date" name="date" required min="2020-01-01" >
            <label for="days since harvest"> Days since Harvest <span class="required">*</span></label>
            <input type="number" id="days since harvest" name="days since harvest" required min="0" max="100">
            <label for="notes">Additional Notes</label>
            <textarea id="notes" name="notes" placeholder="Any special instructions or details..."></textarea>
            <button type="submit" class="submit-btn">Submit</button>
            <button type="button" id="cancel-btn" class="submit-btn" style="background:#ccc;margin-top:8px;">Cancel</button>
        </form>
    `;

    // Crop options for commodity
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

    addBtn.addEventListener('click', function () {
        formDiv.innerHTML = formHTML;
        formDiv.classList.remove('hidden');

        // Attach all event listeners after form is injected
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

        document.getElementById('quantity').addEventListener('input', function (e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        // Geolocation button
        document.getElementById('gps-btn').addEventListener('click', function() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
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

        document.getElementById('temperature').addEventListener('input', function (e) {
            this.value = this.value.replace(/(?!^)-|[^0-9-]/g, '').replace(/^-?(.*)-/, '-$1');
            if (this.value.indexOf('-') > 0) {
                this.value = this.value.replace(/-/g, '');
            }
        });

        document.getElementById('humidity').addEventListener('input', function (e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        document.getElementById('days since harvest').addEventListener('input', function (e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        document.getElementById('date').addEventListener('keydown', function(e) {
            e.preventDefault();
        });

        // Set max date to today
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const maxDate = `${yyyy}-${mm}-${dd}`;
        document.getElementById('date').setAttribute('max', maxDate);

        // Cancel button hides the form
        document.getElementById('cancel-btn').onclick = function () {
            formDiv.classList.add('hidden');
            formDiv.innerHTML = '';
        };

        // Handle form submission
        document.getElementById('supplyForm').onsubmit = function (e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const product = formData.get('crop');
            const quantity = formData.get('quantity');
            const state = formData.get('state/ut');
            const date = formData.get('date');
            const li = document.createElement('li');
            li.textContent = `Product: ${product}, Quantity: ${quantity}, State: ${state}, Available From: ${date}`;
            submittedList.appendChild(li);

            // Reset and hide form
            formDiv.classList.add('hidden');
            formDiv.innerHTML = '';
        };
    });
});