CREATE DATABASE IF NOT EXISTS orders_db;
USE orders_db;

CREATE TABLE IF NOT EXISTS users (
  user_id    INT AUTO_INCREMENT PRIMARY KEY,
  full_name  VARCHAR(150) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  mobile     VARCHAR(10)  NOT NULL UNIQUE,
  status     ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS orders (
  order_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  order_date   DATE NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS order_items (
  item_id      INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  quantity     INT NOT NULL,
  price        DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_items_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
) ENGINE=InnoDB;

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_items_order_id ON order_items(order_id);