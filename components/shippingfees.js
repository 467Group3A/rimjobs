// Front end js for administrators to adjust shipping weight brackets

$(document).ready(function () {
    const app = Vue.createApp({
        data() {
           return {
             shippingData: [],
             addWeight: null,
             addCost: null,
             errMsg: '',
             ship: [] // used for test cases
           }
         },
         computed: {
             // Client side system that displays weights in brackets
             // Will only count the cost if weight is <= a bracket entry
             shippingBrackets() {
                 // if its empty dont bother, return
                 if (this.shippingData.length === 0) {
                   return [{ weight: 'All shipping is', cost: 'free' }]
                 }
                 const brackets = []
                 let prevWeight = 0
                 let prevCost = 0
                 let isFirstBracket = true
                 // Loops through shippingData, constructing an array
                 // IT MUST keep track of previous weight/cost entry in brackets table
                 for (const shippingBracket of this.shippingData) {
                     let weightRange
                     let cost
                     if (isFirstBracket) { // Dynamically assign first bracket, MIGHT "still" BE A BUG with this
                         weightRange = `0 to ${shippingBracket.weight}`
                         cost = 'Free'
                         isFirstBracket = false
                     } else {  // Deals with the body of the entries between 1st - Nth entry
                         weightRange = `${prevWeight} to ${shippingBracket.weight}`
                         cost = prevCost === shippingBracket.cost ? shippingBracket.cost : `${prevCost}`
                     }
                     brackets.push({  // Take either entry and add to array
                         weight: weightRange,
                         cost: cost,
                         rawWeight: prevWeight
                     })
                     prevWeight = shippingBracket.weight // set for next bracket in loop
                     prevCost = shippingBracket.cost
                 } 
                 // Once it falls out of the loop, add `above Nth(weight) X(cost)` 
                 const lastWeightRange = `above ${prevWeight}`
                 const pc = `${prevCost}`
                 brackets.push({
                     weight: lastWeightRange,
                     cost: pc,
                     rawWeight: prevWeight
                 })
                 return brackets
             }
         },
         mounted() {
             fetch('/api/get-shipping-fees')
               .then(response => response.json())
               .then(data => {
                 this.shippingData = data;
               })
               .catch(error => {
                 console.log('Error:', error);
               });
           },
         methods: {
           removeBracket(weight,cost) {
             // add removal button for each bracket
             // function should pass the the cost , will need to find a way to format cost with $ in loop
             console.log(weight)
             console.log(cost)
             fetch('/api/del-shipping-fee', {
                   method: 'POST',
                   headers: {
                     'Content-Type': 'application/json'
                   },
                   body: JSON.stringify({
                     weight: weight,
                     cost: cost
                   })
                 })
                 .then(response => {
                   if (response.ok) {
                     //If success then reload page with new change
                     location.reload()
                   } else {
                     // Otherwise dont refresh and notify in console.
                     console.log("Error removing weight bracket.")
                   }
                 })
                 
           },
           addBracket() {
             // Check if the weight already has a cost for shipping
             const sameWeight = this.shippingData.find(sb => sb.weight == this.addWeight)
             if(sameWeight !== undefined){
               this.errMsg = `Already existing weight bracket for ${this.addWeight}lbs!`
               return
             } // If it doesnt then add it with new cost
             fetch('/api/add-shipping-fee', {
                   method: 'POST',
                   headers: {
                     'Content-Type': 'application/json'
                   },
                   body: JSON.stringify({
                     weight: this.addWeight,
                     cost: this.addCost
                   })
                 })
                 .then(response => {
                   if (response.ok) {
                     //If success then reload page with new change
                     this.addWeight = null
                     this.addCost = null
                     location.reload()
                   } else {
                     // Otherwise dont refresh and notify in console.
                     console.log("Error removing weight bracket.")
                   }
                 })
           }
         }
         
     }).mount('#app')
})