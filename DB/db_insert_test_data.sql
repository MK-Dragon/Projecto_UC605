-- Inserting data into the 'stores' table
INSERT INTO `Logistica_605Forte`.`stores` (`id`, `name`) VALUES
(101, 'Main City Branch'),
(102, 'Suburban Outlet'),
(103, 'Online Warehouse'),
(104, 'West Side Shop');


-- Inserting data into the 'categories' table
INSERT INTO `Logistica_605Forte`.`categories` (`id`, `name`) VALUES
(1, 'Electronics'),
(2, 'Apparel'),
(3, 'Home Goods'),
(4, 'Groceries');


-- Inserting data into the 'products' table
INSERT INTO `Logistica_605Forte`.`products` (`id`, `name`, `id_category`) VALUES
(1001, 'Smartphone X', 1),   -- Electronics
(1002, 'Laptop Pro', 1),     -- Electronics
(2001, 'T-Shirt Cotton', 2), -- Apparel
(2002, 'Jeans Slim Fit', 2), -- Apparel
(3001, 'Blender 5000', 3),   -- Home Goods
(3002, 'Coffee Maker', 3),   -- Home Goods
(4001, 'Organic Apples', 4), -- Groceries
(4002, 'Milk Gallon', 4);    -- Groceries


-- Inserting data into the 'store_stock' table
INSERT INTO `Logistica_605Forte`.`store_stock` (`id_store`, `id_product`, `quant`) VALUES
-- Main City Branch (id=101) Stock
(101, 1001, 50),  -- Smartphone X
(101, 2001, 200), -- T-Shirt Cotton
(101, 3001, 15),  -- Blender 5000
(101, 4001, 100), -- Organic Apples

-- Suburban Outlet (id=102) Stock
(102, 1002, 25),  -- Laptop Pro
(102, 2002, 150), -- Jeans Slim Fit
(102, 4002, 80),  -- Milk Gallon

-- Online Warehouse (id=103) Stock - High quantities for tech
(103, 1001, 500), -- Smartphone X
(103, 1002, 300), -- Laptop Pro
(103, 3002, 90),  -- Coffee Maker

-- West Side Shop (id=104) Stock - Mix
(104, 2001, 50),  -- T-Shirt Cotton
(104, 3002, 20),  -- Coffee Maker
(104, 4002, 40);  -- Milk Gallon