// Used to list orders for an employee/admin

    const app = Vue.createApp({
        data() {
        return {
            orders: [],
            selectedOrder: null,
            searchQuery: '',
            searchByStatus: '',
            minPrice: null,
            maxPrice: null
        };
        },
        computed: {
        filteredOrders() {
            let filtered = this.orders;

            // id search
            const query = this.searchQuery.toLowerCase().trim();
            if (query) {
            filtered = filtered.filter(order => {
                return order.id.toString().includes(query);
            });
            }

            // min/max price search
            if (this.minPrice && this.maxPrice) {
            filtered = filtered.filter(order => {
                return order.shipping + order.amount >= this.minPrice && order.shipping + order.amount <= this.maxPrice;
            });
            }

            // status search
            if (this.searchByStatus) {
            filtered = filtered.filter(order => {
                return order.status === this.searchByStatus;
            });
            }

            return filtered;
        }
        },

        methods: {
        // Removed and added vieworderdetails.html
        goToOrderDetails(orderId) {
        window.location.href = `/vieworderdetails?id=${orderId}`;
        }
        },
        mounted() {
        fetch('/api/orders-list')
            .then(response => response.json())
            .then(data => {
            this.orders = data;
            console.log('orders have been received!')
            })
            .catch(error => {
            console.log('Error:', error);
            });
        },
    }).mount('#app');
})
