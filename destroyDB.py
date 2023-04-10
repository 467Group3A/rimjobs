import sqlite3
import random

con = sqlite3.connect("rimjobs.db")

cursor = con.cursor()

cursor.execute("DROP TABLE IF EXISTS orderitems;")
cursor.execute("DROP TABLE IF EXISTS orders;")
cursor.execute("DROP TABLE IF EXISTS brackets;")
cursor.execute("DROP TABLE IF EXISTS inventory;")

con.commit()
con.close()