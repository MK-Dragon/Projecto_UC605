-- =======================================================
-- Database Creation and Schema Setup for 605Forte (V3)
-- Includes Users, Simplified Categories, Items (with Price), and Stocks
-- =======================================================

DROP DATABASE IF EXISTS 605Forte;
CREATE DATABASE 605Forte;
USE 605Forte;

-- 1. Drop tables in dependency order for a clean restart
DROP TABLE IF EXISTS Stocks;
DROP TABLE IF EXISTS Items;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Users;


-- 2. Create the Users table (No change)
CREATE TABLE Users (
    user_id INT NOT NULL AUTO_INCREMENT,
    user_name VARCHAR(100) NOT NULL UNIQUE,
    PRIMARY KEY (user_id)
) ENGINE=InnoDB;


-- 3. Create the simplified Categories table
CREATE TABLE Categories (
    category_id INT NOT NULL AUTO_INCREMENT,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    PRIMARY KEY (category_id)
) ENGINE=InnoDB;


-- 4. Create the updated Items table
CREATE TABLE Items (
    item_id INT NOT NULL AUTO_INCREMENT,
    item_name VARCHAR(100) NOT NULL UNIQUE,
    id_category INT NOT NULL,  -- Foreign Key to Categories table
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),

    PRIMARY KEY (item_id),

    CONSTRAINT FK_Items_Categories FOREIGN KEY (id_category)
        REFERENCES Categories(category_id)
        ON DELETE RESTRICT -- Prevents deleting a category if items are linked to it
) ENGINE=InnoDB;


-- 5. Create the Stocks table (No change in structure)
CREATE TABLE Stocks (
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),

    PRIMARY KEY (user_id, item_id),

    CONSTRAINT FK_Stocks_Users FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT FK_Stocks_Items FOREIGN KEY (item_id)
        REFERENCES Items(item_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- 6. Insert Sample Data
INSERT INTO Users (user_name) VALUES ('Alex'), ('Beth');

INSERT INTO Categories (category_name) VALUES
('Raw Materials'),          -- ID 1
('Finished Goods'),         -- ID 2
('Equipment');              -- ID 3

INSERT INTO Items (item_name, id_category, price) VALUES
('Wood Log', 1, 1.50),      -- Raw Materials
('Iron Sword', 2, 89.99),   -- Finished Goods
('Mining Pick', 3, 35.00),  -- Equipment
('Stone', 1, 0.75);         -- Raw Materials

-- Inserts for Alex's (User ID 1) Stock
INSERT INTO Stocks (user_id, item_id, quantity) VALUES
(1, 1, 250), -- Alex (1) gets 250 Wood Logs (1)
(1, 3, 1);   -- Alex (1) gets 1 Mining Pick (3)



-- Reads --

-- Read all data from the Users table
SELECT * FROM Users;

-- Read all data from the Categories table
SELECT * FROM Categories;

-- Read all data from the Items table
SELECT * FROM Items;

-- Read all data from the Stocks table
SELECT * FROM Stocks;


-- Item owned by user 1
SELECT
    I.item_id,
    I.item_name,
    I.price,
    S.quantity
FROM
    Items AS I
INNER JOIN
    Stocks AS S ON I.item_id = S.item_id
WHERE
    S.user_id = 1;


