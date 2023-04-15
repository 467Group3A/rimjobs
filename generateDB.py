import sqlite3
import random

con = sqlite3.connect("rimjobs.db")

cursor = con.cursor()

cursor.execute("""
CREATE TABLE brackets (
    id INTEGER PRIMARY KEY,
    weight REAL DEFAULT '0.00',
    cost REAL DEFAULT '0.00'
);""")

cursor.execute("""
CREATE TABLE inventory (
    id INTEGER PRIMARY KEY,
    quantity INTEGER
);""")

cursor.execute("""
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount REAL DEFAULT '0.00',
    weight REAL DEFAULT '0.00',
    shipping REAL DEFAULT '0.00',
    address TEXT NOT NULL,
    status TEXT DEFAULT 'In Progress'
);""")

cursor.execute("""
CREATE TABLE orderitems (
    orderid TEXT NOT NULL,
    partnumber INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (orderid, partnumber),
    FOREIGN KEY (orderid) REFERENCES orders(id) ON DELETE CASCADE
);""")


cursor.execute("INSERT INTO brackets (weight, cost) VALUES (10.0, 10.0);")
cursor.execute("INSERT INTO brackets (weight, cost) VALUES (25.0, 35.0);")
cursor.execute("INSERT INTO brackets (weight, cost) VALUES (50.0, 100.0);")
cursor.execute("INSERT INTO brackets (weight, cost) VALUES (100.0, 250.0);")
cursor.execute("INSERT INTO brackets (weight, cost) VALUES (250.0, 500.0);")

i = 1
for i in range(150):
    i = i + 1
    con.execute(f"INSERT INTO inventory (id, quantity) VALUES ({i}, {random.randint(0,75)});")

cursor.execute("INSERT INTO orders (id, name, email, amount, weight, shipping, address, status) VALUES ('1681-5893-9054', 'John Doe', 'john@example.com', 50.0, 3.0, 5.0, '123 Main St, Anytown, USA', 'In Progress');")
cursor.execute("INSERT INTO orders (id, name, email, amount, weight, shipping, address, status) VALUES ('1681-5893-7261', 'Yeehaw McCletus', 'notdavid@example.com', 75.0, 6.0, 8.0, '4500 East Berlin, Anytown, USA', 'In Progress');")
cursor.execute("INSERT INTO orders (id, name, email, amount, weight, shipping, address, status) VALUES ('1681-5893-6621', 'Jane Smith', 'jane@example.com', 75.0, 6.0, 8.0, '456 Oak St, Anytown, USA', 'Filled');")


cursor.execute("INSERT INTO orderitems (orderid, partnumber, quantity) VALUES ('1681-5893-9054', 1, 2);")
cursor.execute("INSERT INTO orderitems (orderid, partnumber, quantity) VALUES ('1681-5893-9054', 2, 1);")
cursor.execute("INSERT INTO orderitems (orderid, partnumber, quantity) VALUES ('1681-5893-7261', 1, 4);")
cursor.execute("INSERT INTO orderitems (orderid, partnumber, quantity) VALUES ('1681-5893-7261', 3, 2);")
cursor.execute("INSERT INTO orderitems (orderid, partnumber, quantity) VALUES ('1681-5893-6621', 120, 1);")
cursor.execute("INSERT INTO orderitems (orderid, partnumber, quantity) VALUES ('1681-5893-6621', 45, 5);")
cursor.execute("INSERT INTO orderitems (orderid, partnumber, quantity) VALUES ('1681-5893-6621', 66, 3);")

con.commit()
con.close()
