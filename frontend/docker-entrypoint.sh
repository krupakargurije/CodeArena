#!/bin/sh

# Replace placeholder with actual backend URL
if [ -n "$BACKEND_URL" ]; then
    sed -i "s|BACKEND_URL_PLACEHOLDER|$BACKEND_URL|g" /etc/nginx/conf.d/default.conf
else
    # Default to a placeholder that will show an error if accessed
    sed -i "s|BACKEND_URL_PLACEHOLDER|http://localhost:8080|g" /etc/nginx/conf.d/default.conf
fi

# Start nginx
exec nginx -g 'daemon off;'
