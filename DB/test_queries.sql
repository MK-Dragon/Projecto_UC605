use Logistica_605Forte;

select * from users;

select * from categories;

select * from products;

SELECT * FROM Logistica_605Forte.store_stock;



SELECT
    s.id AS store_id,
    s.name AS store_name,
    p.id AS product_id,
    p.name AS product_name,
    c.id AS category_id,
    c.name AS category_name,
    ss.quant AS quantity
FROM
    store_stock ss
JOIN
    stores s ON ss.id_store = s.id
JOIN
    products p ON ss.id_product = p.id
JOIN
    categories c ON p.id_category = c.id;