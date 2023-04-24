$(document).ready(function () {
  endpoint = '/legacyparts?page=';
  pageNumber = 1;
  perQuery = '&per=';
  // Change this number to get more or less per page
  perPage = 6;
  const app = Vue.createApp({
    data() {
      return {
        finalRows: [],
        inventory: [],
        qty: []
      };
    },
    computed: {
      isInCart() {
        return (itemNumber) => {
          // Check if the item is already in the cart
          const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
          return cartItems.some((item) => item.item_id === itemNumber);
        };
      }
    },
    mounted() {
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
      capitalize(str) {
        return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
      },
      // Increments the page number and fetches the next page
      subPage() {
        pageNumber--;
        // If previous page is 0, set the page to 23 (end of DB)
        if (pageNumber == 0) {
          pageNumber = 23;
        }
        fetch(endpoint + pageNumber + perQuery + perPage)
          .then(response => response.json())
          .then(data => {
            this.finalRows = data;
            console.log(`Page #${pageNumber} sent.`)
          })
          .catch(error => {
            console.log('Error:', error);
          });
      },
      //
      // Increment the page number and fetches the next page
      addPage() {
        pageNumber++;
        // If next page is the end, send back to the first
        if (pageNumber == 24) {
          pageNumber = 1;
        }
        fetch(endpoint + pageNumber + perQuery + perPage)
          .then(response => response.json())
          .then(data => {
            this.finalRows = data;
            console.log(`Page #${pageNumber} sent.`)
          })
          .catch(error => {
            console.log('Error:', error);
          });
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
  }).mount('#featured');
});