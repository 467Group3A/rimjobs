// Used for vieworderdetails page
$(document).ready(function () {
    const app = Vue.createApp({
        data() {
        return {
            options: [
                { label: 'In Progress', value: 'In Progress' },
                { label: 'Filled', value: 'Filled' },
                { label: 'Canceled', value: 'Canceled' }
            ],
            selectedOption: null,
            selectedOrder: null,
            hideForPrint: false, // used for printing invoice
            printingLabel: false, // used for printing shipping label
            shippingDate: '',
            message: '' // Return of updateOrder
        };
        },
        methods: {
        fixed(number){
            return number.toFixed(2);
        },
        async getOrderDetails(orderId) {
        try {
            const response = await fetch(`/api/orderdetails/${orderId}`);
            const orderDetails = await response.json();
            this.selectedOrder = orderDetails;
        } catch (error) {
            console.log(error);
        }
        },
        updateOrder() { // Updates the status of an order
        const body = {
            orderId: this.selectedOrder.orderId,
            orderStatus: this.selectedOption
        }
        fetch('/api/updateorder', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        .then(response => { // Dependant on server status response
            if(response.status == '200'){ 
            this.message = "Updated order status successfully!"
            } else if (response.status == '500') {
            this.message = "Unable to update order status!"
            }
        })
        // Force refresh page
        location.reload()
        },
        printInvoice(){
        
        this.hideForPrint = true;

        // wait for 500ms (half a second)
        setTimeout(() => {
        // print the page
        window.print();

        // set hideForPrint back to false
        this.hideForPrint = false;
        }, 500);
        },
        printLabel(){
        
        this.printingLabel = true;

        // wait for 500ms (half a second)
        setTimeout(() => {
        // print the page
        window.print();

        // set hideForPrint back to false
        this.printingLabel = false;
        }, 500);
        }
    },
        mounted() {
        const searchParams = new URLSearchParams(window.location.search);
        const orderId = searchParams.get('id'); // Grab ID from url
        this.getOrderDetails(orderId) 
        const d = new Date(); // Constructs the current time for printing a shipping label
        const day = d.getDate();
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const hour = d.getHours();
        const minutes = d.getMinutes();
        const seconds = d.getSeconds();
        this.shippingDate = `${year}-${month}-${day} ${hour}:${minutes}:${seconds}` // Formatted like our new DBs timestamp

        }
    }).mount('#app');
})