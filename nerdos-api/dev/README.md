# Local development services

`dev-compose.yaml` defines the shared local service stack. Each service keeps its configuration and setup scripts in a named subdirectory:

```text
dev/
├── dev-compose.yaml
└── redis/
    ├── redis.conf
    ├── setup-redis-tls.sh
    ├── .env                   # Generated credentials; ignored by Git
    └── certs/                 # Generated TLS and ACL files; ignored by Git
```

See the [API README](../README.md#local-redis-with-docker-compose) for Redis setup and API connection instructions. Redis listens only on the host's loopback interface and uses generated credentials intended solely for local development.

To add a service, create a subdirectory for its configuration and setup files, add it to the shared Compose file using paths relative to that file, and document any setup and environment variables. Keep generated credentials, certificates, and persistent data out of Git; use named volumes for persistent container data and bind published ports to localhost where possible.
