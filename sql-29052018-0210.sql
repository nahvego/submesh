-- phpMyAdmin SQL Dump
-- version 4.8.0.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 29-05-2018 a las 00:12:50
-- Versión del servidor: 5.7.17-log
-- Versión de PHP: 5.6.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `project`
--
CREATE DATABASE IF NOT EXISTS `project` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `project`;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bans`
--
-- Creación: 19-05-2018 a las 23:14:13
--

DROP TABLE IF EXISTS `bans`;
CREATE TABLE `bans` (
  `id` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `subID` int(11) DEFAULT NULL,
  `creationDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `endDate` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- RELACIONES PARA LA TABLA `bans`:
--   `subID`
--       `subscriptions` -> `id`
--   `userID`
--       `users` -> `id`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comments`
--
-- Creación: 19-05-2018 a las 22:51:08
--

DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `content` text NOT NULL,
  `authorID` int(11) DEFAULT NULL,
  `postID` int(11) NOT NULL,
  `replyTo` int(11) DEFAULT NULL,
  `creationDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- RELACIONES PARA LA TABLA `comments`:
--   `replyTo`
--       `comments` -> `id`
--   `postID`
--       `posts` -> `id`
--   `authorID`
--       `users` -> `id`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comment_votes`
--
-- Creación: 19-05-2018 a las 22:45:36
--

DROP TABLE IF EXISTS `comment_votes`;
CREATE TABLE `comment_votes` (
  `id` int(11) NOT NULL,
  `voterID` int(11) DEFAULT NULL,
  `commentID` int(11) NOT NULL,
  `creationDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- RELACIONES PARA LA TABLA `comment_votes`:
--   `commentID`
--       `comments` -> `id`
--   `voterID`
--       `users` -> `id`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permissions`
--
-- Creación: 28-05-2018 a las 16:22:35
--

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `codename` varchar(30) NOT NULL COMMENT 'En minúsculas separado por guiones, p.ej delete-subs',
  `name` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- RELACIONES PARA LA TABLA `permissions`:
--

--
-- Volcado de datos para la tabla `permissions`
--

INSERT INTO `permissions` (`codename`, `name`) VALUES
('delete-comments', 'Borrar comentarios'),
('delete-posts', 'Borrar posts'),
('delete-subs', 'Borrar subs'),
('delete-users', 'Borrar usuarios'),
('edit-subs', 'Editar subs'),
('edit-users', 'Editar usuarios'),
('get-full-profile', 'Leer perfil completo'),
('remove-comments', 'Desactivar comentarios'),
('remove-posts', 'Desactivar posts'),
('remove-subs', 'Desactivar subs');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `posts`
--
-- Creación: 19-05-2018 a las 16:24:43
--

DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts` (
  `id` int(11) NOT NULL,
  `title` varchar(50) NOT NULL,
  `content` text NOT NULL,
  `authorID` int(11) DEFAULT NULL,
  `subID` int(11) NOT NULL,
  `creationDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- RELACIONES PARA LA TABLA `posts`:
--   `authorID`
--       `users` -> `id`
--   `subID`
--       `subs` -> `id`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `post_votes`
--
-- Creación: 19-05-2018 a las 22:44:44
--

DROP TABLE IF EXISTS `post_votes`;
CREATE TABLE `post_votes` (
  `id` int(11) NOT NULL,
  `voterID` int(11) DEFAULT NULL,
  `postID` int(11) NOT NULL,
  `creationDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- RELACIONES PARA LA TABLA `post_votes`:
--   `postID`
--       `posts` -> `id`
--   `voterID`
--       `users` -> `id`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--
-- Creación: 28-05-2018 a las 16:14:30
-- Última actualización: 28-05-2018 a las 22:28:58
--

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(20) NOT NULL,
  `color` varchar(10) NOT NULL DEFAULT '#00A2E8' COMMENT 'Hex o RGB',
  `badge` varchar(10) NOT NULL COMMENT 'Pequeña identifiación del rol, p.ej [A] para Administrador'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- RELACIONES PARA LA TABLA `roles`:
--

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `name`, `color`, `badge`) VALUES
(1, 'Administrador', '#00A2E8', '[A]');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `role_permissions`
--
-- Creación: 28-05-2018 a las 16:27:46
-- Última actualización: 28-05-2018 a las 22:30:31
--

DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `roleID` int(11) NOT NULL,
  `permissionCode` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- RELACIONES PARA LA TABLA `role_permissions`:
--   `permissionCode`
--       `permissions` -> `codename`
--   `roleID`
--       `roles` -> `id`
--

--
-- Volcado de datos para la tabla `role_permissions`
--

INSERT INTO `role_permissions` (`roleID`, `permissionCode`) VALUES
(1, 'delete-comments'),
(1, 'delete-posts'),
(1, 'delete-subs'),
(1, 'delete-users'),
(1, 'edit-subs'),
(1, 'edit-users'),
(1, 'get-full-profile'),
(1, 'remove-comments'),
(1, 'remove-posts'),
(1, 'remove-subs');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subs`
--
-- Creación: 19-05-2018 a las 16:07:20
--

DROP TABLE IF EXISTS `subs`;
CREATE TABLE `subs` (
  `id` int(11) NOT NULL,
  `name` varchar(15) NOT NULL,
  `creationDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- RELACIONES PARA LA TABLA `subs`:
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `subscriptions`
--
-- Creación: 21-05-2018 a las 22:17:57
--

DROP TABLE IF EXISTS `subscriptions`;
CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `subID` int(11) NOT NULL,
  `creationDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isMod` tinyint(1) NOT NULL DEFAULT '0',
  `hasFullPermissions` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- RELACIONES PARA LA TABLA `subscriptions`:
--   `userID`
--       `users` -> `id`
--   `subID`
--       `subs` -> `id`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tokens`
--
-- Creación: 28-05-2018 a las 22:47:47
-- Última actualización: 28-05-2018 a las 22:47:48
--

DROP TABLE IF EXISTS `tokens`;
CREATE TABLE `tokens` (
  `id` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `token` varchar(80) NOT NULL,
  `creationDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- RELACIONES PARA LA TABLA `tokens`:
--   `userID`
--       `users` -> `id`
--

--
-- Volcado de datos para la tabla `tokens`
--

