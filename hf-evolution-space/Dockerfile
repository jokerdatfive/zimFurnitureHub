# ==============================================================================
# Evolution API v2 - Hugging Face Docker Space Deployment
# ==============================================================================
# Base Image: Official Evolution API v2 image
FROM evoapicloud/evolution-api:latest

# Hugging Face runs containers under an arbitrary unprivileged user (UID 1000).
# We switch to root to initialize directories and grant full permissions (777),
# preventing EACCES permission denied errors when Baileys writes session tokens.
USER root

# Create necessary persistent store and instance cache directories
RUN mkdir -p /evolution/instances \
    && mkdir -p /evolution/store \
    && mkdir -p /evolution/temp \
    && chmod -R 777 /evolution

# Hugging Face Spaces standard HTTP ingress port is 7860
EXPOSE 7860

# Evolution API server port configuration
ENV SERVER_PORT=7860
ENV PORT=7860
ENV DOCKER_ENV=true
