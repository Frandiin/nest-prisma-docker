#!/bin/sh
set -e

# Espera pelo Postgres (simples loop)
echo "Waiting for postgres..."
until nc -z -v -w30 $(echo $DATABASE_URL | sed -n 's/.*@\(.*\):\(.*\)\/.*/\1/p') 5432
do
  echo "Postgres unavailable - sleeping"
  sleep 1
done

echo "Postgres is up - running migrations"
# aplica migrações pendentes de forma segura (deploy -> para produção).
npx prisma migrate deploy

echo "Starting app"
node dist/main.js
