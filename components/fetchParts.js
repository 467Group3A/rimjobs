// This file is used to fetch the parts from the database and display them on the page
// The page number is incremented or decremented when the user clicks the next or previous page buttons
// Another way to do this would be to append the page number to the end of the URL.
// Like so:
// .com/legacy-parts?page=1 & per=30
// .com/legacy-parts?page=2 & per=10
// .com/legacy-parts?page=3 & per=25
//
$(document).ready(function () {
    endpoint = '/legacyparts?page=';
    pageNumber = 1;
    perQuery = '&per=';
    // Change this number to get more or less per page
    perPage = 30;
    const app = Vue.createApp({
        data() {
            return {
                finalRows: [],
                inventory: [],
                newParts: [],
                searchFor: '',
                minPrice: null,
                maxPrice: null,
                qty: [],
                searchTerm: '',
                visible: true,
                nothingFound: false
            };
        },
        computed: {
            filteredParts() {
                let parts = this.finalRows.filter(part => {
                    return part.description.toLowerCase().includes(this.searchFor.toLowerCase());
                });

                
                if (this.minPrice !== null && this.maxPrice !== null && this.minPrice !== '' && this.maxPrice !== '') {
                    parts = parts.filter(part => {
                        return parseFloat(part.price) >= parseFloat(this.minPrice) &&
                            parseFloat(part.price) <= parseFloat(this.maxPrice);
                    });
                }

                return parts;
            },
            isInCart() {
                return (itemNumber) => {
                    // Check if the item is already in the cart
                    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
                    return cartItems.some((item) => item.item_id === itemNumber);
                };
            },
        },
        mounted() {
            // The Spaghetti factory - 4/14/23
            for (let i = 1; i < 31; i++) {
                this.qty.push(1);
            }
            Promise.all([
                fetch(endpoint + pageNumber + perQuery + perPage).then((res) => res.json()),
                fetch('/inventory').then((res) => res.json()),
            ])
                .then(([legacyPartsResponse, inventoryResponse]) => {
                    this.finalRows = legacyPartsResponse;
                    this.inventory = inventoryResponse;
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        methods: {
            //
            // Capitalizes the first letter of each word
            capitalize(str) {
                return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
            },
            async searchPart() {
                this.visible = false;
                const response = await fetch(`api/search?searchTerm=${encodeURIComponent(this.searchTerm)}`);
                const part = await response.json();
                if (part.length == 0) {
                    this.nothingFound = true;
                    this.finalRows = [];
                } else {
                    this.nothingFound = false;
                    this.finalRows = part;
                }
            },
            //
            // Increments the page number and fetches the next page
            subPage() {
                // If youre on the first page, theres nowhere else to go.
                if (pageNumber != 1) {
                    pageNumber--;
                }
                fetch(endpoint + pageNumber + perQuery + perPage)
                    .then(response => response.json())
                    .then(data => {
                        this.finalRows = data;
                    })
                    .catch(error => {
                        console.log('Error:', error);
                    });
                    this.qty = [];
                    for (let i = 1; i < 31; i++) {
                        this.qty.push(1);
                    }
            },
            //
            // Increment the page number and fetches the next page
            addPage() {
                // If the amount of items displayed does not equal
                // how many should be displayed, you are at the end
                if (this.finalRows.length != perPage) {
                    // Send pack to page 1
                    pageNumber = 1;
                } else {
                    pageNumber++;
                }
                fetch(endpoint + pageNumber + perQuery + perPage)
                    .then(response => response.json())
                    .then(data => {
                        this.finalRows = data;
                    })
                    .catch(error => {
                        console.log('Error:', error);
                    });
                    // reset qty array
                    this.qty = [];
                    for (let i = 1; i < 31; i++) {
                        this.qty.push(1);
                    }
            },
            addToCart(picture, item_id, item_name, weight, price, max, quantity) {
                // if quantity sent is higher than the quantity in stock, set quantity to the quantity in stock
                if (quantity > this.inventory[item_id - 1].quantity || quantity == null || quantity == '' || quantity <= 0) {
                    // nothing
                } else {
                    // Retrieve existing cart items from localStorage or create an empty array
                    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

                    // Check if the selected item is already in the cart
                    let itemIndex = cartItems.findIndex(item => item.item_id === item_id);
                    if (itemIndex > -1) {
                        // Update the quantity if the item is already in the cart
                        // If the quantity is higher than the quantity in stock, set quantity to the quantity in stock
                        if (cartItems[itemIndex].quantity + quantity > this.inventory[item_id - 1].quantity) {
                            cartItems[itemIndex].quantity = this.inventory[item_id - 1].quantity;
                        }
                        else {
                            cartItems[itemIndex].quantity += quantity;
                        }
                    } else {
                        // Add the selected item to the cart
                        let newItem = {
                            pictureURL: picture,
                            item_id: item_id,
                            item_name: item_name,
                            weight: weight,
                            price: price,
                            max: this.inventory[item_id - 1].quantity,
                            quantity: quantity
                        };
                        cartItems.push(newItem);
                        // Navbar listens for event and adds the number to its "Cart (X)" number
                        window.dispatchEvent(new CustomEvent('ad', {
                            detail: {
                              count: 1
                            }
                        }));
                    }

                    // Store the updated cart items in localStorage
                    localStorage.setItem('cartItems', JSON.stringify(cartItems));
                    event.target.innerHTML = "Added";
                }
            }
        }
    }).mount('#inventory');
});