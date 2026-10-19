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

# --- Keep the Supabase database small -------------------------------------------
# Evolution stores every message, chat, contact and status update in Postgres by
# default. The Next.js app keeps its own trimmed copy (wa_contacts / wa_messages),
# so only the WhatsApp session itself needs to be persisted.
ENV DATABASE_SAVE_DATA_INSTANCE=true
ENV DATABASE_SAVE_DATA_NEW_MESSAGE=false
ENV DATABASE_SAVE_MESSAGE_UPDATE=false
ENV DATABASE_SAVE_DATA_CONTACTS=false
ENV DATABASE_SAVE_DATA_CHATS=false
ENV DATABASE_SAVE_DATA_LABELS=false
ENV DATABASE_SAVE_DATA_HISTORIC=false
