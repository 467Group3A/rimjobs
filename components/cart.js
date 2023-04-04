// This is a work in progress
// This does not show up on the page yet
$(document).ready(function () {
    const nav = Vue.createApp({
        el: "#cart",
        data: {
            items: [],
            shop: shop,
            showCart: false,
            verified: false,
            quantity: 1
        },
        computed: {
            total() {
                var total = 0;
                for (var i = 0; i < this.items.length; i++) {
                    total += this.items[i].price;
                }
                return total;
            }
        },
        methods: {
            addToCart(item) {
                item.quantity += 1;
                this.items.push(item);
            },
            removeFromCart(item) {
                item.quantity -= 1;
                this.items.splice(this.items.indexOf(item), 1);
            }
        }
    });
});