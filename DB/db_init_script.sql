DROP DATABASE IF EXISTS `Logistica_605Forte`;

-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema Logistica_605Forte
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema Logistica_605Forte
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `Logistica_605Forte` DEFAULT CHARACTER SET utf8 ;
USE `Logistica_605Forte` ;

-- -----------------------------------------------------
-- Table `Logistica_605Forte`.`stores`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Logistica_605Forte`.`stores` (
  `id` INT NOT NULL auto_increment,
  `name` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Logistica_605Forte`.`categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Logistica_605Forte`.`categories` (
  `id` INT NOT NULL auto_increment,
  `name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `name_UNIQUE` (`name` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Logistica_605Forte`.`products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Logistica_605Forte`.`products` (
  `id` INT NOT NULL auto_increment,
  `name` VARCHAR(45) NOT NULL,
  `id_category` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `id_idx` (`id_category` ASC) VISIBLE,
  CONSTRAINT `category`
    FOREIGN KEY (`id_category`)
    REFERENCES `Logistica_605Forte`.`categories` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Logistica_605Forte`.`store_stock`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Logistica_605Forte`.`store_stock` (
  `id_store` INT NOT NULL,
  `id_product` INT NOT NULL,
  `quant` INT NULL,
  INDEX `store_idx` (`id_store` ASC) VISIBLE,
  INDEX `product_idx` (`id_product` ASC) VISIBLE,
  CONSTRAINT `store`
    FOREIGN KEY (`id_store`)
    REFERENCES `Logistica_605Forte`.`stores` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `product`
    FOREIGN KEY (`id_product`)
    REFERENCES `Logistica_605Forte`.`products` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Logistica_605Forte`.`users`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Logistica_605Forte`.`users` (
  `id` INT NOT NULL auto_increment,
  `username` VARCHAR(45) NOT NULL,
  `password` VARCHAR(100) NOT NULL,
  `expires_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,       -- The exact time the token expires
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- When the token was issued
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
