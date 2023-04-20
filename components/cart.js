// This is a work in progress
// This does not show up on the page yet
$(document).ready(function () {
    const cart = Vue.createApp({
        data() {
            return {
                cartItems: [],
                shippingfees: [],
                taxRate: 1.1,
            }
        },
        mounted() {
            console.log('cart mounted')
            this.cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            Promise.all([
                fetch('/api/get-shipping-fees').then((res) => res.json()),
                fetch('/inventory').then((res) => res.json()),
            ])
                .then(([shippingfeesResponse, inventoryResponse]) => {
                    this.shippingfees = shippingfeesResponse;
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
            },
            shippingCost() {
                for (let i = 0; i < this.shippingfees.length; i++) {
                    if (this.totalWeight <= this.shippingfees[i].weight) {
                        return parseInt(this.shippingfees[i].cost);
                    }
                }
            }
        },
        methods: {
            capitalize(str) {
                return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
            },
            checkout() {
                let total = this.cartItems.reduce((total, item) => {
                    return total + (item.quantity * item.price);
                }, 0);
                localStorage.setItem('totalCost', JSON.stringify(total));
                localStorage.setItem('shippingCost', JSON.stringify(this.shippingCost));
            },
            removeFromCart(index) {
                this.cartItems.splice(index, 1);
                localStorage.setItem('cartItems', JSON.stringify(this.cartItems));
                window.dispatchEvent(new CustomEvent('sb', {
                    detail: {
                      count: 1
                    }
                }));
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