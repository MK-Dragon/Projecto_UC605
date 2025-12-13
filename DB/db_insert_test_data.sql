-- Inserting data into the 'stores' table
INSERT INTO `Logistica_605Forte`.`stores` (`name`) VALUES
('Main City Branch'),
('Suburban Outlet'),
('Online Warehouse'),
('West Side Shop');


-- Inserting data into the 'categories' table
INSERT INTO `Logistica_605Forte`.`categories` (`name`) VALUES
('Electronics'),
('Apparel'),
('Home Goods'),
('Groceries');


-- Inserting data into the 'products' table
INSERT INTO `Logistica_605Forte`.`products` (`name`, `id_category`) VALUES
('Smartphone X', 1),   -- Electronics
('Laptop Pro', 1),     -- Electronics
('T-Shirt Cotton', 2), -- Apparel
('Jeans Slim Fit', 2), -- Apparel
('Blender 5000', 3),   -- Home Goods
('Coffee Maker', 3),   -- Home Goods
('Organic Apples', 4), -- Groceries
('Milk Gallon', 4);    -- Groceries


-- Inserting data into the 'store_stock' table
INSERT INTO `Logistica_605Forte`.`store_stock` (`id_store`, `id_product`, `quant`) VALUES
-- Main City Branch (id=101) Stock
(1, 1, 50),  -- Smartphone X
(1, 2, 200), -- T-Shirt Cotton
(1, 3, 15),  -- Blender 5000
(1, 3, 100), -- Organic Apples

-- Suburban Outlet (id=102) Stock
(2, 1, 25),  -- Laptop Pro
(2, 2, 150), -- Jeans Slim Fit
(2, 3, 80),  -- Milk Gallon

-- Online Warehouse (id=103) Stock - High quantities for tech
(3, 1, 500), -- Smartphone X
(3, 2, 300), -- Laptop Pro
(3, 4, 90),  -- Coffee Maker

-- West Side Shop (id=104) Stock - Mix
(4, 3, 50),  -- T-Shirt Cotton
(4, 5, 20),  -- Coffee Maker
(4, 4, 40);  -- Milk Gallon


INSERT INTO `Logistica_605Forte`.`users` 
    (`username`, `password`) 
VALUES 
    ('admin', 'uhIIeTqqVHM='),
    ('Marco', 'uhIIeTqqVHM='),
    ('Augosto', 'uhIIeTqqVHM=');