import sqlite3
#
#  CSCI 467 Group 3A
#  Matt, David, Ryan, and Cesar
#
#  This is a helper script to destroy the database.
#  
#  This is used in tandem with generateDB.py to 
#  create the database and example data.
#
con = sqlite3.connect("rimjobs.db")

cursor = con.cursor()

cursor.execute("DROP TABLE IF EXISTS orderitems;")
cursor.execute("DROP TABLE IF EXISTS orders;")
cursor.execute("DROP TABLE IF EXISTS brackets;")
cursor.execute("DROP TABLE IF EXISTS inventory;")
cursor.execute("DROP TABLE IF EXISTS users;")

con.commit()
con.close()