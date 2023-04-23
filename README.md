# Rim Jobs 

Autoparts and vehicles through air, sea and land.

We promise you'll always leave satisfied.

#  To Do List

### **Customer**

- [X] View all products
- [X] Shopping cart
	- [X] Add items to cart
	- [X] Remove items from cart
- [ ] Checkout system
	- [X] Third party cc authorization linked
	- [X] Creates order in db
	- [ ] Upon succesfull payment received by 3rd party, a confirmation is sent to the customers email
	
### **Employee**
- [ ] View all orders
	-  [ ] Should be able to sort by status, total cost, weight, ECT...
- [ ] Update orders status
- [ ] Update inventory upon arrival of new merchandise
- [ ] Add shipping label and invoice 

### **Administrator**
- [ ] View all orders
   - [ ] Should be able to sort by status, total cost, weight, ECT...
- [ ] Set shipping and handling charges (based on weight brackets)

### **Features to implement**
- [ ] Employee and or Administrator login / verification system

# Rimjobs Details

This is a group project for NIUs CSCI 467 Software Engineering in Spring 2023.

Group members responsibilities are listed below:

| Member | Contribution |
|----:|:----|
| Matt | SASS, Vue 3, Bootstrap 5 |
| Ryan | Express.js, Vue 3, SQLite3 |
| Cesar | Express.js, Vue 3, SQLite3 |
| David | Express.js, Vue 3, Linode Server |

# Running The Project


### Clone the repo: 

`git clone https://github.com/467Group3A/rimjobs.git`

### cd into the repo:

`cd rimjobs/` 

### Install Dependencies:

`npm i` 

### Generate the DB (requires `bcrypt` pip package):

`python3 generateDB.py` 

### Start up the server:

`npm run start` 

### Heres a chained command

`git clone https://github.com/467Group3A/rimjobs.git && cd rimjobs/ && npm i && python3 generateDB.py && npm run start`

