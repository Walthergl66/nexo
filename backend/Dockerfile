# Etapa dev: la usa docker-compose.yml (target: dev). El codigo entra por
# volumen y nginx corre en otro contenedor, por eso aqui solo va php-fpm.
FROM php:8.4-fpm-alpine AS dev

RUN apk add --no-cache \
    bash \
    curl \
    git \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    postgresql-dev \
    unzip \
  && docker-php-ext-install \
    bcmath \
    intl \
    mbstring \
    opcache \
    pdo_pgsql \
    zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/entrypoint.sh /usr/local/bin/nexo-entrypoint

RUN chmod +x /usr/local/bin/nexo-entrypoint

WORKDIR /var/www/html

ENTRYPOINT ["nexo-entrypoint"]
CMD ["php-fpm"]


# Etapa prod: la usa Render. Va al final a proposito, porque Render no deja
# elegir el target y construye la ultima etapa. Contenedor unico que sirve
# HTTP en $PORT, con el codigo y las dependencias adentro.
FROM dunglas/frankenphp:php8.4-alpine AS prod

RUN install-php-extensions \
      bcmath \
      intl \
      mbstring \
      opcache \
      pdo_pgsql \
      zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Capa de dependencias aparte: se reaprovecha mientras composer.lock no cambie.
COPY composer.json composer.lock ./
RUN composer install \
      --no-dev \
      --no-scripts \
      --no-autoloader \
      --prefer-dist \
      --no-interaction

COPY . .

RUN composer dump-autoload --optimize --no-dev --classmap-authoritative \
  && chown -R www-data:www-data storage bootstrap/cache

COPY docker/render-entrypoint.sh /usr/local/bin/render-entrypoint
RUN chmod +x /usr/local/bin/render-entrypoint

ENTRYPOINT ["render-entrypoint"]