INSERT INTO `tokens` (`id`, `userID`, `token`, `creationDate`) VALUES
(1, 5, 'tokensito', '2018-05-28 22:36:42'),
(2, 6, 'tokensito', '2018-05-28 22:45:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--
-- Creación: 28-05-2018 a las 16:18:20
-- Última actualización: 28-05-2018 a las 22:46:17
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `creationDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `roleID` int(11) DEFAULT NULL,
  `name` varchar(15) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(75) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `avatar` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- RELACIONES PARA LA TABLA `users`:
--   `roleID`
--       `roles` -> `id`
--

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `creationDate`, `roleID`, `name`, `email`, `password`, `description`, `avatar`) VALUES
(5, '2018-05-27 15:06:04', 1, 'pepito', 'pepito@pepe.com', '123123', 'HOLA', '??'),
(6, '2018-05-27 20:25:28', NULL, 'juanito', 'juanito@juan.com', '4214124', 'fr9qfyu1329fyu329', 'º9f3f'),
(7, '2018-05-27 21:19:18', NULL, 'nombresit', 'aasdasd@nasdasd.com', '.', NULL, NULL),
(12, '2018-05-27 21:27:16', NULL, 'nnomnt', 'aasdasd@nasda423sd.com', '342.', NULL, NULL),
(13, '2018-05-27 21:29:08', NULL, 'a111', 'aasd@a.com', '342.', NULL, NULL),
(21, '2018-05-27 21:38:18', NULL, 'a311', 'aasd2@a.com', '342.', NULL, NULL),
(22, '2018-05-27 21:39:10', NULL, 'a312', 'aasd3@a.com', '342.', NULL, NULL),
(23, '2018-05-27 21:39:29', NULL, 'a313', 'aasd4@a.com', '342.', NULL, NULL),
(24, '2018-05-27 21:40:33', NULL, 'a343', 'aasd5@a.com', '342.', NULL, NULL),
(25, '2018-05-27 21:41:15', NULL, 'a3513', 'aasd6@a.com', '342.', NULL, NULL),
(26, '2018-05-27 21:42:03', NULL, 'a3514', 'aasd7@a.com', '342.', NULL, NULL),
(27, '2018-05-27 21:42:12', NULL, 'a23', 'aasd8@a.com', '342.', NULL, NULL),
(28, '2018-05-27 21:44:31', NULL, 'a33', 'aasd21@a.com', '342.', NULL, NULL),
(30, '2018-05-27 23:16:53', NULL, 'hashed', 'hash@a.com', '$2b$10$9tvAwYVXzFvPs77g8lksyuHcOdWO2j/QZpF6/DR1FwcIADbXV9LvC', '123', 'https://api.adorable.io/avatars/250/a.png');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `bans`
--
ALTER TABLE `bans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userID` (`userID`),
  ADD KEY `subID` (`subID`);

--
-- Indices de la tabla `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `authorID` (`authorID`),
  ADD KEY `postID` (`postID`),
  ADD KEY `replyTo` (`replyTo`);

--
-- Indices de la tabla `comment_votes`
--
ALTER TABLE `comment_votes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `voterID` (`voterID`),
  ADD KEY `commentID` (`commentID`);

--
-- Indices de la tabla `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`codename`);

--
-- Indices de la tabla `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `authorID` (`authorID`),
  ADD KEY `subID` (`subID`);

--
-- Indices de la tabla `post_votes`
--
ALTER TABLE `post_votes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `voterID` (`voterID`),
  ADD KEY `postID` (`postID`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`permissionCode`,`roleID`),
  ADD KEY `role_permissions_ibfk_2` (`roleID`);

--
-- Indices de la tabla `subs`
--
ALTER TABLE `subs`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sub_unique` (`userID`,`subID`) USING BTREE,
  ADD KEY `subID` (`subID`),
  ADD KEY `userID` (`userID`) USING BTREE;

--
-- Indices de la tabla `tokens`
--
ALTER TABLE `tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userID` (`userID`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `roleID` (`roleID`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `bans`
--
ALTER TABLE `bans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `comment_votes`
--
ALTER TABLE `comment_votes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `post_votes`
--
ALTER TABLE `post_votes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `subs`
--
ALTER TABLE `subs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tokens`
--
ALTER TABLE `tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `bans`
--
ALTER TABLE `bans`
  ADD CONSTRAINT `bans_ibfk_1` FOREIGN KEY (`subID`) REFERENCES `subscriptions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `bans_ibfk_2` FOREIGN KEY (`userID`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`replyTo`) REFERENCES `comments` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`postID`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`authorID`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `comment_votes`
--
ALTER TABLE `comment_votes`
  ADD CONSTRAINT `comment_votes_ibfk_1` FOREIGN KEY (`commentID`) REFERENCES `comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `comment_votes_ibfk_2` FOREIGN KEY (`voterID`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `posts`
--
ALTER TABLE `posts`
  ADD CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`authorID`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`subID`) REFERENCES `subs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `post_votes`
--
ALTER TABLE `post_votes`
  ADD CONSTRAINT `post_votes_ibfk_1` FOREIGN KEY (`postID`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `post_votes_ibfk_2` FOREIGN KEY (`voterID`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`permissionCode`) REFERENCES `permissions` (`codename`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`roleID`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `subscriptions_ibfk_2` FOREIGN KEY (`subID`) REFERENCES `subs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `tokens`
--
ALTER TABLE `tokens`
  ADD CONSTRAINT `tokens_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`roleID`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
