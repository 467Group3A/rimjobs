// This is a work in progress
// This does not show up on the page yet
$(document).ready(function () {
    const app = Vue.createApp({
        data() {
            return {
                cartItems: JSON.parse(localStorage.getItem('cartItems')) || []
            }
        },
        mounted() {
            Promise.all([
                //fetch(endpoint + pageNumber + perQuery + perPage).then((res) => res.json()),
                fetch('/inventory').then((res) => res.json()),
            ])
                .then(([inventoryResponse]) => {
                    //this.finalRows = legacyPartsResponse;
                    this.inventory = inventoryResponse;
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        computed: {
            total() {
                return this.cartItems.reduce((total, item) => {
                    return total + (item.quantity * item.price);
                }, 0);
            },
            totalWeight() {
                return this.cartItems.reduce((total, item) => {
                    return total + (item.quantity * item.weight);
                }, 0);
            }
        },
        methods: {
            checkout() {
                let total = this.cartItems.reduce((total, item) => {
                    return total + (item.quantity * item.price);
                }, 0);
                localStorage.setItem('totalCost', JSON.stringify(total));
            },
            removeFromCart(index) {
                this.cartItems.splice(index, 1);
                localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
            },
            updateQuantity(index, quantity) {
                if (quantity < 1) {
                    quantity = 1;
                 }
                this.cartItems[index].quantity = quantity;
                localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
            },
            fixed(number){
                return number.toFixed(2);
            }
        }
    }).mount('#cart');
});